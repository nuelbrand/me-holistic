import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Plus, Users as UsersIcon } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/community")({
  head: () => ({ meta: [{ title: "Community · me." }] }),
  component: Community,
});

function Community() {
  const { tribes, joinedTribes, joinTribe, posts, likePost, commentPost, addPost, addTribe } = useApp();
  const [active, setActive] = useState<string | undefined>(tribes[0]);
  const [newPost, setNewPost] = useState("");
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [tribeName, setTribeName] = useState("");
  const [tribeDesc, setTribeDesc] = useState("");
  useEffect(() => { if (!active && tribes.length) setActive(tribes[0]); }, [tribes, active]);
  const filtered = posts.filter((p) => p.tribe === active);

  return (
    <div>
      <PageHeader title="Community" subtitle="Find your tribe. Walk the path with people on the same road." />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 flex-1">
          {tribes.map((t) => (
            <button key={t} onClick={() => setActive(t)} className={cn("press whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border",
              active === t ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
              {t}
              {joinedTribes.includes(t) && <span className="ml-2 text-[10px] opacity-70">JOINED</span>}
            </button>
          ))}
          {tribes.length === 0 && <span className="text-xs text-muted-foreground self-center">No tribes yet — create the first one.</span>}
        </div>
        <button onClick={() => setCreating((v) => !v)} className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap">
          <UsersIcon className="h-3.5 w-3.5" /> Create Tribe
        </button>
      </div>

      {creating && (
        <form onSubmit={async (e) => { e.preventDefault(); if (tribeName.trim()) { await addTribe(tribeName.trim(), tribeDesc.trim()); setActive(tribeName.trim()); setTribeName(""); setTribeDesc(""); setCreating(false); } }}
          className="lift rounded-2xl border border-border bg-card p-4 mb-5 grid sm:grid-cols-[1fr_2fr_auto] gap-2 animate-[fade-in_0.25s_ease-out]">
          <input value={tribeName} onChange={(e) => setTribeName(e.target.value)} placeholder="Tribe name" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <input value={tribeDesc} onChange={(e) => setTribeDesc(e.target.value)} placeholder="Short description" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <button className="press px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create</button>
        </form>
      )}

      {active && (
        <>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="text-sm text-muted-foreground">Tribe: <span className="font-bold text-foreground">{active}</span></div>
            <button onClick={() => joinTribe(active)} className="press px-3 py-1.5 rounded-xl border border-border text-xs font-semibold">
              {joinedTribes.includes(active) ? "Leave" : "Join"}
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (newPost.trim()) { addPost(active, newPost.trim()); setNewPost(""); } }} className="lift rounded-2xl border border-border bg-card p-4 mb-5 flex gap-2">
            <input value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={`Share with ${active}…`} className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button className="press inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /> Post</button>
          </form>
        </>
      )}

      <div className="space-y-4">
        {filtered.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No posts yet — be the first.</div>}
        {filtered.map((p) => (
          <div key={p.id} className="lift rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">{p.author[0]}</div>
              <div>
                <div className="font-bold">{p.author}</div>
                <div className="text-xs text-muted-foreground">{p.tribe}</div>
              </div>
            </div>
            <p className="mt-3 text-sm">{p.text}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <button onClick={() => likePost(p.id)} className={cn("press inline-flex items-center gap-1.5", p.liked && "text-destructive")}>
                <Heart className={cn("h-4 w-4", p.liked && "fill-current animate-pop")} /> {p.likes}
              </button>
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {p.comments.length}</span>
            </div>
            {p.comments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {p.comments.map((c, i) => <div key={i} className="text-sm text-muted-foreground bg-background rounded-lg px-3 py-2 border border-border">{c}</div>)}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); const v = commentDraft[p.id]; if (v?.trim()) { commentPost(p.id, v.trim()); setCommentDraft({ ...commentDraft, [p.id]: "" }); } }} className="mt-3 flex gap-2">
              <input value={commentDraft[p.id] || ""} onChange={(e) => setCommentDraft({ ...commentDraft, [p.id]: e.target.value })} placeholder="Encourage them…" className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
              <button className="press px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Send</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
