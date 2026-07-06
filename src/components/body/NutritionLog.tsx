import { useEffect, useState } from "react";
import { Apple, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Row { id: string; log_date: string; meal: string; description: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }

const todayISO = () => new Date().toISOString().slice(0, 10);
const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export function NutritionLog() {
  const { user } = useAuth();
  const stats = useStats();
  const [rows, setRows] = useState<Row[]>([]);
  const [meal, setMeal] = useState<typeof MEALS[number]>("breakfast");
  const [desc, setDesc] = useState("");
  const [cal, setCal] = useState("");
  const [protein, setProtein] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("nutrition_logs").select("*").eq("user_id", user.id).eq("log_date", todayISO()).order("created_at");
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !desc.trim()) return;
    const { data, error } = await supabase.from("nutrition_logs").insert({
      user_id: user.id, log_date: todayISO(), meal, description: desc.trim(),
      calories: cal ? Number(cal) : null, protein_g: protein ? Number(protein) : null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) setRows((r) => [...r, data as Row]);
    await awardXp(user.id, "nutrition_logged");
    stats.refresh();
    setDesc(""); setCal(""); setProtein("");
    toast.success("Logged · +5 XP");
  };

  const remove = async (id: string) => {
    await supabase.from("nutrition_logs").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const totals = rows.reduce((acc, r) => ({
    cal: acc.cal + (r.calories ?? 0), p: acc.p + (r.protein_g ?? 0),
  }), { cal: 0, p: 0 });

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Apple className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body">Today's nutrition</div>
        </div>
        <span className="text-[10px] text-muted-foreground">{totals.cal} kcal · {totals.p}g protein</span>
      </div>

      <form onSubmit={add} className="space-y-2">
        <div className="flex gap-1">
          {MEALS.map((m) => (
            <button key={m} type="button" onClick={() => setMeal(m)}
              className={cn("press flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold capitalize",
                meal === m ? "bg-body text-body-foreground" : "bg-muted text-muted-foreground")}>
              {m}
            </button>
          ))}
        </div>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Oats + banana + almond butter"
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="kcal"
            className="bg-background border border-border rounded-xl px-2 py-2 text-xs" />
          <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="protein g"
            className="bg-background border border-border rounded-xl px-2 py-2 text-xs" />
          <button className="press inline-flex items-center justify-center gap-1 rounded-xl bg-body text-body-foreground text-sm font-semibold">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>

      <ul className="mt-3 space-y-1 max-h-56 overflow-y-auto">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-xs">
            <span className="uppercase text-[9px] text-muted-foreground w-14 shrink-0">{r.meal}</span>
            <span className="flex-1 truncate">{r.description}</span>
            {r.calories && <span className="text-muted-foreground">{r.calories}k</span>}
            <button onClick={() => remove(r.id)} className="press text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-xs text-muted-foreground py-2">Nothing logged today.</li>}
      </ul>
    </div>
  );
}
