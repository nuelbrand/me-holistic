import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESETS = [15, 25, 45, 60];

export function FocusTimer() {
  const { user } = useAuth();
  const stats = useStats();
  const [duration, setDuration] = useState(25);
  const [label, setLabel] = useState("Deep work");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [todayMin, setTodayMin] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadToday = async () => {
    if (!user) return;
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("focus_sessions")
      .select("actual_min")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("started_at", since.toISOString());
    setTodayMin((data ?? []).reduce((s, r: any) => s + (r.actual_min || 0), 0));
  };

  useEffect(() => { loadToday(); }, [user?.id]);
  useEffect(() => { if (!running) setRemaining(duration * 60); }, [duration, running]);

  const finish = async (completed: boolean) => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setRunning(false);
    if (!user || !startedAt) return;
    const elapsed = Math.round((Date.now() - startedAt) / 60000);
    await supabase.from("focus_sessions").insert({
      user_id: user.id, label, planned_min: duration, actual_min: elapsed, completed,
      ended_at: new Date().toISOString(),
    });
    if (completed) {
      await awardXp(user.id, "focus_completed");
      stats.refresh();
      toast.success(`Focus session complete — ${elapsed}m banked.`);
      try { new Audio("data:audio/wav;base64,UklGRnQGAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YVAGAAA=").play().catch(() => {}); } catch {}
    }
    setStartedAt(null);
    setRemaining(duration * 60);
    loadToday();
  };

  const start = () => {
    if (running) return;
    setRunning(true);
    setStartedAt(Date.now());
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          finish(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };
  const pause = () => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setRunning(false);
  };
  const reset = () => {
    pause();
    setRemaining(duration * 60);
    setStartedAt(null);
  };

  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = 100 - (remaining / (duration * 60)) * 100;

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-wider text-mind inline-flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" /> Focus timer
        </div>
        <span className="text-[10px] text-muted-foreground">{todayMin}m today</span>
      </div>

      <div className="relative h-32 grid place-items-center">
        <div className="absolute inset-0 rounded-full bg-mind/5" />
        <div className="text-5xl font-black tabular-nums tracking-tight text-mind">{mm}:{ss}</div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-to-r from-mind to-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What are you focusing on?"
        disabled={running}
        className="mt-4 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />

      <div className="grid grid-cols-4 gap-2 mt-3">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => setDuration(p)} disabled={running}
            className={cn("press px-2 py-2 rounded-xl border text-xs font-semibold",
              duration === p ? "bg-mind text-mind-foreground border-mind" : "bg-background border-border",
              running && "opacity-50 cursor-not-allowed")}>
            {p}m
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {!running ? (
          <button onClick={start} className="press inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-mind text-mind-foreground text-sm font-semibold">
            <Play className="h-4 w-4" /> Start
          </button>
        ) : (
          <button onClick={pause} className="press inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-mind text-mind-foreground text-sm font-semibold">
            <Pause className="h-4 w-4" /> Pause
          </button>
        )}
        <button onClick={reset} className="press inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-border text-sm font-semibold">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}
