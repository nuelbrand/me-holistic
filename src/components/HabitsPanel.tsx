import { useEffect, useState } from "react";
import { Plus, Check, X, Flame, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Habit {
  id: string;
  title: string;
  color: string;
  archived: boolean;
}
interface Log {
  habit_id: string;
  log_date: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

function streakFor(habitId: string, logs: Log[]) {
  const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
  let s = 0;
  for (let i = 0; i < 365; i++) {
    if (set.has(daysAgoISO(i))) s++;
    else if (i === 0) continue; // allow today to be uncompleted
    else break;
  }
  return s;
}

export function HabitsPanel() {
  const { user } = useAuth();
  const stats = useStats();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  const load = async () => {
    if (!user) return;
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).eq("archived", false).order("order_index"),
      supabase.from("habit_logs").select("habit_id, log_date").eq("user_id", user.id).gte("log_date", daysAgoISO(60)),
    ]);
    setHabits((h ?? []) as Habit[]);
    setLogs((l ?? []) as Log[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    const { data } = await supabase.from("habits").insert({ user_id: user.id, title: newTitle.trim(), order_index: habits.length }).select().single();
    if (data) setHabits((h) => [...h, data as Habit]);
    setNewTitle("");
  };

  const toggle = async (h: Habit) => {
    if (!user) return;
    const already = logs.some((l) => l.habit_id === h.id && l.log_date === today);
    if (already) {
      await supabase.from("habit_logs").delete().eq("habit_id", h.id).eq("log_date", today);
      setLogs((ls) => ls.filter((l) => !(l.habit_id === h.id && l.log_date === today)));
    } else {
      await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: h.id, log_date: today });
      setLogs((ls) => [...ls, { habit_id: h.id, log_date: today }]);
      await awardXp(user.id, "habit_checked");
      stats.refresh();
      toast.success(`${h.title} ✓`);
    }
  };

  const remove = async (h: Habit) => {
    await supabase.from("habits").update({ archived: true }).eq("id", h.id);
    setHabits((hs) => hs.filter((x) => x.id !== h.id));
  };

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-xs uppercase tracking-wider text-mind">Habit builder</div>
        <span className="text-[10px] text-muted-foreground">{habits.length} active</span>
      </div>
      {loading ? (
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
      ) : (
        <>
          <div className="space-y-2">
            {habits.map((h) => {
              const doneToday = logs.some((l) => l.habit_id === h.id && l.log_date === today);
              const streak = streakFor(h.id, logs);
              return (
                <div key={h.id} className="press flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <button onClick={() => toggle(h)} className={cn("h-6 w-6 rounded-md border-2 grid place-items-center shrink-0",
                    doneToday ? "bg-mind border-mind text-mind-foreground animate-pop" : "border-border")}>
                    {doneToday && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <span className="flex-1 text-sm font-medium">{h.title}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold">
                    <Flame className="h-3.5 w-3.5" /> {streak}
                  </span>
                  <button onClick={() => remove(h)} className="press text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {habits.length === 0 && <p className="text-sm text-muted-foreground py-2">Add your first daily habit below.</p>}
          </div>
          <form onSubmit={addHabit} className="mt-3 flex gap-2">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Drink 2L water"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-mind text-mind-foreground text-sm font-semibold">
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
