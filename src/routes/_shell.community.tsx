import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Plus, Users as UsersIcon, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/community")({
  head: () => ({ meta: [{ title: "Community · me." }] }),
  component: Community,
});

const EMOJIS = ["🙏", "❤️", "🔥", "💪"] as const;
type Emoji = (typeof EMOJIS)[number];

interface Reaction { post_id: string; user_id: string; emoji: Emoji }
interface Reply {
  id: string; post_id: string; author_id: string; parent_reply_id: string | null;
  text: string; created_at: string;
}

function Community() {
  const { user } = useAuth();
  const { tribes, joinedTribes, joinTribe, posts, likePost, addPost, addTribe } = useApp();
  const [active, setActive] = useState<string | undefined>(tribes[0]);
  const [newPost, setNewPost] = useState("");
  const [creating, setCreating] = useState(false);
  const [tribeName, setTribeName] = useState("");
  const [tribeDesc, setTribeDesc] = useState("");
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => { if (!active && tribes.length) setActive(tribes[0]); }, [tribes, active]);

  // Load reactions + replies for currently visible posts
  useEffect(() => {
    if (!posts.length) return;
    const postIds = posts.map((p) => p.id);
    (async () => {
      const [r, rep] = await Promise.all([
        supabase.from("post_reactions").select("post_id, user_id, emoji").in("post_id", postIds),
        supabase.from("post_replies").select("*").in("post_id", postIds).order("created_at"),
      ]);
      setReactions((r.data ?? []) as Reaction[]);
      setReplies((rep.data ?? []) as Reply[]);
      const authorIds = Array.from(new Set((rep.data ?? []).map((x: any) => x.author_id)));
      if (authorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username").in("id", authorIds);
        const map: Record<string, string> = {};
        for (const p of (profs ?? []) as { id: string; username: string | null }[]) map[p.id] = p.username || "Member";
        setProfiles(map);
      }
    })();
  }, [posts]);

  const filtered = useMemo(() => posts.filter((p) => p.tribe === active), [posts, active]);

  const toggleReaction = async (postId: string, emoji: Emoji) => {
    if (!user) return;
    const has = reactions.some((r) => r.post_id === postId && r.user_id === user.id && r.emoji === emoji);
    if (has) {
      setReactions((rs) => rs.filter((r) => !(r.post_id === postId && r.user_id === user.id && r.emoji === emoji)));
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      setReactions((rs) => [...rs, { post_id: postId, user_id: user.id, emoji }]);
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji });
    }
  };

  const addReply = async (postId: string, parentId: string | null) => {
    const key = parentId ?? postId;
    const text = (replyDraft[key] || "").trim();
    if (!text || !user) return;
    const { data, error } = await supabase.from("post_replies").insert({
      post_id: postId, author_id: user.id, parent_reply_id: parentId, text,
    }).select().single();
    if (error) return;
    setReplies((rs) => [...rs, data as Reply]);
    setReplyDraft((d) => ({ ...d, [key]: "" }));
    if (!profiles[user.id]) setProfiles((p) => ({ ...p, [user.id]: "You" }));
  };

  const removeReply = async (id: string) => {
    setReplies((rs) => rs.filter((r) => r.id !== id));
    await supabase.from("post_replies").delete().eq("id", id);
  };

  const countReactions = (postId: string, emoji: Emoji) =>
    reactions.filter((r) => r.post_id === postId && r.emoji === emoji).length;
  const iReacted = (postId: string, emoji: Emoji) =>
    !!user && reactions.some((r) => r.post_id === postId && r.user_id === user.id && r.emoji === emoji);

  const repliesFor = (postId: string, parentId: string | null) =>
    replies.filter((r) => r.post_id === postId && r.parent_reply_id === parentId);

  const renderReplies = (postId: string, parentId: string | null, depth = 0): React.ReactNode => {
    const items = repliesFor(postId, parentId);
    if (!items.length) return null;
    return (
      <ul className={cn("space-y-2", depth > 0 && "mt-2 ml-4 border-l border-border pl-3")}>
        {items.map((r) => (
          <li key={r.id} className="text-sm">
            <div className="rounded-lg bg-background border border-border px-3 py-2 group">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                <span className="font-semibold text-foreground">{profiles[r.author_id] || "Member"}</span>
                <span>· {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                {r.author_id === user?.id && (
                  <button onClick={() => removeReply(r.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>{r.text}</div>
              {depth < 2 && (
                <form
                  onSubmit={(e) => { e.preventDefault(); addReply(postId, r.id); }}
                  className="mt-2 flex gap-2"
                >
                  <input
                    value={replyDraft[r.id] || ""}
                    onChange={(e) => setReplyDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                    placeholder="Reply…"
                    maxLength={2000}
                    className="flex-1 bg-card border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button className="press px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">↩</button>
                </form>
              )}
            </div>
            {renderReplies(postId, r.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

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
        {filtered.map((p) => {
          const topReplies = repliesFor(p.id, null);
          return (
            <div key={p.id} className="lift rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">{p.author[0]}</div>
                <div>
                  <div className="font-bold">{p.author}</div>
                  <div className="text-xs text-muted-foreground">{p.tribe}</div>
                </div>
              </div>
              <p className="mt-3 text-sm">{p.text}</p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button onClick={() => likePost(p.id)} className={cn("press inline-flex items-center gap-1.5 text-sm text-muted-foreground", p.liked && "text-destructive")}>
                  <Heart className={cn("h-4 w-4", p.liked && "fill-current animate-pop")} /> {p.likes}
                </button>
                <span className="text-muted-foreground/50">·</span>
                {EMOJIS.map((e) => {
                  const c = countReactions(p.id, e);
                  const mine = iReacted(p.id, e);
                  return (
                    <button
                      key={e}
                      onClick={() => toggleReaction(p.id, e)}
                      className={cn(
                        "press inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition-colors",
                        mine ? "bg-primary/15 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      <span className={cn(mine && "animate-pop")}>{e}</span>
                      {c > 0 && <span className="font-semibold">{c}</span>}
                    </button>
                  );
                })}
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" /> {replies.filter((r) => r.post_id === p.id).length}
                </span>
              </div>

              {topReplies.length > 0 && <div className="mt-3">{renderReplies(p.id, null)}</div>}

              <form
                onSubmit={(e) => { e.preventDefault(); addReply(p.id, null); }}
                className="mt-3 flex gap-2"
              >
                <input
                  value={replyDraft[p.id] || ""}
                  onChange={(e) => setReplyDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  placeholder="Encourage them…"
                  maxLength={2000}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="press px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Send</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
