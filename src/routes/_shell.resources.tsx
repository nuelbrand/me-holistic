import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Bookmark } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/resources")({
  head: () => ({ meta: [{ title: "Resources · me." }] }),
  component: Resources,
});

const CATS = ["All", "Books", "Audio", "Frameworks", "Checklists"] as const;

function Resources() {
  const { resources, toggleBookmark } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof CATS[number]>("All");
  const list = resources.filter((r) => (cat === "All" || r.type === cat) && (r.title.toLowerCase().includes(q.toLowerCase()) || r.summary.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <PageHeader title="Resources" subtitle="Curated frameworks, summaries, and checklists for the season you're in." />
      <div className="sticky top-0 md:top-2 z-10 bg-background/80 backdrop-blur py-3 -mx-2 px-2 rounded-2xl">
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the library…" className="flex-1 bg-transparent text-sm focus:outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("press whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border",
              cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border")}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {list.map((r) => (
          <div key={r.id} className="lift rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.type}</div>
                <div className="font-bold mt-0.5">{r.title}</div>
              </div>
              <button onClick={() => toggleBookmark(r.id)} className={cn("press p-2 rounded-lg border", r.bookmarked ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                <Bookmark className={cn("h-4 w-4", r.bookmarked && "fill-current")} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex-1">{r.summary}</p>
          </div>
        ))}
        {list.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-12">No matches. Try another filter.</div>}
      </div>
    </div>
  );
}
