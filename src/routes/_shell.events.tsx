import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar as CalIcon, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/app-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/events")({
  head: () => ({ meta: [{ title: "Events · me." }] }),
  component: EventsPage,
});

interface Ev {
  id: string; tribe_id: string; created_by: string; title: string;
  description: string | null; starts_at: string; ends_at: string | null;
  location: string | null;
}

function EventsPage() {
  const { user } = useAuth();
  const { tribes, joinedTribes } = useApp();
  const [tribeMap, setTribeMap] = useState<Record<string, string>>({}); // id → name
  const [tribeByName, setTribeByName] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Ev[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ tribe: "", title: "", description: "", starts_at: "", ends_at: "", location: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tribes").select("id, name");
      const map: Record<string, string> = {}; const byName: Record<string, string> = {};
      for (const t of (data ?? []) as { id: string; name: string }[]) { map[t.id] = t.name; byName[t.name] = t.id; }
      setTribeMap(map); setTribeByName(byName);
    })();
  }, [tribes.length]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tribe_events").select("*").order("starts_at");
      setEvents((data ?? []) as Ev[]);
    })();
  }, [user?.id]);

  const grouped = useMemo(() => {
    const now = Date.now();
    const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 86400000);
    const past = events.filter((e) => new Date(e.starts_at).getTime() < now - 86400000).reverse();
    return { upcoming, past };
  }, [events]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.tribe || !form.title || !form.starts_at) return;
    const tribe_id = tribeByName[form.tribe]; if (!tribe_id) return;
    const { data, error } = await supabase.from("tribe_events").insert({
      tribe_id, created_by: user.id,
      title: form.title, description: form.description || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      location: form.location || null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setEvents((es) => [...es, data as Ev].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    setForm({ tribe: "", title: "", description: "", starts_at: "", ends_at: "", location: "" });
    setCreating(false); toast.success("Event created");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setEvents((es) => es.filter((e) => e.id !== id));
    await supabase.from("tribe_events").delete().eq("id", id);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const Card = ({ e }: { e: Ev }) => (
    <div className="lift rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{tribeMap[e.tribe_id] || "Tribe"}</div>
          <h3 className="font-bold text-lg">{e.title}</h3>
        </div>
        {e.created_by === user?.id && (
          <button onClick={() => remove(e.id)} className="press text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
      <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmt(e.starts_at)}{e.ends_at ? ` → ${fmt(e.ends_at)}` : ""}</span>
        {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>}
      </div>
      {e.description && <p className="mt-2 text-sm">{e.description}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Events" subtitle="Gather your tribes — retreats, studies, meetups." />
      <div className="flex justify-between items-center mb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <CalIcon className="h-3.5 w-3.5" /> {events.length} total · {grouped.upcoming.length} upcoming
        </div>
        <button onClick={() => setCreating((v) => !v)} disabled={!joinedTribes.length}
          className={cn("press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold", !joinedTribes.length && "opacity-50")}>
          <Plus className="h-3.5 w-3.5" /> New event
        </button>
      </div>
      {!joinedTribes.length && <div className="text-xs text-muted-foreground mb-4">Join a tribe to create events.</div>}
      {creating && (
        <form onSubmit={create} className="lift rounded-2xl border border-border bg-card p-4 mb-5 grid sm:grid-cols-2 gap-2 animate-[fade-in_0.25s_ease-out]">
          <select value={form.tribe} onChange={(e) => setForm({ ...form, tribe: e.target.value })} required className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
            <option value="">Select tribe…</option>
            {joinedTribes.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Title" className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location (optional)" className="bg-background border border-border rounded-xl px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="bg-background border border-border rounded-xl px-3 py-2 text-sm sm:col-span-2" />
          <button className="press px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold sm:col-span-2">Create event</button>
        </form>
      )}
      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Upcoming</h2>
          <div className="space-y-2">
            {grouped.upcoming.length ? grouped.upcoming.map((e) => <Card key={e.id} e={e} />) : <div className="text-sm text-muted-foreground">No upcoming events.</div>}
          </div>
        </section>
        {grouped.past.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Past</h2>
            <div className="space-y-2 opacity-70">
              {grouped.past.slice(0, 10).map((e) => <Card key={e.id} e={e} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
