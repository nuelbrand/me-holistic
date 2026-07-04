import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Pause, Shuffle, BookOpen, Headphones, Video, Save } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { HabitsPanel } from "@/components/HabitsPanel";
import { FocusTimer } from "@/components/FocusTimer";
import { ThoughtRecord } from "@/components/ThoughtRecord";
import { JournalCompanion } from "@/components/JournalCompanion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/mind")({
  head: () => ({ meta: [{ title: "Mind · me." }] }),
  component: Mind,
});

const LIB = [
  { id: 1, title: "Reframing Anxiety", kind: "Audio", icon: Headphones, tag: "Anxious", len: "10 min" },
  { id: 2, title: "Atomic Habits Digest", kind: "Book", icon: BookOpen, tag: "Restless", len: "12 min" },
  { id: 3, title: "Breathe — Box Method", kind: "Video", icon: Video, tag: "Stressed", len: "6 min" },
  { id: 4, title: "Rest as Strategy", kind: "Audio", icon: Headphones, tag: "Fatigued", len: "9 min" },
  { id: 5, title: "Mindset Shifts at Work", kind: "Book", icon: BookOpen, tag: "Restless", len: "15 min" },
  { id: 6, title: "Stoic Reset", kind: "Audio", icon: Headphones, tag: "Anxious", len: "8 min" },
];
const FILTERS = ["All", "Anxious", "Stressed", "Fatigued", "Restless"];

function Mind() {
  const { journal, setJournal, saveJournalEntry, promptList, moodHistory, resources } = useApp();
  const [filter, setFilter] = useState("All");
  const [playing, setPlaying] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(promptList[0] ?? "");
  const items = filter === "All" ? LIB : LIB.filter((l) => l.tag === filter);
  const reading = resources.filter((r) => r.category === "Mind" && r.status === "in-progress");

  return (
    <div>
      <PageHeader title="Mind" subtitle="Renew cognitive patterns, dismantle stress, build resilience." accent="mind" />

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("press px-3 py-1.5 rounded-full text-xs font-semibold border",
            filter === f ? "bg-mind text-mind-foreground border-mind" : "border-border")}>{f}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const isPlaying = playing === it.id;
          const Icon = it.icon;
          return (
            <div key={it.id} className={cn("lift rounded-2xl border bg-card p-5", isPlaying ? "border-mind animate-pulse-glow" : "border-border")}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-mind/15 text-mind grid place-items-center"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{it.kind} · {it.len}</div>
                </div>
              </div>
              <button onClick={() => setPlaying(isPlaying ? null : it.id)} className="press mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-mind text-mind-foreground text-sm font-semibold">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{isPlaying ? "Pause" : "Play"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs uppercase tracking-wider text-mind">Cognitive restructuring journal</div>
            <button onClick={() => setPrompt(promptList[Math.floor(Math.random() * promptList.length)])} className="press inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs">
              <Shuffle className="h-3.5 w-3.5" /> New prompt
            </button>
          </div>
          <p key={prompt} className="mt-3 italic text-mind animate-[fade-in_0.3s_ease-out]">{prompt}</p>
          <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Write without filter…" className="mt-3 w-full h-40 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => saveJournalEntry("cognitive")} className="press mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-mind text-mind-foreground text-xs font-semibold">
              <Save className="h-3.5 w-3.5" /> Save entry
            </button>
          </div>
          <JournalCompanion content={journal} />
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-mind inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Currently reading</div>
            <Link to="/resources" className="text-xs text-muted-foreground hover:text-foreground">Library →</Link>
          </div>
          {reading.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">Mark a Mind resource as <em>In Progress</em> to surface it here.</p>
          ) : (
            <div className="space-y-2 mt-3">
              {reading.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-mind/10 border border-mind/30">
                  <div className="text-[10px] uppercase text-mind">{r.type}</div>
                  <div className="font-bold text-sm">{r.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2"><HabitsPanel /></div>
        <FocusTimer />

        <div className="lg:col-span-3"><ThoughtRecord /></div>

        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-3">
          <div className="text-xs uppercase tracking-wider text-mind">Weekly mood</div>
          <p className="text-[11px] text-muted-foreground mt-1">Synced with your dashboard log.</p>
          <div className="mt-4 flex items-end gap-1.5 h-40">
            {moodHistory.length === 0 && <div className="text-xs text-muted-foreground self-center">Log a mood on the dashboard to start your chart.</div>}
            {moodHistory.slice(-7).map((d, i) => {
              const h = d.mood === "Excellent" ? 100 : d.mood === "Good" ? 75 : d.mood === "Neutral" ? 45 : 25;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-md bg-gradient-to-t from-mind to-primary transition-all duration-500" style={{ height: `${h}%` }} title={d.mood} />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
