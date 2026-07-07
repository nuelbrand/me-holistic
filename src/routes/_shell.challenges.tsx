import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Plus, Check, Flame, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/challenges")({
  head: () => ({ meta: [{ title: "Challenges · me." }] }),
  component: ChallengesPage,
});

interface Tribe { id: string; name: string }
interface Challenge {
  id: string; tribe_id: string; title: string; description: string | null;
  duration_days: number; starts_on: string; created_by: string | null; created_at: string;
}
interface Progress { challenge_id: string; user_id: string; log_date: string }
interface Profile { id: string; username: string | null }

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function ChallengesPage() {
  const { user } = useAuth();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState<string | null>(null); // tribe_id
  const [form, setForm] = useState({ title: "", description: "", duration: 30 });

  const load = async () => {
    if (!user) return;
    const [t, m, c, p] = await Promise.all([
      supabase.from("tribes").select("id, name").order("created_at"),
      supabase.from("tribe_members").select("tribe_id").eq("user_id", user.id),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("challenge_progress").select("challenge_id, user_id, log_date"),
    ]);
    setTribes((t.data as Tribe[]) ?? []);
    setJoined(new Set(((m.data ?? []) as any[]).map((x) => x.tribe_id)));
    setChallenges((c.data as Challenge[]) ?? []);
    setProgress((p.data as Progress[]) ?? []);
    // Load participant usernames
    const uids = Array.from(new Set(((p.data ?? []) as any[]).map((x) => x.user_id)));
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", uids);
      const map: Record<string, string> = {};
      for (const pr of (profs ?? []) as Profile[]) map[pr.id] = pr.username || "Member";
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const myTribes = useMemo(() => tribes.filter((t) => joined.has(t.id)), [tribes, joined]);
  const today = new Date().toISOString().slice(0, 10);

  const createChallenge = async (tribeId: string) => {
    if (!user || !form.title.trim()) return;
    const { data, error } = await supabase.from("challenges").insert({
      tribe_id: tribeId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      duration_days: form.duration,
      created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setChallenges((cs) => [data as Challenge, ...cs]);
    setForm({ title: "", description: "", duration: 30 });
    setCreating(null);
    toast.success("Challenge created 🎯");
  };

  const checkIn = async (ch: Challenge) => {
    if (!user) return;
    const already = progress.some((p) => p.challenge_id === ch.id && p.user_id === user.id && p.log_date === today);
    if (already) return;
    const { error } = await supabase.from("challenge_progress").insert({
      challenge_id: ch.id, user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    setProgress((ps) => [...ps, { challenge_id: ch.id, user_id: user.id, log_date: today }]);
    toast.success("Checked in for today 🔥");
  };

  const leaderboard = (ch: Challenge) => {
    const counts = new Map<string, number>();
    for (const p of progress) {
      if (p.challenge_id !== ch.id) continue;
      counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([uid, n]) => ({ uid, name: profiles[uid] || (uid === user?.id ? "You" : "Member"), days: n }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 10);
  };

  const dayNum = (ch: Challenge) => Math.min(ch.duration_days, Math.max(1, daysBetween(ch.starts_on, today) + 1));

  return (
    <div>
      <PageHeader title="Group Challenges" subtitle="Show up together. Compete in kindness. Streaks build community." accent="body" />

      {myTribes.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground text-center">
          Join a tribe first to see and create challenges.
        </div>
      )}

      <div className="space-y-6">
        {myTribes.map((tribe) => {
          const tribeChallenges = challenges.filter((c) => c.tribe_id === tribe.id);
          return (
            <section key={tribe.id} className="lift rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-primary" />
                  <div className="font-bold text-lg">{tribe.name}</div>
                  <span className="text-xs text-muted-foreground">{tribeChallenges.length} challenges</span>
                </div>
                <button
                  onClick={() => setCreating(creating === tribe.id ? null : tribe.id)}
                  className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> New Challenge
                </button>
              </div>

              {creating === tribe.id && (
                <form
                  onSubmit={(e) => { e.preventDefault(); createChallenge(tribe.id); }}
                  className="mb-4 grid gap-2 rounded-2xl border border-border bg-background p-3"
                >
                  <input
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Bible in 30 days" maxLength={120}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm"
                  />
                  <textarea
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description / rules" maxLength={1000} rows={2}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Days:</label>
                    <input type="number" min={1} max={365} value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: Math.max(1, Math.min(365, Number(e.target.value) || 30)) })}
                      className="w-20 bg-card border border-border rounded-xl px-3 py-2 text-sm" />
                    <button className="press ml-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create</button>
                  </div>
                </form>
              )}

              {tribeChallenges.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No challenges yet — start one.</div>
              )}

              <div className="grid gap-3">
                {tribeChallenges.map((ch) => {
                  const board = leaderboard(ch);
                  const mine = board.find((b) => b.uid === user?.id);
                  const dn = dayNum(ch);
                  const done = mine?.days ?? 0;
                  const pct = Math.min(100, Math.round((done / ch.duration_days) * 100));
                  const checkedToday = progress.some((p) => p.challenge_id === ch.id && p.user_id === user?.id && p.log_date === today);
                  return (
                    <div key={ch.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="font-bold flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            {ch.title}
                            <span className="text-xs text-muted-foreground font-normal">day {dn}/{ch.duration_days}</span>
                          </div>
                          {ch.description && <p className="text-sm text-muted-foreground mt-1">{ch.description}</p>}
                        </div>
                        <button
                          onClick={() => checkIn(ch)}
                          disabled={checkedToday}
                          className={cn(
                            "press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold",
                            checkedToday
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {checkedToday ? "Done today" : "Check in"}
                        </button>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Your progress</span>
                          <span>{done}/{ch.duration_days} days · {pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-faith" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {board.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Leaderboard</div>
                          <ol className="space-y-1">
                            {board.map((row, i) => (
                              <li key={row.uid} className={cn(
                                "flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg",
                                row.uid === user?.id && "bg-primary/10",
                              )}>
                                <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                                <span className="flex-1 truncate font-medium">{row.name}</span>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Flame className="h-3 w-3 text-orange-500" /> {row.days}d
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
