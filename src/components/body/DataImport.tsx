import { useRef, useState } from "react";
import { Upload, FileUp, Check, AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";

type Kind = "strava_activities" | "sleep_csv" | "weight_csv";

interface Preview { kind: Kind; count: number; rows: any[] }

/**
 * CSV import for:
 *   - Strava "activities.csv" (from Strava data export)
 *   - Generic sleep CSV: columns date,hours,quality
 *   - Generic weight CSV: columns date,weight_kg[,body_fat_pct]
 *
 * Apple Health export is an XML archive — export via 3rd party
 * (e.g. QS Access, Health Auto Export) to CSV in the same shape.
 */
export function DataImport() {
  const { user } = useAuth();
  const stats = useStats();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("strava_activities");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => fileRef.current?.click();

  const onFile = (f: File | null) => {
    if (!f) return;
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as any[];
        setPreview({ kind, count: rows.length, rows });
      },
      error: (err) => toast.error(err.message),
    });
  };

  const doImport = async () => {
    if (!user || !preview) return;
    setBusy(true);
    try {
      let inserted = 0;
      if (preview.kind === "strava_activities") {
        // Map Strava activities.csv → workouts
        const rows = preview.rows
          .map((r) => {
            const id = String(r["Activity ID"] ?? r["Filename"] ?? "").trim();
            const type = String(r["Activity Type"] ?? "cardio").toLowerCase();
            const date = r["Activity Date"] ?? r["Date"];
            const minutes = Number(r["Moving Time"] ?? r["Elapsed Time"] ?? 0);
            const durMin = minutes > 500 ? Math.round(minutes / 60) : Math.round(minutes); // Strava sometimes seconds
            const dist = Number(r["Distance"] ?? 0);
            const distKm = dist > 1000 ? dist / 1000 : dist; // meters vs km
            return {
              user_id: user.id,
              external_id: id || `strava-${date}-${type}`,
              source: "strava",
              kind: mapStravaKind(type),
              title: String(r["Activity Name"] ?? type).slice(0, 120),
              performed_at: date ? new Date(date).toISOString() : new Date().toISOString(),
              duration_min: durMin || 0,
              intensity: 3,
              distance_km: distKm || null,
              calories: r["Calories"] ? Number(r["Calories"]) : null,
              notes: null,
            };
          })
          .filter((r) => r.duration_min > 0);
        // upsert in chunks
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200);
          const { error } = await supabase.from("workouts").upsert(chunk, { onConflict: "user_id,source,external_id" });
          if (!error) inserted += chunk.length;
        }
      } else if (preview.kind === "sleep_csv") {
        const rows = preview.rows.map((r) => ({
          user_id: user.id,
          log_date: String(r.date ?? r.Date ?? "").slice(0, 10),
          hours: Number(r.hours ?? r.Hours ?? 0),
          quality: r.quality ? Number(r.quality) : null,
          notes: r.notes ?? null,
          source: "csv",
        })).filter((r) => r.log_date && r.hours > 0);
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200);
          const { error } = await supabase.from("sleep_logs").upsert(chunk, { onConflict: "user_id,log_date" });
          if (!error) inserted += chunk.length;
        }
      } else if (preview.kind === "weight_csv") {
        const rows = preview.rows.map((r) => ({
          user_id: user.id,
          log_date: String(r.date ?? r.Date ?? "").slice(0, 10),
          weight_kg: Number(r.weight_kg ?? r.weight ?? r.Weight ?? 0),
          body_fat_pct: r.body_fat_pct ? Number(r.body_fat_pct) : null,
          source: "csv",
        })).filter((r) => r.log_date && r.weight_kg > 0);
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200);
          const { error } = await supabase.from("weight_logs").upsert(chunk, { onConflict: "user_id,log_date" });
          if (!error) inserted += chunk.length;
        }
      }
      if (inserted > 0) {
        await awardXp(user.id, "data_imported");
        stats.refresh();
        toast.success(`Imported ${inserted} rows · +15 XP`);
      } else {
        toast.warning("No valid rows detected — check the columns.");
      }
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6 md:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="h-4 w-4 text-body" />
        <div className="text-xs uppercase tracking-wider text-body">Import from wearables</div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Web apps can't read Apple Health or Google Fit directly — those require native SDKs. Export your data as CSV instead:
      </p>

      <div className="grid gap-2 sm:grid-cols-3 mb-3">
        <Choice active={kind === "strava_activities"} onClick={() => setKind("strava_activities")}
          title="Strava activities.csv" hint="From Strava → Settings → My Account → Download your data" />
        <Choice active={kind === "sleep_csv"} onClick={() => setKind("sleep_csv")}
          title="Sleep CSV" hint="Columns: date, hours, quality (1–5). Works with QS Access / Health Auto Export." />
        <Choice active={kind === "weight_csv"} onClick={() => setKind("weight_csv")}
          title="Weight CSV" hint="Columns: date, weight_kg [, body_fat_pct]" />
      </div>

      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      <button onClick={pick} className="press w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm font-semibold">
        <FileUp className="h-4 w-4" /> Choose CSV file
      </button>

      {preview && (
        <div className="mt-3 p-3 rounded-xl border border-body/30 bg-body/5">
          <div className="flex items-center gap-2 text-xs">
            {preview.count > 0 ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-orange-500" />}
            Detected <strong>{preview.count}</strong> rows in <span className="font-semibold">{preview.kind}</span>.
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={doImport} disabled={busy || preview.count === 0}
              className="press flex-1 py-2 rounded-xl bg-body text-body-foreground text-sm font-semibold disabled:opacity-50">
              {busy ? "Importing…" : `Import ${preview.count} rows`}
            </button>
            <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="press px-3 py-2 rounded-xl border border-border text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Choice({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button onClick={onClick} className={`press text-left p-3 rounded-xl border text-xs ${active ? "border-body bg-body/10" : "border-border bg-background"}`}>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-muted-foreground mt-0.5 leading-snug">{hint}</div>
    </button>
  );
}

function mapStravaKind(t: string): string {
  const k = t.toLowerCase();
  if (k.includes("run")) return "run";
  if (k.includes("ride") || k.includes("cycl") || k.includes("bike")) return "ride";
  if (k.includes("swim")) return "swim";
  if (k.includes("walk") || k.includes("hik")) return "walk";
  if (k.includes("yoga")) return "yoga";
  if (k.includes("weight") || k.includes("strength")) return "strength";
  return "cardio";
}
