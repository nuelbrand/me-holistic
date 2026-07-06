import { useEffect, useState } from "react";
import { Scale, TrendingUp, TrendingDown, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Row { id: string; log_date: string; weight_kg: number; body_fat_pct: number | null }

const todayISO = () => new Date().toISOString().slice(0, 10);

export function WeightTracker() {
  const { user } = useAuth();
  const stats = useStats();
  const [rows, setRows] = useState<Row[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [bf, setBf] = useState<string>("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("weight_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(60);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const save = async () => {
    if (!user || !weight) return;
    const { error } = await supabase.from("weight_logs").upsert(
      { user_id: user.id, log_date: todayISO(), weight_kg: Number(weight), body_fat_pct: bf ? Number(bf) : null, source: "manual" },
      { onConflict: "user_id,log_date" }
    );
    if (error) { toast.error(error.message); return; }
    await awardXp(user.id, "weight_logged");
    stats.refresh();
    toast.success(`Weight logged · +5 XP`);
    setWeight(""); setBf("");
    load();
  };

  const chartData = [...rows].reverse().map((r) => ({ date: format(parseISO(r.log_date), "MMM d"), weight: Number(r.weight_kg) }));
  const first = rows[rows.length - 1];
  const last = rows[0];
  const delta = first && last ? Number(last.weight_kg) - Number(first.weight_kg) : 0;

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body">Weight</div>
        </div>
        {rows.length > 1 && (
          <span className={`text-[10px] inline-flex items-center gap-0.5 ${delta > 0 ? "text-orange-500" : "text-emerald-500"}`}>
            {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}kg over {rows.length}d
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight kg"
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <input type="number" step="0.1" value={bf} onChange={(e) => setBf(e.target.value)} placeholder="Body fat %"
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <button onClick={save} disabled={!weight} className="press mt-2 w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-body text-body-foreground text-sm font-semibold disabled:opacity-50">
        <Save className="h-4 w-4" /> Log today
      </button>

      {chartData.length > 1 && (
        <div className="mt-4 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--body))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--body))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="weight" stroke="hsl(var(--body))" fill="url(#wg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
