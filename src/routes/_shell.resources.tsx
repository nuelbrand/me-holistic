import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Bookmark, PlayCircle, CheckCircle2, Circle, Wallet } from "lucide-react";
import { useApp, type Resource } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/resources")({
  head: () => ({ meta: [{ title: "Resources · me." }] }),
  component: Resources,
});

const CATS = ["All", "Books", "Audio", "Frameworks", "Checklists"] as const;

function Resources() {
  const { resources, toggleBookmark, updateResource } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof CATS[number]>("All");
  const list = resources.filter((r) => (cat === "All" || r.type === cat) && (r.title.toLowerCase().includes(q.toLowerCase()) || r.summary.toLowerCase().includes(q.toLowerCase())));
  const cycleStatus = (s: Resource["status"]): Resource["status"] => s === "not-started" ? "in-progress" : s === "in-progress" ? "completed" : "not-started";

  return (
    <div>
      <PageHeader title="Resources" subtitle="Curated frameworks, summaries, and checklists for the season you're in." />

      <Link to="/body" className="lift block rounded-3xl border border-border bg-gradient-to-br from-body/15 to-card p-5 mb-5 group">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-body/20 text-body grid place-items-center"><Wallet className="h-6 w-6" /></div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-body">Finance Hub</div>
            <div className="text-lg font-black">Make · Manage · Grow<span className="text-primary">.</span></div>
            <p className="text-sm text-muted-foreground mt-1">Three-bucket stewardship: earn more, steward what you have, compound the rest. Open the Body → Financial Stewardship tab.</p>
          </div>
          <span className="text-body group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </Link>
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
        {list.map((r) => {
          const StatusIcon = r.status === "completed" ? CheckCircle2 : r.status === "in-progress" ? PlayCircle : Circle;
          const statusColor = r.status === "completed" ? "text-faith" : r.status === "in-progress" ? "text-mind" : "text-muted-foreground";
          return (
            <div key={r.id} className="lift rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.category} · {r.type}</div>
                  <div className="font-bold mt-0.5">{r.title}</div>
                </div>
                <button onClick={() => toggleBookmark(r.id)} className={cn("press p-2 rounded-lg border", r.bookmarked ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                  <Bookmark className={cn("h-4 w-4", r.bookmarked && "fill-current")} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{r.summary}</p>
              <button onClick={() => updateResource(r.id, { status: cycleStatus(r.status) })}
                className={cn("press mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold", statusColor)}>
                <StatusIcon className="h-4 w-4" />
                {r.status === "completed" ? "Completed" : r.status === "in-progress" ? "In Progress" : "Start"}
              </button>
            </div>
          );
        })}
        {list.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-12">No matches. Try another filter or add resources from Admin.</div>}
      </div>
    </div>
  );
}
