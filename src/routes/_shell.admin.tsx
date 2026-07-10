import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Shield, BarChart3, Sparkles, KeyRound, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { useApp, type Resource } from "@/lib/app-context";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { getAdminStats } from "@/lib/admin.functions";
import { getAiSettings, saveAiSettings, clearAiApiKey } from "@/lib/ai-settings.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin")({
  head: () => ({ meta: [{ title: "Admin · me." }] }),
  component: Admin,
});

const TABS = ["Analytics", "AI", "Content", "Library", "Tribes", "Users"] as const;

function Admin() {
  const nav = useNavigate();
  const { role, loading } = useAuth();
  const [tab, setTab] = useState<typeof TABS[number]>("Analytics");

  useEffect(() => {
    if (!loading && role !== "admin") {
      toast.error("Unauthorized — admin access required.");
      nav({ to: "/dashboard", replace: true });
    }
  }, [role, loading, nav]);

  if (loading || role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
        <Shield className="h-4 w-4" /> Verifying access…
      </div>
    );
  }

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
        {tab === "Analytics" && <Analytics />}
        {tab === "AI" && <AISettings />}
        {tab === "Content" && <Content />}
        {tab === "Library" && <Library />}
        {tab === "Tribes" && <Tribes />}
        {tab === "Users" && <Users />}
      </div>
    </div>
  );
}

const PROVIDER_PRESETS = [
  { id: "lovable", label: "Lovable AI (default)", baseURL: "", models: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini", "openai/gpt-5"] },
  { id: "openai", label: "OpenAI", baseURL: "https://api.openai.com/v1", models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
  { id: "anthropic", label: "Anthropic (Claude)", baseURL: "https://api.anthropic.com/v1", models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"] },
  { id: "google", label: "Google Gemini (direct)", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"] },
  { id: "openrouter", label: "OpenRouter", baseURL: "https://openrouter.ai/api/v1", models: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "meta-llama/llama-3.3-70b-instruct"] },
  { id: "groq", label: "Groq", baseURL: "https://api.groq.com/openai/v1", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"] },
  { id: "custom", label: "Custom (OpenAI-compatible)", baseURL: "", models: [] },
];

function AISettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState({
    ai_provider: "lovable",
    ai_model: "google/gemini-3-flash-preview",
    ai_api_key: "",
    ai_base_url: "",
    ai_api_key_masked: "",
    has_api_key: false,
    lovable_key_present: false,
    updated_at: null as string | null,
  });

  const refresh = () => {
    setLoading(true);
    getAiSettings().then((s) => {
      setState((prev) => ({ ...prev, ...s, ai_api_key: "" }));
      setLoading(false);
    }).catch((e) => { toast.error(e?.message || "Failed to load"); setLoading(false); });
  };
  useEffect(refresh, []);

  const preset = PROVIDER_PRESETS.find((p) => p.id === state.ai_provider) ?? PROVIDER_PRESETS[0];

  const onProviderChange = (id: string) => {
    const p = PROVIDER_PRESETS.find((x) => x.id === id) ?? PROVIDER_PRESETS[0];
    setState((s) => ({
      ...s,
      ai_provider: id,
      ai_base_url: p.baseURL,
      ai_model: p.models[0] ?? s.ai_model,
    }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveAiSettings({ data: {
        ai_provider: state.ai_provider,
        ai_model: state.ai_model,
        ai_api_key: state.ai_api_key || null,
        ai_base_url: state.ai_base_url || null,
      }});
      toast.success("AI settings saved. Applied to every AI feature immediately.");
      refresh();
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const onClearKey = async () => {
    if (!confirm("Clear the stored API key? AI features will fall back to the built-in Lovable AI key.")) return;
    try {
      await clearAiApiKey();
      toast.success("API key cleared");
      refresh();
    } catch (e: any) { toast.error(e?.message || "Clear failed"); }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading AI settings…</div>;

  const usingCustomKey = state.has_api_key;
  const keyStatus = usingCustomKey
    ? { color: "text-emerald-500", label: `Custom key active (${state.ai_api_key_masked})` }
    : state.lovable_key_present
    ? { color: "text-primary", label: "Falling back to built-in Lovable AI key" }
    : { color: "text-destructive", label: "No API key configured — AI features will fail" };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="lift rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">AI provider</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Choose which AI powers the Coach, Daily Briefing, Weekly Review, Journal Reflection, Body Coach, and Verse Suggestions. Changes take effect on the next AI request — no redeploy needed.
        </p>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Provider</span>
            <select value={state.ai_provider} onChange={(e) => onProviderChange(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm">
              {PROVIDER_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Model</span>
            <input list="ai-model-suggestions" value={state.ai_model}
              onChange={(e) => setState({ ...state, ai_model: e.target.value })}
              placeholder="e.g. gpt-4o-mini or google/gemini-2.5-flash"
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-mono" />
            <datalist id="ai-model-suggestions">
              {preset.models.map((m) => <option key={m} value={m} />)}
            </datalist>
            <span className="text-xs text-muted-foreground">Use the exact model ID accepted by your provider's Chat Completions endpoint.</span>
          </label>

          {state.ai_provider !== "lovable" && (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Base URL</span>
              <input value={state.ai_base_url} onChange={(e) => setState({ ...state, ai_base_url: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-mono" />
              <span className="text-xs text-muted-foreground">OpenAI-compatible /chat/completions endpoint. Preset providers auto-fill this.</span>
            </label>
          )}

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> API key
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={state.ai_api_key}
                  onChange={(e) => setState({ ...state, ai_api_key: e.target.value })}
                  placeholder={usingCustomKey ? `Currently set: ${state.ai_api_key_masked} — paste new to replace` : "sk-... / paste your API key"}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 pr-10 text-sm font-mono"
                />
                <button type="button" onClick={() => setShowKey((v) => !v)} tabIndex={-1}
                  className="press absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {usingCustomKey && (
                <button type="button" onClick={onClearKey} className="press px-3 py-2 rounded-xl border border-border text-xs text-destructive whitespace-nowrap">
                  Clear
                </button>
              )}
            </div>
            <div className={cn("text-xs font-medium mt-1", keyStatus.color)}>● {keyStatus.label}</div>
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              {state.updated_at ? `Last saved ${new Date(state.updated_at).toLocaleString()}` : "Never saved."}
            </div>
            <button onClick={onSave} disabled={saving}
              className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
        <div className="font-bold text-foreground text-sm mb-1">Security notes</div>
        <div>• The key is stored server-side and only visible to admins (masked in this UI).</div>
        <div>• Leave the API key field empty when saving to keep the existing key untouched.</div>
        <div>• Non-OpenAI-compatible providers (native Claude, Bedrock, Vertex) aren't supported here — use OpenRouter or the provider's OpenAI-compatible endpoint.</div>
        <div>• Rate limits and billing errors from your chosen provider will surface directly in the affected features.</div>
      </div>
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getAdminStats().then(setData).catch((e) => setErr(e?.message || "Failed to load"));
  }, []);
  if (err) return <div className="text-sm text-destructive">{err}</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Loading analytics…</div>;
  const cards = [
    { label: "Total users", val: data.total_users },
    { label: "DAU", val: data.dau },
    { label: "WAU", val: data.wau },
    { label: "MAU", val: data.mau },
    { label: "Posts (30d)", val: data.posts_last },
    { label: "Moods (30d)", val: data.moods_last },
    { label: "Journals (30d)", val: data.journals_last },
    { label: "XP earned (30d)", val: data.xp_last },
  ];
  const maxDay = Math.max(1, ...data.daily_active.map((d) => d.users));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="lift rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-2xl font-black mt-1">{c.val}</div>
          </div>
        ))}
      </div>
      <div className="lift rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Daily active (30d)</div>
        <div className="mt-3 flex items-end gap-1 h-32">
          {data.daily_active.map((d) => (
            <div key={d.day} className="flex-1 rounded-md bg-gradient-to-t from-primary to-faith" style={{ height: `${(d.users / maxDay) * 100}%` }} title={`${d.day}: ${d.users}`} />
          ))}
          {!data.daily_active.length && <div className="text-xs text-muted-foreground self-center">No activity yet.</div>}
        </div>
      </div>
      <div className="lift rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Actions by type (30d)</div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {Object.entries(data.by_action).sort((a, b) => b[1] - a[1]).map(([action, c]) => (
            <div key={action} className="flex items-center justify-between border border-border bg-background rounded-lg px-3 py-2">
              <span>{action}</span><span className="font-bold">{c}</span>
            </div>
          ))}
        </div>
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
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Verse of the day (override)</div>
        <textarea value={vText} onChange={(e) => setVText(e.target.value)} className="mt-3 w-full h-28 bg-background border border-border rounded-xl p-3 text-sm" />
        <input value={vRef} onChange={(e) => setVRef(e.target.value)} className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" placeholder="Reference (e.g. John 3:16)" />
        <button onClick={() => { setVerse(vText, vRef); toast.success("Verse published"); }} className="press mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Publish</button>
        <p className="text-xs text-muted-foreground mt-2">Auto-rotates daily unless overridden.</p>
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
  const [draft, setDraft] = useState<{ title: string; type: Resource["type"]; category: Resource["category"]; summary: string }>({ title: "", type: "Books", category: "General", summary: "" });
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (draft.title.trim()) { addResource(draft); setDraft({ title: "", type: "Books", category: "General", summary: "" }); } }} className="lift rounded-2xl border border-border bg-card p-5 grid md:grid-cols-5 gap-2 mb-5">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="bg-background border border-border rounded-xl px-3 py-2 text-sm md:col-span-2" />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Resource["type"] })} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
          {(["Books", "Audio", "Frameworks", "Checklists", "Video"] as const).map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Resource["category"] })} className="bg-background border border-border rounded-xl px-3 py-2 text-sm">
          {(["General", "Faith", "Mind", "Body"] as const).map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="press inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /> Add</button>
        <input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Summary" className="bg-background border border-border rounded-xl px-3 py-2 text-sm md:col-span-5" />
      </form>
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="lift rounded-xl border border-border bg-card p-4 grid md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <div>
              <input value={r.title} onChange={(e) => updateResource(r.id, { title: e.target.value })} className="w-full font-bold bg-transparent focus:outline-none" />
              <input value={r.summary} onChange={(e) => updateResource(r.id, { summary: e.target.value })} className="w-full text-xs text-muted-foreground bg-transparent focus:outline-none" />
            </div>
            <select value={r.type} onChange={(e) => updateResource(r.id, { type: e.target.value as Resource["type"] })} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs">
              {(["Books", "Audio", "Frameworks", "Checklists", "Video"] as const).map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={r.category} onChange={(e) => updateResource(r.id, { category: e.target.value as Resource["category"] })} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs">
              {(["General", "Faith", "Mind", "Body"] as const).map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => removeResource(r.id)} className="press p-2 rounded-lg border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {resources.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No resources yet.</div>}
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
          {tribes.length === 0 && <li className="text-sm text-muted-foreground text-center py-3">No tribes yet.</li>}
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
          {posts.length === 0 && <li className="text-sm text-muted-foreground text-center py-3">No posts yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Users() {
  const { user, setPhase, moodHistory } = useApp();
  return (
    <div className="space-y-5">
      <div className="lift rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">You</div>
        <div className="mt-2 grid sm:grid-cols-3 gap-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Name</div><div className="font-bold">{user.name}</div></div>
          <div><div className="text-xs text-muted-foreground">Email</div><div className="font-bold">{user.email || "—"}</div></div>
          <div>
            <div className="text-xs text-muted-foreground">Life phase</div>
            <select value={user.phase} onChange={(e) => setPhase(e.target.value as any)} className="bg-background border border-border rounded-lg px-2 py-1 text-xs mt-1">
              {["Student", "Employee", "Business Owner", "In-Transition"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Manage roles & directory in the backend dashboard.</p>
      </div>
      <div className="lift rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Edit3 className="h-3.5 w-3.5" /> {user.name}'s mood history</div>
        <div className="mt-3 flex items-end gap-1 h-24">
          {moodHistory.slice(-14).map((d, i) => {
            const h = d.mood === "Excellent" ? 100 : d.mood === "Good" ? 75 : d.mood === "Neutral" ? 45 : 25;
            return <div key={i} className="flex-1 rounded-md bg-gradient-to-t from-primary to-faith" style={{ height: `${h}%` }} title={`${d.day}: ${d.mood}`} />;
          })}
          {moodHistory.length === 0 && <div className="text-xs text-muted-foreground self-center">No mood logs yet.</div>}
        </div>
      </div>
    </div>
  );
}
