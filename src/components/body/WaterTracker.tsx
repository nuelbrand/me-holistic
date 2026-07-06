import { useEffect, useState } from "react";
import { Droplet, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function WaterTracker() {
  const { user } = useAuth();
  const stats = useStats();
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);
  const [hitToday, setHitToday] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("water_logs").select("*").eq("user_id", user.id).eq("log_date", todayISO()).maybeSingle();
    if (data) { setGlasses(data.glasses); setGoal(data.goal); setHitToday(data.glasses >= data.goal); }
    else { setGlasses(0); setHitToday(false); }
  };
  useEffect(() => { load(); }, [user?.id]);

  const save = async (g: number) => {
    if (!user) return;
    setGlasses(g);
    await supabase.from("water_logs").upsert(
      { user_id: user.id, log_date: todayISO(), glasses: g, goal },
      { onConflict: "user_id,log_date" }
    );
    if (g >= goal && !hitToday) {
      setHitToday(true);
      await awardXp(user.id, "water_goal_hit");
      stats.refresh();
      toast.success(`Hydration goal hit · +10 XP 💧`);
    }
  };

  const pct = Math.min(100, (glasses / goal) * 100);

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body">Water</div>
        </div>
        <label className="text-[10px] text-muted-foreground">
          Goal
          <input type="number" min={1} max={20} value={goal} onChange={(e) => setGoal(+e.target.value || 8)}
            className="ml-1 w-10 bg-background border border-border rounded-md px-1 text-xs" />
        </label>
      </div>
      <div className="flex items-center gap-3 my-3">
        <button onClick={() => save(Math.max(0, glasses - 1))} className="press p-3 rounded-xl border border-border"><Minus className="h-4 w-4" /></button>
        <div className="text-4xl font-black text-body flex-1 text-center">{glasses}<span className="text-base text-muted-foreground ml-1">/ {goal}</span></div>
        <button onClick={() => save(glasses + 1)} className="press p-3 rounded-xl bg-body text-body-foreground"><Plus className="h-4 w-4" /></button>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-body transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
