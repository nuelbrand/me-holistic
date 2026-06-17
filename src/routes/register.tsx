import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useApp, type Phase } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
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
  const { setUser, setPhase } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", phase: "Employee" as Phase, detailA: "", detailB: "", focus: FOCUSES[0] });

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const finish = () => {
    setUser({ name: form.name || "Friend", email: form.email, detailA: form.detailA, detailB: form.detailB, focus: form.focus });
    setPhase(form.phase);
    nav({ to: "/dashboard" });
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
        <span className="text-2xl font-black">me<span className="text-primary">.</span></span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={cn("h-1.5 rounded-full transition-all duration-300", n <= step ? "bg-primary w-10" : "bg-muted w-6")} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div key={step} className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl animate-[slide-in_0.35s_ease-out]">
          {step === 1 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Let's meet you<span className="text-primary">.</span></h2>
              <p className="text-muted-foreground mb-6">Just the basics to set the stage.</p>
              <div className="space-y-4">
                <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Sarah Chen" />
                <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" type="email" />
                <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" type="password" />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">What season are you in?</h2>
              <p className="text-muted-foreground mb-6">We tune your daily rhythm to it.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PHASES.map((p) => (
                  <button
                    key={p.phase}
                    onClick={() => setForm({ ...form, phase: p.phase })}
                    className={cn("press text-left p-4 rounded-2xl border-2 transition-all", form.phase === p.phase ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40")}
                  >
                    <div className="font-bold">{p.phase}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.blurb}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Tell us a bit more.</h2>
              <p className="text-muted-foreground mb-6">Context shapes the coaching.</p>
              <div className="space-y-4">
                <Field label={labels[form.phase][0]} value={form.detailA} onChange={(v) => setForm({ ...form, detailA: v })} />
                <Field label={labels[form.phase][1]} value={form.detailB} onChange={(v) => setForm({ ...form, detailB: v })} />
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-2xl md:text-3xl font-black mb-2">Where do we start?</h2>
              <p className="text-muted-foreground mb-6">Pick your first focus — you can always evolve.</p>
              <div className="grid grid-cols-1 gap-3">
                {FOCUSES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setForm({ ...form, focus: f })}
                    className={cn("press text-left p-4 rounded-2xl border-2 flex items-center justify-between", form.focus === f ? "border-primary bg-primary/5" : "border-border")}
                  >
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
            {step < 4 ? (
              <button onClick={next} className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finish} className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">
                Enter me. <ArrowRight className="h-4 w-4" />
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
    </label>
  );
}
