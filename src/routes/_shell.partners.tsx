import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { UserPlus, Check, X, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/partners")({
  head: () => ({ meta: [{ title: "Accountability Partners · me." }] }),
  component: PartnersPage,
});

interface Pair {
  id: string;
  requester_id: string;
  partner_id: string;
  status: "pending" | "active" | "ended" | "declined";
  created_at: string;
  updated_at: string;
}
interface Profile { id: string; username: string | null; email: string | null }

function PartnersPage() {
  const { user } = useAuth();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("accountability_pairs").select("*").order("updated_at", { ascending: false });
    const rows = (data ?? []) as Pair[];
    setPairs(rows);
    const ids = Array.from(new Set(rows.flatMap((p) => [p.requester_id, p.partner_id]).filter((x) => x !== user.id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, email").in("id", ids);
      const map: Record<string, Profile> = {};
      for (const p of (profs ?? []) as Profile[]) map[p.id] = p;
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const doSearch = async () => {
    const q = search.trim();
    if (!q || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, email")
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(10);
    setResults((data ?? []) as Profile[]);
    setSearching(false);
  };

  const invite = async (partnerId: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("accountability_pairs").insert({
      requester_id: user.id, partner_id: partnerId, status: "pending",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setPairs((ps) => [data as Pair, ...ps]);
    toast.success("Invite sent");
  };

  const respond = async (pair: Pair, status: "active" | "declined") => {
    const { error } = await supabase.from("accountability_pairs").update({ status }).eq("id", pair.id);
    if (error) { toast.error(error.message); return; }
    setPairs((ps) => ps.map((p) => (p.id === pair.id ? { ...p, status } : p)));
  };

  const end = async (pair: Pair) => {
    const { error } = await supabase.from("accountability_pairs").update({ status: "ended" }).eq("id", pair.id);
    if (error) { toast.error(error.message); return; }
    setPairs((ps) => ps.map((p) => (p.id === pair.id ? { ...p, status: "ended" } : p)));
  };

  const other = (p: Pair) => (p.requester_id === user?.id ? p.partner_id : p.requester_id);
  const nameOf = (uid: string) => profiles[uid]?.username || profiles[uid]?.email || "Member";

  const active = pairs.filter((p) => p.status === "active");
  const incoming = pairs.filter((p) => p.status === "pending" && p.partner_id === user?.id);
  const outgoing = pairs.filter((p) => p.status === "pending" && p.requester_id === user?.id);
  const past = pairs.filter((p) => p.status === "ended" || p.status === "declined");

  const weeklyPrompt = useMemo(() => {
    const prompts = [
      "What was one win this week you'd credit to grace, not grit?",
      "Where did you feel most alive? Most drained?",
      "One habit to tighten next week — what and why?",
      "How did you show up spiritually this week?",
      "What lie are you tempted to believe about yourself right now?",
    ];
    const idx = new Date().getDay() % prompts.length;
    return prompts[idx];
  }, []);

  return (
    <div>
      <PageHeader title="Accountability Partners" subtitle="Walk with someone. Weekly check-ins keep you honest, gentle, and moving." accent="faith" />

      {active.length > 0 && (
        <div className="lift rounded-3xl border border-border bg-card p-5 mb-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">This Week's Check-In Prompt</div>
          <div className="text-lg font-bold">"{weeklyPrompt}"</div>
          <div className="text-xs text-muted-foreground mt-2">Share your answer with your partner(s) — text them, voice message, or bring it to your next call.</div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="lift rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <div className="font-bold">Your Partners</div>
          </div>
          {active.length === 0 && <div className="text-sm text-muted-foreground py-2">No active partners yet. Invite someone below.</div>}
          <ul className="space-y-2">
            {active.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">
                  {nameOf(other(p))[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{nameOf(other(p))}</div>
                  <div className="text-xs text-muted-foreground">Partnered since {new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => end(p)} className="press text-xs text-muted-foreground hover:text-destructive">End</button>
              </li>
            ))}
          </ul>

          {incoming.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Requests for you</div>
              <ul className="space-y-2">
                {incoming.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                    <div className="flex-1 font-medium">{nameOf(other(p))} wants to partner up</div>
                    <button onClick={() => respond(p, "active")} className="press p-2 rounded-lg bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
                    <button onClick={() => respond(p, "declined")} className="press p-2 rounded-lg border border-border"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {outgoing.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">Awaiting response</div>
              <ul className="space-y-2">
                {outgoing.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                    <div className="flex-1 font-medium text-muted-foreground">{nameOf(other(p))} · pending</div>
                    <button onClick={() => end(p)} className="press text-xs text-muted-foreground hover:text-destructive">Cancel</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="lift rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-primary" />
            <div className="font-bold">Find a Partner</div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); doSearch(); }} className="flex gap-2 mb-3">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
            <button className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              <Search className="h-4 w-4" />
            </button>
          </form>
          {searching && <div className="text-sm text-muted-foreground">Searching…</div>}
          <ul className="space-y-2">
            {results.map((r) => {
              const already = pairs.some((p) => other(p) === r.id && (p.status === "pending" || p.status === "active"));
              return (
                <li key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">
                    {(r.username || r.email || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.username || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  </div>
                  <button
                    disabled={already}
                    onClick={() => invite(r.id)}
                    className={cn("press px-3 py-1.5 rounded-lg text-xs font-semibold",
                      already ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}
                  >
                    {already ? "Requested" : "Invite"}
                  </button>
                </li>
              );
            })}
          </ul>
          {past.length > 0 && (
            <div className="mt-4 text-xs text-muted-foreground">Past partnerships: {past.length}</div>
          )}
        </section>
      </div>
    </div>
  );
}
