import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { BibleReader } from "@/components/BibleReader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/faith")({
  head: () => ({ meta: [{ title: "Faith · me." }] }),
  component: Faith,
});

const FEELINGS = ["Fear", "Anxiety", "Happy", "Love", "Peace", "Discouraged"];
const PROMISES: Record<string, string[]> = {
  Fear: ["For God has not given us a spirit of fear, but of power and love and a sound mind. — 2 Tim 1:7", "Reflection: Name the fear. Hand it over in a 60-second prayer."],
  Anxiety: ["Cast all your anxiety on Him because He cares for you. — 1 Peter 5:7", "Action: Breathe in 4, hold 4, out 6 — repeat 4×."],
  Happy: ["Rejoice in the Lord always. — Phil 4:4", "Action: Send one gratitude text to someone."],
  Love: ["We love because He first loved us. — 1 John 4:19", "Reflection: Who needs your love embodied today?"],
  Peace: ["The peace of God will guard your hearts. — Phil 4:7", "Action: Sit still for 3 minutes before checking your phone."],
  Discouraged: ["The Lord is near to the brokenhearted. — Psalm 34:18", "Action: Speak one promise aloud over yourself."],
};
const BOOKS = ["Genesis", "Psalms", "Proverbs", "John", "Romans", "Philippians", "Revelation"];

function Faith() {
  const { verse, prayers, addPrayer, togglePrayer, notes, setNotes, bibleBook, bibleChapter, setBible } = useApp();
  const [feeling, setFeeling] = useState<string | null>(null);
  const [newPrayer, setNewPrayer] = useState("");

  return (
    <div>
      <PageHeader title="Faith" subtitle="Centering your day around an active, intimate connection with God." accent="faith" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lift rounded-3xl bg-faith text-faith-foreground p-8 lg:col-span-2 relative overflow-hidden">
          <div className="text-xs uppercase tracking-[0.3em] opacity-80">Verse of the day</div>
          <p className="mt-4 text-2xl md:text-3xl font-serif italic leading-snug">"{verse.text}"</p>
          <div className="mt-4 font-semibold opacity-90">— {verse.ref}</div>
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Devotional notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is the Spirit highlighting…" className="mt-3 w-full h-40 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-faith">Emotional alignment</div>
          <div className="text-lg font-bold mt-1">How are you feeling?</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <button key={f} onClick={() => setFeeling(f)} className={cn("press px-4 py-2 rounded-xl border text-sm font-medium",
                feeling === f ? "bg-faith text-faith-foreground border-faith animate-pulse-glow" : "bg-background border-border")}>{f}</button>
            ))}
          </div>
          {feeling && (
            <div key={feeling} className="mt-5 p-5 rounded-2xl bg-faith/10 border border-faith/30 animate-[fade-in_0.35s_ease-out]">
              {PROMISES[feeling].map((line, i) => (
                <p key={i} className={cn("text-sm", i === 0 ? "font-serif italic text-base" : "mt-3 text-muted-foreground")}>{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-faith"><BookOpen className="h-3.5 w-3.5" /> Bible reader</div>
          <div className="mt-3 flex gap-2">
            <select value={bibleBook} onChange={(e) => setBible(e.target.value, 1)} className="press bg-background border border-border rounded-lg px-3 py-2 text-sm flex-1">
              {BOOKS.map((b) => <option key={b}>{b}</option>)}
            </select>
            <input type="number" min={1} max={150} value={bibleChapter} onChange={(e) => setBible(bibleBook, +e.target.value || 1)} className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 p-4 rounded-xl bg-background border border-border text-sm leading-relaxed max-h-48 overflow-auto">
            <div className="font-bold mb-2">{bibleBook} {bibleChapter}</div>
            <p className="text-muted-foreground">In the beginning was the Word, and the Word was with God, and the Word was God… (Scripture text loads from your preferred translation.)</p>
          </div>
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-3">
          <div className="text-xs uppercase tracking-wider text-faith">Prayer wall</div>
          <form onSubmit={(e) => { e.preventDefault(); if (newPrayer.trim()) { addPrayer(newPrayer.trim()); setNewPrayer(""); } }} className="mt-3 flex gap-2">
            <input value={newPrayer} onChange={(e) => setNewPrayer(e.target.value)} placeholder="A prayer request…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button className="press inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-faith text-faith-foreground text-sm font-semibold"><Plus className="h-4 w-4" /> Add</button>
          </form>
          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            {prayers.map((p) => (
              <button key={p.id} onClick={() => togglePrayer(p.id)} className={cn("press text-left p-3 rounded-xl border flex items-start gap-3",
                p.answered ? "bg-faith/10 border-faith/30" : "bg-background border-border")}>
                <span className={cn("h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 mt-0.5", p.answered ? "bg-faith border-faith text-faith-foreground" : "border-border")}>
                  {p.answered && <Check className="h-3 w-3" />}
                </span>
                <span className={cn("text-sm", p.answered && "line-through text-muted-foreground")}>{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
