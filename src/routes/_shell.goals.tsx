import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, ChevronRight, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { awardXp } from "@/lib/xp";
import { useStats } from "@/lib/stats-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Scope = "yearly" | "quarterly" | "weekly" | "daily";
type Status = "active" | "done" | "archived";

interface Goal {
  id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  scope: Scope;
  status: Status;
  target_date: string | null;
  order_index: number;
}

const SCOPES: { key: Scope; label: string; color: string }[] = [
  { key: "yearly", label: "Yearly", color: "text-faith" },
  { key: "quarterly", label: "Quarterly", color: "text-mind" },
  { key: "weekly", label: "Weekly", color: "text-body" },
  { key: "daily", label: "Daily", color: "text-primary" },
];

export const Route = createFileRoute("/_shell/goals")({
  head: () => ({ meta: [{ title: "Goals · me." }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { refresh: refreshStats } = useStats();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [busy, setBusy] = useState(false);
  const [newBy, setNewBy] = useState<Record<Scope, string>>({ yearly: "", quarterly: "", weekly: "", daily: "" });
  const [parentBy, setParentBy] = useState<Record<Scope, string>>({ yearly: "", quarterly: "", weekly: "", daily: "" });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", replace: true });
  }, [user, loading, nav]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("scope").order("order_index");
    setGoals((data as Goal[]) ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const add = async (scope: Scope) => {
    const title = newBy[scope].trim();
    if (!title || !user) return;
    setBusy(true);
    const parent_id = parentBy[scope] || null;
    const { data } = await supabase.from("goals").insert({ user_id: user.id, title, scope, parent_id }).select().single();
    if (data) setGoals((g) => [...g, data as Goal]);
    setNewBy((n) => ({ ...n, [scope]: "" }));
    setBusy(false);
  };

  const toggle = async (g: Goal) => {
    const next: Status = g.status === "done" ? "active" : "done";
    setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, status: next } : x)));
    await supabase.from("goals").update({ status: next, completed_at: next === "done" ? new Date().toISOString() : null }).eq("id", g.id);
    if (next === "done") {
      await awardXp(user?.id, "goal_completed");
      refreshStats();
      toast.success("+30 XP · Goal complete 🎯");
    }
  };

  const remove = async (id: string) => {
    setGoals((gs) => gs.filter((x) => x.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  };

  const byScope = (s: Scope) => goals.filter((g) => g.scope === s);
  const parentOptions = (s: Scope): Goal[] => {
    const parentScopeIdx = SCOPES.findIndex((x) => x.key === s) - 1;
    if (parentScopeIdx < 0) return [];
    return byScope(SCOPES[parentScopeIdx].key);
  };

  const progressOf = (parent: Goal) => {
    const children = goals.filter((g) => g.parent_id === parent.id);
    if (!children.length) return null;
    const done = children.filter((c) => c.status === "done").length;
    return { done, total: children.length, pct: Math.round((done / children.length) * 100) };
  };

  return (
    <div>
      <PageHeader title="Goals" subtitle="Cascade your vision from year → quarter → week → day. Every daily step rolls up." />
      <div className="grid gap-5">
        {SCOPES.map(({ key, label, color }) => {
          const items = byScope(key);
          const parents = parentOptions(key);
          return (
            <section key={key} className="lift rounded-3xl border border-border bg-card p-6 animate-[fade-in_0.4s_ease-out]">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Target className={cn("h-4 w-4", color)} />
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                  <span className="text-xs text-muted-foreground">· {items.filter((i) => i.status === "done").length}/{items.length}</span>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); add(key); }} className="flex gap-2 mb-4 flex-wrap">
                <input
                  value={newBy[key]}
                  onChange={(e) => setNewBy((n) => ({ ...n, [key]: e.target.value }))}
                  placeholder={`Add a ${label.toLowerCase()} goal…`}
                  className="flex-1 min-w-[200px] bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {parents.length > 0 && (
                  <select
                    value={parentBy[key]}
                    onChange={(e) => setParentBy((p) => ({ ...p, [key]: e.target.value }))}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm max-w-[240px]"
                    title="Roll up into…"
                  >
                    <option value="">— no parent —</option>
                    {parents.map((p) => <option key={p.id} value={p.id}>↑ {p.title}</option>)}
                  </select>
                )}
                <button disabled={busy} className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </form>

              {items.length === 0 && <div className="text-sm text-muted-foreground py-3 text-center">No {label.toLowerCase()} goals yet.</div>}

              <ul className="space-y-2">
                {items.map((g) => {
                  const prog = progressOf(g);
                  return (
                    <li key={g.id} className="press flex items-start gap-3 p-3 rounded-xl bg-background border border-border">
                      <button onClick={() => toggle(g)} className="mt-0.5 shrink-0" title="Toggle done">
                        {g.status === "done" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-medium", g.status === "done" && "line-through text-muted-foreground")}>{g.title}</div>
                        {prog && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden max-w-[200px]">
                              <div className="h-full bg-gradient-to-r from-primary to-faith transition-all" style={{ width: `${prog.pct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{prog.done}/{prog.total} ↓ children</span>
                          </div>
                        )}
                        {g.parent_id && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <ChevronRight className="h-3 w-3" /> rolls up
                          </div>
                        )}
                      </div>
                      <button onClick={() => remove(g.id)} className="press text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
