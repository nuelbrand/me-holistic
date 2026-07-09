import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Search } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { VoiceButton } from "@/components/VoiceButton";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/messages")({
  head: () => ({ meta: [{ title: "Messages · me." }] }),
  component: Messages,
});

interface Msg { id: string; sender_id: string; recipient_id: string; content: string; created_at: string; read_at: string | null }
interface Prof { id: string; username: string | null; email: string | null }

function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Prof>>({});
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Prof[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("direct_messages")
        .select("*").order("created_at", { ascending: true }).limit(500);
      const msgs = (data ?? []) as Msg[];
      setMessages(msgs);
      const ids = Array.from(new Set(msgs.flatMap((m) => [m.sender_id, m.recipient_id]))).filter((x) => x !== user.id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, email").in("id", ids);
        const map: Record<string, Prof> = {};
        for (const p of (profs ?? []) as Prof[]) map[p.id] = p;
        setProfiles(map);
        if (!activePartner && ids.length) setActivePartner(ids[0]);
      }
    })();
    const channel = supabase.channel("dm-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, async (payload) => {
        const m = payload.new as Msg;
        if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
        setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
        const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!profiles[other]) {
          const { data } = await supabase.from("profiles").select("id, username, email").eq("id", other).maybeSingle();
          if (data) setProfiles((p) => ({ ...p, [other]: data as Prof }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages, activePartner]);

  const conversations = useMemo(() => {
    if (!user) return [] as { partner: string; last: Msg; unread: number }[];
    const byPartner = new Map<string, Msg[]>();
    for (const m of messages) {
      const partner = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const arr = byPartner.get(partner) ?? [];
      arr.push(m); byPartner.set(partner, arr);
    }
    return Array.from(byPartner.entries())
      .map(([partner, arr]) => {
        const sorted = [...arr].sort((a, b) => a.created_at.localeCompare(b.created_at));
        const last = sorted[sorted.length - 1];
        const unread = sorted.filter((m) => m.recipient_id === user.id && !m.read_at).length;
        return { partner, last, unread };
      })
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [messages, user?.id]);

  const activeMessages = useMemo(() =>
    messages.filter((m) => activePartner && (m.sender_id === activePartner || m.recipient_id === activePartner))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages, activePartner]);

  // Mark as read when opened
  useEffect(() => {
    if (!user || !activePartner) return;
    const unread = activeMessages.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {
      setMessages((ms) => ms.map((m) => (unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m)));
    });
  }, [activePartner, activeMessages.length]);

  const send = async () => {
    if (!user || !activePartner || !draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    const { data, error } = await supabase.from("direct_messages")
      .insert({ sender_id: user.id, recipient_id: activePartner, content })
      .select().single();
    if (error) { toast.error(error.message); return; }
    setMessages((ms) => (ms.some((x) => x.id === data!.id) ? ms : [...ms, data as Msg]));
  };

  const searchUsers = async () => {
    if (!searchQ.trim()) return;
    const q = searchQ.trim();
    const { data } = await supabase.from("profiles")
      .select("id, username, email")
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .neq("id", user?.id ?? "")
      .limit(15);
    setSearchResults((data ?? []) as Prof[]);
  };

  const startConversation = (p: Prof) => {
    setProfiles((m) => ({ ...m, [p.id]: p }));
    setActivePartner(p.id);
    setSearching(false); setSearchQ(""); setSearchResults([]);
  };

  const label = (id: string) => profiles[id]?.username || profiles[id]?.email?.split("@")[0] || "Member";

  return (
    <div>
      <PageHeader title="Messages" subtitle="Direct, private conversations with your community." />
      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-14rem)] min-h-[500px]">
        <aside className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <button onClick={() => setSearching((v) => !v)} className="press w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              <Search className="h-4 w-4" /> New conversation
            </button>
            {searching && (
              <form onSubmit={(e) => { e.preventDefault(); searchUsers(); }} className="mt-2 space-y-2">
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search by name or email" className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs" />
                {searchResults.map((r) => (
                  <button key={r.id} onClick={() => startConversation(r)} className="press w-full text-left px-2 py-1.5 rounded-lg border border-border bg-background text-xs hover:bg-accent">
                    <div className="font-semibold">{r.username || r.email || "Member"}</div>
                    <div className="text-muted-foreground truncate">{r.email}</div>
                  </button>
                ))}
              </form>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No conversations yet.</div>}
            {conversations.map(({ partner, last, unread }) => (
              <button key={partner} onClick={() => setActivePartner(partner)}
                className={cn("press w-full text-left px-3 py-2 rounded-xl border transition-colors",
                  activePartner === partner ? "bg-primary/10 border-primary" : "border-transparent hover:bg-accent")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm truncate">{label(partner)}</div>
                  {unread > 0 && <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unread}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{last.content}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden min-h-0">
          {activePartner ? (
            <>
              <div className="px-4 py-3 border-b border-border font-bold">{label(activePartner)}</div>
              <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeMessages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        mine ? "bg-primary text-primary-foreground" : "bg-background border border-border")}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-border flex gap-2 items-end">
                <VoiceButton onTranscript={(t, final) => setDraft((d) => (final ? (d ? d + " " : "") + t : d))} />
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1} placeholder="Message…"
                  className="flex-1 resize-none max-h-32 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button className="press p-2.5 rounded-xl bg-primary text-primary-foreground" disabled={!draft.trim()}><Send className="h-4 w-4" /></button>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-8">Pick a conversation or start a new one.</div>
          )}
        </section>
      </div>
    </div>
  );
}
