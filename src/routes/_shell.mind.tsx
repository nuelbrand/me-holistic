import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Pause, Shuffle, BookOpen, Headphones, Video } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
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
  const { journal, setJournal, promptList, moodHistory } = useApp();
  const [filter, setFilter] = useState("All");
  const [playing, setPlaying] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(promptList[0] ?? "");
  const items = filter === "All" ? LIB : LIB.filter((l) => l.tag === filter);

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
          <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Write without filter…" className="mt-3 w-full h-48 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-mind">Weekly mood</div>
          <div className="mt-4 flex items-end gap-1.5 h-40">
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
