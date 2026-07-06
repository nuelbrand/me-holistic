import { useEffect, useState } from "react";
import { Plus, Trash2, Dumbbell, Timer, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

type Kind = "strength" | "cardio" | "run" | "ride" | "walk" | "swim" | "yoga" | "hiit" | "mobility" | "sport" | "other";
const KINDS: Kind[] = ["strength", "run", "ride", "cardio", "walk", "swim", "yoga", "hiit", "mobility", "sport", "other"];

interface SetRow { reps: number; weight_kg: number; rpe?: number }
interface Exercise { id?: string; exercise: string; sets: SetRow[]; order_index: number; notes?: string }
interface Workout {
  id: string;
  performed_at: string;
  kind: Kind;
  title: string | null;
  duration_min: number;
  intensity: number;
  distance_km: number | null;
  calories: number | null;
  notes: string | null;
  source: string;
  workout_exercises?: Exercise[];
}

export function WorkoutLogger() {
  const { user } = useAuth();
  const stats = useStats();
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"quick" | "strength">("quick");
  const [expanded, setExpanded] = useState<string | null>(null);

  // draft state
  const [kind, setKind] = useState<Kind>("strength");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState(3);
  const [distance, setDistance] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([{ exercise: "", sets: [{ reps: 8, weight_kg: 0 }], order_index: 0 }]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("workouts")
      .select("*, workout_exercises(id, exercise, sets, order_index, notes)")
      .eq("user_id", user.id)
      .order("performed_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Workout[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const reset = () => {
    setKind("strength"); setTitle(""); setDuration(45); setIntensity(3); setDistance(""); setCalories(""); setNotes("");
    setExercises([{ exercise: "", sets: [{ reps: 8, weight_kg: 0 }], order_index: 0 }]);
  };

  const save = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      kind, title: title || null,
      duration_min: duration,
      intensity,
      distance_km: distance ? Number(distance) : null,
      calories: calories ? Number(calories) : null,
      notes: notes || null,
      source: "manual",
    };
    const { data: w, error } = await supabase.from("workouts").insert(payload).select().single();
    if (error || !w) { toast.error(error?.message ?? "Failed to save"); return; }

    if (mode === "strength") {
      const rows = exercises
        .filter((e) => e.exercise.trim() && e.sets.length > 0)
        .map((e, i) => ({
          user_id: user.id,
          workout_id: w.id,
          exercise: e.exercise.trim(),
          order_index: i,
          sets: e.sets,
          notes: e.notes ?? null,
        }));
      if (rows.length) await supabase.from("workout_exercises").insert(rows);
    }
    await awardXp(user.id, "workout_logged");
    stats.refresh();
    toast.success(`Workout logged · +20 XP`);
    setOpen(false); reset(); load();
  };

  const remove = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  // Simple last-7-days totals
  const weekMin = items
    .filter((w) => Date.now() - new Date(w.performed_at).getTime() < 7 * 86400000)
    .reduce((s, w) => s + (w.duration_min || 0), 0);
  const weekCount = items.filter((w) => Date.now() - new Date(w.performed_at).getTime() < 7 * 86400000).length;

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body">Workouts</div>
          <span className="text-[10px] text-muted-foreground">· {weekCount} this week · {weekMin}m</span>
        </div>
        <button onClick={() => { setOpen(true); reset(); }} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-body text-body-foreground text-sm font-semibold">
          <Plus className="h-3.5 w-3.5" /> Log workout
        </button>
      </div>

      {loading ? (
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No workouts logged yet. Tap "Log workout".</p>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {items.map((w) => {
            const isOpen = expanded === w.id;
            const hasSets = (w.workout_exercises?.length ?? 0) > 0;
            return (
              <li key={w.id} className="p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-body/15 text-body grid place-items-center text-xs font-bold uppercase">{w.kind.slice(0, 3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{w.title || w.kind}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {format(new Date(w.performed_at), "EEE MMM d")} · {w.duration_min}m · intensity {w.intensity}/5
                      {w.distance_km ? ` · ${w.distance_km}km` : ""}
                      {w.source !== "manual" ? ` · ${w.source}` : ""}
                    </div>
                  </div>
                  {hasSets && (
                    <button onClick={() => setExpanded(isOpen ? null : w.id)} className="press p-1.5 rounded-md hover:bg-muted">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => remove(w.id)} className="press p-1.5 rounded-md text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isOpen && hasSets && (
                  <div className="mt-2 pl-12 space-y-1">
                    {w.workout_exercises!.map((e) => (
                      <div key={e.id} className="text-xs">
                        <span className="font-semibold">{e.exercise}:</span>{" "}
                        <span className="text-muted-foreground">{(e.sets as SetRow[]).map((s) => `${s.reps}×${s.weight_kg}kg`).join(" · ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl animate-[slide-in_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Log workout</div>
              <button onClick={() => setOpen(false)} className="press p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-2 mb-3">
              {(["quick", "strength"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn("press flex-1 px-3 py-2 rounded-xl text-sm font-semibold border",
                    mode === m ? "bg-body text-body-foreground border-body" : "border-border")}>
                  {m === "quick" ? "Quick session" : "Sets & reps"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                <span className="text-muted-foreground">Type</span>
                <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm">
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Duration (min)</span>
                <input type="number" min={1} value={duration} onChange={(e) => setDuration(+e.target.value || 0)} className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              </label>
              <label className="text-xs col-span-2">
                <span className="text-muted-foreground">Title (optional)</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Push day / 5k tempo…" className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Intensity 1–5</span>
                <input type="range" min={1} max={5} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="mt-2 w-full accent-body" />
                <div className="text-center text-body font-bold text-sm">{intensity}</div>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  <span className="text-muted-foreground">Dist (km)</span>
                  <input type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-xl px-2 py-2 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-muted-foreground">Cal</span>
                  <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-xl px-2 py-2 text-sm" />
                </label>
              </div>
            </div>

            {mode === "strength" && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-body mb-2">Exercises</div>
                <div className="space-y-3">
                  {exercises.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <input value={ex.exercise} onChange={(e) => {
                          const c = [...exercises]; c[i] = { ...c[i], exercise: e.target.value }; setExercises(c);
                        }} placeholder="Bench press" className="flex-1 bg-transparent border-b border-border px-1 py-1 text-sm focus:outline-none focus:border-body" />
                        <button onClick={() => setExercises(exercises.filter((_, j) => j !== i))} className="press text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {ex.sets.map((s, si) => (
                          <div key={si} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs">
                            <span className="text-muted-foreground w-6">#{si + 1}</span>
                            <label>
                              <input type="number" min={0} value={s.reps} onChange={(e) => {
                                const c = [...exercises]; c[i].sets[si] = { ...s, reps: +e.target.value || 0 }; setExercises(c);
                              }} placeholder="reps" className="w-full bg-background border border-border rounded-md px-2 py-1" />
                            </label>
                            <label>
                              <input type="number" min={0} step="0.5" value={s.weight_kg} onChange={(e) => {
                                const c = [...exercises]; c[i].sets[si] = { ...s, weight_kg: +e.target.value || 0 }; setExercises(c);
                              }} placeholder="kg" className="w-full bg-background border border-border rounded-md px-2 py-1" />
                            </label>
                            <button onClick={() => {
                              const c = [...exercises]; c[i].sets = c[i].sets.filter((_, j) => j !== si); setExercises(c);
                            }} className="press text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => {
                        const c = [...exercises]; const last = c[i].sets.at(-1); c[i].sets.push({ reps: last?.reps ?? 8, weight_kg: last?.weight_kg ?? 0 }); setExercises(c);
                      }} className="press mt-2 text-xs text-body font-semibold">+ Add set</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setExercises([...exercises, { exercise: "", sets: [{ reps: 8, weight_kg: 0 }], order_index: exercises.length }])}
                  className="press mt-2 w-full py-2 rounded-xl border border-dashed border-border text-xs font-semibold">
                  + Add exercise
                </button>
              </div>
            )}

            <label className="block text-xs mt-3">
              <span className="text-muted-foreground">Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none" />
            </label>

            <button onClick={save} className="press mt-4 w-full inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-body text-body-foreground text-sm font-semibold">
              <Save className="h-4 w-4" /> Save workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
