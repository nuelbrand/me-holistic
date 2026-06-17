import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Smile, Meh, Frown, Star, Plus, X, Zap, ArrowRight } from "lucide-react";
import { useApp, type Mood } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · me." }] }),
  component: Dashboard,
});

const MOODS: { m: Mood; icon: typeof Smile }[] = [
  { m: "Excellent", icon: Star }, { m: "Good", icon: Smile }, { m: "Neutral", icon: Meh }, { m: "Stressed", icon: Frown },
];

function Dashboard() {
  const { user, mood, setMood, tasks, toggleTask, addTask, removeTask, lifeHappens, setLifeHappens, moodHistory } = useApp();
  const [newTask, setNewTask] = useState("");
  const done = tasks.filter((t) => t.done).length;

  return (
    <div>
      <PageHeader title={`Hi, ${user.name} 👋`} subtitle={`${user.detailB || "On your path"} ${user.detailA ? "at " + user.detailA : ""} · ${user.phase}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Today's mood</div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {MOODS.map(({ m, icon: Icon }) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={cn("press flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium",
                  mood === m ? "bg-primary text-primary-foreground border-primary animate-pulse-glow" : "bg-background border-border")}
              >
                <Icon className="h-5 w-5" /> {m}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-xs text-muted-foreground mb-2">This week</div>
            <div className="flex items-end gap-1 h-20">
              {moodHistory.slice(-7).map((d, i) => {
                const h = d.mood === "Excellent" ? 100 : d.mood === "Good" ? 75 : d.mood === "Neutral" ? 45 : 25;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-md bg-gradient-to-t from-primary to-mind transition-all duration-500" style={{ height: `${h}%` }} />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Today's timeline</div>
              <div className="text-lg font-bold">{done}/{tasks.length} complete</div>
            </div>
            <button onClick={() => setLifeHappens(!lifeHappens)} className={cn("press inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border",
              lifeHappens ? "bg-mind text-mind-foreground border-mind animate-pulse-glow" : "border-border")}>
              <Zap className="h-3.5 w-3.5" /> Life Happens {lifeHappens ? "On" : "Off"}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="press flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <button onClick={() => toggleTask(t.id)} className={cn("h-5 w-5 rounded-md border-2 grid place-items-center shrink-0",
                  t.done ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {t.done && <span className="text-[10px]">✓</span>}
                </button>
                <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>{t.text}</span>
                <button onClick={() => removeTask(t.id)} className="text-muted-foreground hover:text-destructive press"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { addTask(newTask.trim()); setNewTask(""); } }}
            className="mt-4 flex gap-2"
          >
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a custom habit…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /></button>
          </form>
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-faith">Faith</div>
          <div className="text-2xl font-black mt-1">Stay rooted.</div>
          <p className="text-sm text-muted-foreground mt-2">Open today's scripture and pray for one person.</p>
        </div>
        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-mind">Mind</div>
          <div className="text-2xl font-black mt-1">Renew your thinking.</div>
          <p className="text-sm text-muted-foreground mt-2">10 minutes of reflection beats 1 hour of scroll.</p>
        </div>
        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-body">Body</div>
          <div className="text-2xl font-black mt-1">Honor the temple.</div>
          <p className="text-sm text-muted-foreground mt-2">Hydrate, move, sleep — the unsexy basics compound.</p>
        </div>
      </div>
    </div>
  );
}
