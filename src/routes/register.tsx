import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, type Phase } from "@/lib/app-context";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({ meta: [{ title: "Begin · me." }, { name: "description", content: "Set up your me. profile." }] }),
  component: Register,
});

const PHASES: { phase: Phase; blurb: string }[] = [
  { phase: "Student", blurb: "School, studies, and shaping who you're becoming." },
  { phase: "Employee", blurb: "Role-based rhythm with deep work and recovery." },
  { phase: "Business Owner", blurb: "Founder cadence: people, pipeline, profit." },
  { phase: "In-Transition", blurb: "Bridging seasons with clarity and momentum." },
];
const FOCUSES = ["Improve my relationship with God", "Cognitive Renewal", "Healthy Lifestyle", "Financial Stewardship"];

function Register() {
  const nav = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { setUser, setPhase } = useApp();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phase: "Employee" as Phase, detailA: "", detailB: "", focus: FOCUSES[0] });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", replace: true });
  }, [user, loading, nav]);

  useEffect(() => {
    if (profile?.username) setForm((f) => ({ ...f, name: profile.username || "" }));
  }, [profile?.username]);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        username: form.name || "Friend",
        life_phase: form.phase,
        detail_a: form.detailA,
        detail_b: form.detailB,
        focus: form.focus,
      }).eq("id", user.id);
      await refreshProfile();
      setUser({ name: form.name, detailA: form.detailA, detailB: form.detailB, focus: form.focus });
      setPhase(form.phase);
      toast.success("You're set. Welcome to me.");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Couldn't save profile");
    } finally {
      setSaving(false);
    }
  };

  const labels: Record<Phase, [string, string]> = {
    Student: ["School / College", "Major"],
    Employee: ["Company", "Role / Title"],
    "Business Owner": ["Business Name", "Type / Industry"],
    "In-Transition": ["Transition Goal", "Next Industry Target"],
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <Link to="/" className="text-2xl font-black">me<span className="text-primary">.</span></Link>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className={cn("h-1.5 rounded-full transition-all duration-300", n <= step ? "bg-primary w-10" : "bg-muted w-6")} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div key={step} className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl animate-[slide-in_0.35s_ease-out]">
          {step === 1 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">What season are you in?</h2>
              <p className="text-muted-foreground mb-6">We tune your daily rhythm to it.</p>
              <Field label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Sarah Chen" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {PHASES.map((p) => (
                  <button key={p.phase} onClick={() => setForm({ ...form, phase: p.phase })}
                    className={cn("press text-left p-4 rounded-2xl border-2 transition-all", form.phase === p.phase ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40")}>
                    <div className="font-bold">{p.phase}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.blurb}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Tell us a bit more.</h2>
              <p className="text-muted-foreground mb-6">Context shapes the coaching.</p>
              <div className="space-y-4">
                <Field label={labels[form.phase][0]} value={form.detailA} onChange={(v) => setForm({ ...form, detailA: v })} />
                <Field label={labels[form.phase][1]} value={form.detailB} onChange={(v) => setForm({ ...form, detailB: v })} />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Where do we start?</h2>
              <p className="text-muted-foreground mb-6">Pick your first focus — you can always evolve.</p>
              <div className="grid grid-cols-1 gap-3">
                {FOCUSES.map((f) => (
                  <button key={f} onClick={() => setForm({ ...form, focus: f })}
                    className={cn("press text-left p-4 rounded-2xl border-2 flex items-center justify-between", form.focus === f ? "border-primary bg-primary/5" : "border-border")}>
                    <span className="font-medium">{f}</span>
                    {form.focus === f && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button onClick={back} disabled={step === 1} className="press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 3 ? (
              <button onClick={next} className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={saving} className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enter me. <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
    </label>
  );
}
