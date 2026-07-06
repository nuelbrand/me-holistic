import { useEffect, useState } from "react";
import { Moon, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Row { id: string; log_date: string; hours: number; quality: number | null; notes: string | null }

const todayISO = () => new Date().toISOString().slice(0, 10);

export function SleepTracker() {
  const { user } = useAuth();
  const stats = useStats();
  const [rows, setRows] = useState<Row[]>([]);
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("sleep_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("sleep_logs").upsert(
      { user_id: user.id, log_date: todayISO(), hours, quality, notes: notes || null, source: "manual" },
      { onConflict: "user_id,log_date" }
    );
    if (error) { toast.error(error.message); return; }
    await awardXp(user.id, "sleep_logged");
    stats.refresh();
    toast.success(`Sleep logged · +8 XP`);
    setNotes("");
    load();
  };

  const chartData = [...rows].reverse().map((r) => ({ date: format(parseISO(r.log_date), "MMM d"), hours: Number(r.hours) }));
  const avg7 = rows.slice(0, 7).reduce((s, r) => s + Number(r.hours), 0) / Math.max(1, Math.min(7, rows.length));

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-body" />
          <div className="text-xs uppercase tracking-wider text-body">Sleep</div>
        </div>
        <span className="text-[10px] text-muted-foreground">7-day avg {avg7.toFixed(1)}h</span>
      </div>

      <label className="text-xs">
        <span className="text-muted-foreground">Last night ({hours}h)</span>
        <input type="range" min={3} max={12} step={0.25} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full mt-1 accent-body" />
      </label>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Quality</span>
        {[1, 2, 3, 4, 5].map((q) => (
          <button key={q} onClick={() => setQuality(q)}
            className={cn("press h-8 w-8 rounded-lg text-xs font-bold",
              quality >= q ? "bg-body text-body-foreground" : "bg-muted text-muted-foreground")}>
            {q}
          </button>
        ))}
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (dreams, wake-ups…)"
        className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
      <button onClick={save} className="press mt-2 w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-body text-body-foreground text-sm font-semibold">
        <Save className="h-4 w-4" /> Save
      </button>

      {chartData.length > 1 && (
        <div className="mt-4 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[3, 12]} tick={{ fontSize: 10 }} width={22} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="hours" stroke="hsl(var(--body))" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
