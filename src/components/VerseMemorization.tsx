import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Plus, Sparkles, Eye, EyeOff, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { suggestMemoryVerse } from "@/lib/ai.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Verse {
  id: string;
  reference: string;
  text: string;
  ease: number;
  interval_days: number;
  next_review: string;
  review_count: number;
  streak: number;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// SM-2 lite: quality 0 (again), 3 (hard), 4 (good), 5 (easy)
function sm2(v: Verse, quality: number) {
  let ease = v.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;
  let interval: number;
  let streak = v.streak;
  if (quality < 3) {
    interval = 1;
    streak = 0;
  } else {
    streak = v.streak + 1;
    if (streak === 1) interval = 1;
    else if (streak === 2) interval = 3;
    else interval = Math.round(v.interval_days * ease);
  }
  return { ease: Number(ease.toFixed(2)), interval_days: interval, next_review: inDaysISO(interval), streak, mastered: streak >= 8 };
}

export function VerseMemorization() {
  const { user } = useAuth();
  const stats = useStats();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [showText, setShowText] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [text, setText] = useState("");
  const [theme, setTheme] = useState("");
  const suggest = useServerFn(suggestMemoryVerse);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("memory_verses").select("*").eq("user_id", user.id).order("next_review");
    setVerses((data ?? []) as Verse[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const due = verses.filter((v) => v.next_review <= todayISO());
  const current = due[0];

  const grade = async (q: number) => {
    if (!user || !current) return;
    const result = sm2(current, q);
    await supabase.from("memory_verses").update({
      ease: result.ease, interval_days: result.interval_days, next_review: result.next_review,
      review_count: current.review_count + 1, streak: result.streak,
    }).eq("id", current.id);
    await awardXp(user.id, "verse_reviewed");
    if (result.mastered && current.streak < 8) {
      await awardXp(user.id, "verse_mastered");
      toast.success(`🏆 "${current.reference}" mastered!`);
    }
    stats.refresh();
    setShowText(false);
    load();
  };

  const addVerse = async () => {
    if (!user || !ref.trim() || !text.trim()) { toast.error("Reference and text required."); return; }
    await supabase.from("memory_verses").insert({ user_id: user.id, reference: ref.trim(), text: text.trim() });
    await awardXp(user.id, "verse_added");
    stats.refresh();
    setRef(""); setText(""); setAddOpen(false);
    load();
    toast.success("Added to memorization deck.");
  };

  const aiSuggest = async () => {
    if (!theme.trim()) return;
    try {
      const r = await suggest({ data: { theme: theme.trim() } });
      setRef(r.reference); setText(r.text);
    } catch { toast.error("Couldn't suggest a verse."); }
  };

  const remove = async (id: string) => {
    await supabase.from("memory_verses").delete().eq("id", id);
    setVerses((vs) => vs.filter((v) => v.id !== id));
  };

  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-xs uppercase tracking-wider text-faith inline-flex items-center gap-1">
          <BookMarked className="h-3.5 w-3.5" /> Verse memorization
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{due.length} due · {verses.length} total</span>
          <button onClick={() => setAddOpen((o) => !o)} className="press inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>

      {addOpen && (
        <div className="mb-4 p-4 rounded-2xl bg-faith/5 border border-faith/20 space-y-2 animate-[fade-in_0.25s_ease-out]">
          <div className="flex gap-2">
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Theme (e.g. courage, forgiveness)"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={aiSuggest} className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-faith/20 text-faith text-xs font-semibold">
              <Sparkles className="h-3 w-3" /> AI pick
            </button>
          </div>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference (e.g. Philippians 4:13)"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Verse text"
            className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <button onClick={addVerse} className="press w-full px-3 py-2 rounded-xl bg-faith text-faith-foreground text-sm font-semibold">
            Save to deck
          </button>
        </div>
      )}

      {current ? (
        <div className="p-5 rounded-2xl bg-faith/10 border border-faith/30 animate-[fade-in_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-faith">{current.reference}</div>
            <button onClick={() => setShowText((s) => !s)} className="press inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {showText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showText ? "Hide" : "Reveal"}
            </button>
          </div>
          {showText ? (
            <p className="font-serif italic text-base leading-relaxed">"{current.text}"</p>
          ) : (
            <p className="text-sm text-muted-foreground">Recite from memory, then tap Reveal.</p>
          )}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { q: 0, label: "Again", cls: "bg-destructive/20 text-destructive" },
              { q: 3, label: "Hard", cls: "bg-orange-500/20 text-orange-600" },
              { q: 4, label: "Good", cls: "bg-mind/20 text-mind" },
              { q: 5, label: "Easy", cls: "bg-faith/20 text-faith" },
            ].map((b) => (
              <button key={b.q} onClick={() => grade(b.q)} className={cn("press px-2 py-2 rounded-xl text-xs font-bold", b.cls)}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-2">
            <Check className="h-3 w-3" /> Streak {current.streak} · reviewed {current.review_count}×
          </div>
        </div>
      ) : verses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No verses yet. Add one to start memorizing.</p>
      ) : (
        <p className="text-sm text-muted-foreground py-6 text-center">🎉 All caught up! Next review in {Math.max(0, Math.ceil((new Date(verses[0].next_review).getTime() - Date.now()) / 86400000))} day(s).</p>
      )}

      {verses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs uppercase text-muted-foreground mb-2">Your deck</div>
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {verses.map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-background border border-border">
                <span className="font-semibold text-faith">{v.reference}</span>
                <span className="text-muted-foreground truncate flex-1">{v.text}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">📅 {v.next_review}</span>
                <button onClick={() => remove(v.id)} className="press text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
