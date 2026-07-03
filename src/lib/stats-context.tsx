import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { levelFromXp, xpToNext } from "@/lib/xp";

interface Stats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  xpToday: number;
  progressPct: number;
  currentInLevel: number;
  neededInLevel: number;
}

const empty: Stats = { totalXp: 0, level: 1, currentStreak: 0, longestStreak: 0, xpToday: 0, progressPct: 0, currentInLevel: 0, neededInLevel: 50 };

interface Ctx extends Stats {
  refresh: () => Promise<void>;
}

const StatsCtx = createContext<Ctx>({ ...empty, refresh: async () => {} });

export function StatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>(empty);

  const refresh = useCallback(async () => {
    if (!user) { setStats(empty); return; }
    const { data } = await supabase.rpc("get_user_stats", { _user_id: user.id });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      const total = row.total_xp ?? 0;
      const p = xpToNext(total);
      setStats({
        totalXp: total,
        level: row.level ?? levelFromXp(total),
        currentStreak: row.current_streak ?? 0,
        longestStreak: row.longest_streak ?? 0,
        xpToday: row.xp_today ?? 0,
        progressPct: p.pct,
        currentInLevel: p.current,
        neededInLevel: p.needed,
      });
    }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh whenever an xp_event is inserted for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`xp-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "xp_events", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  return <StatsCtx.Provider value={{ ...stats, refresh }}>{children}</StatsCtx.Provider>;
}

export const useStats = () => useContext(StatsCtx);
