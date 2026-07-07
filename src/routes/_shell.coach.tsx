import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/coach")({
  head: () => ({ meta: [{ title: "AI Life Coach · me." }] }),
  component: CoachPage,
});

interface Msg { id: string; role: "user" | "assistant"; content: string }

function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("coach_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages(((data ?? []) as any[]).map((m) => ({ id: m.id, role: m.role, content: m.content })));
      setHistoryLoaded(true);
    })();
  }, [user?.id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || busy || !user) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: t };
    const assistantId = `a-${Date.now()}`;
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: "assistant", content: "" }]);
    setBusy(true);
    abortRef.current = new AbortController();

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/chat", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        throw new Error(err || `Chat failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((ms) => ms.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Chat error");
        setMessages((ms) => ms.filter((m) => m.id !== assistantId));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const resetChat = async () => {
    if (!user) return;
    if (!confirm("Clear your coaching conversation? This deletes the history.")) return;
    await supabase.from("coach_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Fresh start ✨");
  };

  const suggestions = [
    "Help me plan next week around my goals",
    "I feel stuck spiritually — where do I start?",
    "What should I focus on given my recent moods?",
    "Give me one practice for better sleep tonight",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <PageHeader
        title="AI Life Coach"
        subtitle="A private companion that knows your goals, moods, and rhythms. Speak freely."
        accent="mind"
      />

      <div className="flex-1 flex flex-col rounded-3xl border border-border bg-card overflow-hidden min-h-0">
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && historyLoaded && (
            <div className="max-w-xl mx-auto text-center py-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Grounded in your data
              </div>
              <h2 className="text-2xl font-black mb-2">How can I walk with you today?</h2>
              <p className="text-sm text-muted-foreground mb-6">I have your recent moods, streaks, active goals, and journal patterns.</p>
              <div className="grid sm:grid-cols-2 gap-2 text-left">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="press rounded-2xl border border-border bg-background p-3 text-sm hover:border-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const mine = m.role === "user";
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm animate-[fade-in_0.2s_ease-out]",
                    mine ? "bg-primary text-primary-foreground" : "bg-background border border-border",
                  )}
                >
                  {mine ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:mt-3">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="border-t border-border p-3 md:p-4 flex items-end gap-2 bg-background/50"
        >
          <button
            type="button"
            onClick={resetChat}
            title="Reset conversation"
            className="press p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Ask anything…"
            disabled={busy}
            className="flex-1 resize-none max-h-32 bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="press inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
