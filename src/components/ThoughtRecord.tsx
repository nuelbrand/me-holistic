import { useEffect, useState } from "react";
import { Brain, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMOTIONS = ["Anxious", "Angry", "Sad", "Ashamed", "Fearful", "Overwhelmed", "Discouraged", "Lonely"];

interface Record {
  id: string;
  situation: string;
  automatic_thought: string;
  balanced_thought: string | null;
  intensity_before: number;
  intensity_after: number | null;
  created_at: string;
}

export function ThoughtRecord() {
  const { user } = useAuth();
  const stats = useStats();
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [intensityBefore, setIntensityBefore] = useState(6);
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [balanced, setBalanced] = useState("");
  const [intensityAfter, setIntensityAfter] = useState(3);
  const [saving, setSaving] = useState(false);
  const [past, setPast] = useState<Record[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("thought_records").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(5);
    setPast((data ?? []) as Record[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const toggleEmotion = (e: string) => setEmotions((cur) => cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]);

  const save = async () => {
    if (!user || !situation.trim() || !thought.trim()) { toast.error("Situation and thought are required."); return; }
    setSaving(true);
    const { error } = await supabase.from("thought_records").insert({
      user_id: user.id, situation, automatic_thought: thought, emotions,
      intensity_before: intensityBefore, evidence_for: evidenceFor || null,
      evidence_against: evidenceAgainst || null, balanced_thought: balanced || null,
      intensity_after: balanced ? intensityAfter : null,
    });
    setSaving(false);
    if (error) { toast.error("Could not save."); return; }
    if (balanced) { await awardXp(user.id, "thought_reframed"); stats.refresh(); }
    toast.success("Thought record saved.");
    setSituation(""); setThought(""); setEmotions([]); setEvidenceFor(""); setEvidenceAgainst(""); setBalanced("");
    setIntensityBefore(6); setIntensityAfter(3);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("thought_records").delete().eq("id", id);
    setPast((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-4 w-4 text-mind" />
        <div className="text-xs uppercase tracking-wider text-mind">CBT Thought record</div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Catch a distressing thought, check the evidence, and reframe with truth.</p>

      <div className="space-y-3">
        <Field label="1. Situation">
          <textarea rows={2} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="What happened? Where, when, with whom?"
            className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </Field>

        <Field label="2. Automatic thought">
          <textarea rows={2} value={thought} onChange={(e) => setThought(e.target.value)} placeholder="What ran through your head?"
            className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </Field>

        <Field label="3. Emotions">
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button key={e} type="button" onClick={() => toggleEmotion(e)}
                className={cn("press px-3 py-1 rounded-full text-xs font-medium border",
                  emotions.includes(e) ? "bg-mind text-mind-foreground border-mind" : "border-border bg-background")}>
                {e}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`4. Intensity before (${intensityBefore}/10)`}>
          <input type="range" min={1} max={10} value={intensityBefore} onChange={(e) => setIntensityBefore(Number(e.target.value))} className="w-full accent-mind" />
        </Field>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="5. Evidence FOR the thought">
            <textarea rows={3} value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="6. Evidence AGAINST">
            <textarea rows={3} value={evidenceAgainst} onChange={(e) => setEvidenceAgainst(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
        </div>

        <Field label="7. Balanced thought (truth to hold on to)">
          <textarea rows={2} value={balanced} onChange={(e) => setBalanced(e.target.value)} placeholder="A more accurate, compassionate reframe…"
            className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </Field>

        {balanced && (
          <Field label={`8. Intensity after (${intensityAfter}/10)`}>
            <input type="range" min={1} max={10} value={intensityAfter} onChange={(e) => setIntensityAfter(Number(e.target.value))} className="w-full accent-mind" />
          </Field>
        )}

        <button onClick={save} disabled={saving} className="press inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mind text-mind-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save reframe"}
        </button>
      </div>

      {past.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent reframes</div>
          <div className="space-y-2">
            {past.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-background border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold line-clamp-1">{r.situation}</div>
                  <button onClick={() => remove(r.id)} className="press text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground italic line-through mt-1 line-clamp-1">{r.automatic_thought}</div>
                {r.balanced_thought && <div className="text-xs text-mind mt-1 line-clamp-2">→ {r.balanced_thought}</div>}
                {r.intensity_after != null && (
                  <div className="text-[10px] text-muted-foreground mt-1">Intensity {r.intensity_before} → {r.intensity_after}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}
