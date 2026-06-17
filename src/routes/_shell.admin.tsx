import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useApp, type Resource } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin")({
  head: () => ({ meta: [{ title: "Admin · me." }] }),
  component: Admin,
});

const TABS = ["Content", "Library", "Tribes", "Users"] as const;

function Admin() {
  const [tab, setTab] = useState<typeof TABS[number]>("Content");
  return (
    <div>
      <PageHeader title="Admin" subtitle="The live control room — every edit propagates to users instantly." />
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("press px-4 py-2 rounded-xl text-sm font-semibold border",
            tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border")}>{t}</button>
        ))}
      </div>
      <div key={tab} className="animate-[fade-in_0.3s_ease-out]">
        {tab === "Content" && <Content />}
        {tab === "Library" && <Library />}
        {tab === "Tribes" && <Tribes />}
        {tab === "Users" && <Users />}
      </div>
    </div>
  );
}

function Content() {
  const { verse, setVerse, promptList, addPrompt, removePrompt } = useApp();
  const [vText, setVText] = useState(verse.text);
  const [vRef, setVRef] = useState(verse.ref);
  const [newPrompt, setNewPrompt] = useState("");
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="lift rounded-3xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Verse of the day</div>
        <textarea value={vText} onChange={(e) => setVText(e.target.value)} className="mt-3 w-full h-28 bg-background border border-border rounded-xl p-3 text-sm" />
        <input value={vRef} onChange={(e) => setVRef(e.target.value)} className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Reference (e.g. John 3:16)" />
        <button onClick={() => setVerse(vText, vRef)} className="press mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Publish</button>
      </div>
      <div className="lift rounded-3xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Journal prompts</div>
        <form onSubmit={(e) => { e.preventDefault(); if (newPrompt.trim()) { addPrompt(newPrompt.trim()); setNewPrompt(""); } }} className="mt-3 flex gap-2">
          <input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="New therapeutic prompt…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <button className="press px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm"><Plus className="h-4 w-4" /></button>
        </form>
        <ul className="mt-3 space-y-2">
          {promptList.map((p, i) => (
            <li key={i} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-background border border-border text-sm">
              <span>{p}</span>
              <button onClick={() => removePrompt(i)} className="press text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Library() {
  const { resources, addResource, removeResource, updateResource } = useApp();
  const [draft, setDraft] = useState<{ title: string; type: Resource["type"]; summary: string }>({ title: "", type: "Books", summary: "" });
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (draft.title.trim()) { addResource(draft); setDraft({ title: "", type: "Books", summary: "" }); } }} className="lift rounded-2xl border border-border bg-card p-5 grid md:grid-cols-4 gap-2 mb-5">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="bg-background border border-border rounded-xl px-3 py-2 text-sm md:col-span-2" />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Resource["type"] })} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
          {(["Books", "Audio", "Frameworks", "Checklists"] as const).map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="press inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /> Add</button>
        <input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Summary" className="bg-background border border-border rounded-xl px-3 py-2 text-sm md:col-span-4" />
      </form>
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="lift rounded-xl border border-border bg-card p-4 grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
            <div>
              <input value={r.title} onChange={(e) => updateResource(r.id, { title: e.target.value })} className="w-full font-bold bg-transparent focus:outline-none" />
              <input value={r.summary} onChange={(e) => updateResource(r.id, { summary: e.target.value })} className="w-full text-xs text-muted-foreground bg-transparent focus:outline-none" />
            </div>
            <select value={r.type} onChange={(e) => updateResource(r.id, { type: e.target.value as Resource["type"] })} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs">
              {(["Books", "Audio", "Frameworks", "Checklists"] as const).map((t) => <option key={t}>{t}</option>)}
            </select>
            <button onClick={() => removeResource(r.id)} className="press p-2 rounded-lg border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tribes() {
  const { tribes, addTribe, removeTribe, posts } = useApp();
  const [name, setName] = useState("");
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="lift rounded-3xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Tribes</div>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addTribe(name.trim()); setName(""); } }} className="mt-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tribe name" className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <button className="press px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm"><Plus className="h-4 w-4" /></button>
        </form>
        <ul className="mt-3 space-y-2">
          {tribes.map((t) => (
            <li key={t} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border text-sm">
              <span>{t}</span>
              <button onClick={() => removeTribe(t)} className="press text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </div>
      <div className="lift rounded-3xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Recent posts</div>
        <ul className="mt-3 space-y-2 max-h-96 overflow-auto">
          {posts.map((p) => (
            <li key={p.id} className="p-3 rounded-xl bg-background border border-border text-sm">
              <div className="text-xs text-muted-foreground">{p.tribe} · {p.author}</div>
              <div className="mt-1">{p.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Users() {
  const { user, setUser, moodHistory } = useApp();
  const mock = [
    { name: user.name, email: user.email || "you@me.app", phase: user.phase, role: "user", detail: `${user.detailB} @ ${user.detailA}` },
    { name: "Maya Singh", email: "maya@me.app", phase: "Student", role: "user", detail: "Biology, UCLA" },
    { name: "Daniel Cho", email: "daniel@me.app", phase: "Business Owner", role: "moderator", detail: "Atlas Studio · Design" },
    { name: "Lina K.", email: "lina@me.app", phase: "In-Transition", role: "user", detail: "Healthcare → Product" },
  ];
  return (
    <div className="space-y-5">
      <div className="lift rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Name</th><th>Email</th><th>Phase</th><th>Role</th><th className="pr-3">Detail</th></tr>
          </thead>
          <tbody>
            {mock.map((u, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="text-muted-foreground">{u.email}</td>
                <td>{i === 0 ? (
                  <select value={user.phase} onChange={(e) => setUser({ phase: e.target.value as any })} className="bg-background border border-border rounded-lg px-2 py-1 text-xs">
                    {["Student", "Employee", "Business Owner", "In-Transition"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                ) : u.phase}</td>
                <td><span className={cn("px-2 py-0.5 rounded-full text-xs", u.role === "moderator" ? "bg-mind/20 text-mind" : "bg-muted")}>{u.role}</span></td>
                <td className="pr-3 text-muted-foreground">{u.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lift rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Edit3 className="h-3.5 w-3.5" /> {user.name}'s mood history</div>
        <div className="mt-3 flex items-end gap-1 h-24">
          {moodHistory.slice(-14).map((d, i) => {
            const h = d.mood === "Excellent" ? 100 : d.mood === "Good" ? 75 : d.mood === "Neutral" ? 45 : 25;
            return <div key={i} className="flex-1 rounded-md bg-gradient-to-t from-primary to-faith" style={{ height: `${h}%` }} title={`${d.day}: ${d.mood}`} />;
          })}
        </div>
      </div>
    </div>
  );
}
