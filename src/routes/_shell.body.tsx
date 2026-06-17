import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Droplet, Moon, Pill, Plus, Minus, TrendingUp, MessageSquare, BookOpen, ExternalLink } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/body")({
  head: () => ({ meta: [{ title: "Body · me." }] }),
  component: Body,
});

const TABS = ["Health & Lifestyle", "Positive Relationships", "Financial Stewardship", "Active Communication"] as const;

function Body() {
  const [tab, setTab] = useState<typeof TABS[number]>("Health & Lifestyle");
  return (
    <div>
      <PageHeader title="Body" subtitle="The physical, relational, financial, and verbal you." accent="body" />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("press whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border",
            tab === t ? "bg-body text-body-foreground border-body" : "border-border")}>{t}</button>
        ))}
      </div>
      <div key={tab} className="animate-[fade-in_0.3s_ease-out]">
        {tab === "Health & Lifestyle" && <Health />}
        {tab === "Positive Relationships" && <Relationships />}
        {tab === "Financial Stewardship" && <Finance />}
        {tab === "Active Communication" && <Communication />}
      </div>
    </div>
  );
}

function Health() {
  const { water, setWater, sleepHours, setSleep, pillsFreeDays, logPillFreeDay } = useApp();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card title="Water intake" icon={Droplet}>
        <div className="flex items-center gap-4 mt-3">
          <button onClick={() => setWater(Math.max(0, water - 1))} className="press p-3 rounded-xl border border-border"><Minus className="h-4 w-4" /></button>
          <div className="text-4xl font-black text-body">{water}<span className="text-base text-muted-foreground ml-1">/ 8</span></div>
          <button onClick={() => setWater(water + 1)} className="press p-3 rounded-xl bg-body text-body-foreground"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-body transition-all duration-500" style={{ width: `${Math.min(100, (water / 8) * 100)}%` }} />
        </div>
      </Card>
      <Card title="Sleep hygiene" icon={Moon}>
        <input type="range" min={4} max={10} step={0.5} value={sleepHours} onChange={(e) => setSleep(+e.target.value)} className="w-full mt-4 accent-body" />
        <div className="text-3xl font-black text-body mt-2">{sleepHours} hrs</div>
        <p className="text-xs text-muted-foreground mt-1">Aim for 7–9 hours. Wind-down rituals compound.</p>
      </Card>
      <Card title="Zero pills logger" icon={Pill}>
        <div className="text-3xl font-black text-body mt-3">{pillsFreeDays} <span className="text-base text-muted-foreground">days</span></div>
        <p className="text-xs text-muted-foreground mt-1">Lifestyle medicine first.</p>
        <button onClick={logPillFreeDay} className="press mt-3 w-full py-2 rounded-xl bg-body text-body-foreground text-sm font-semibold">+ Log a day</button>
      </Card>
      <FoodCard />
      <ExerciseCard />
      <ReadingCard />
    </div>
  );
}

function FoodCard() {
  const { foodPlan, setFoodPlan } = useApp();
  return (
    <div className="lift rounded-3xl border border-border bg-card p-6 md:col-span-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-body">Food plan</div>
      <textarea value={foodPlan} onChange={(e) => setFoodPlan(e.target.value)} className="mt-3 w-full h-32 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
    </div>
  );
}
function ExerciseCard() {
  const { exercisePlan, setExercisePlan } = useApp();
  return (
    <div className="lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-body">Exercise plan</div>
      <textarea value={exercisePlan} onChange={(e) => setExercisePlan(e.target.value)} className="mt-3 w-full h-32 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
    </div>
  );
}
function ReadingCard() {
  const { resources } = useApp();
  const reading = resources.filter((r) => r.category === "Body" && r.status === "in-progress");
  return (
    <div className="lift rounded-3xl border border-border bg-card p-6 md:col-span-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-body inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Currently reading</div>
        <Link to="/resources" className="text-xs text-muted-foreground hover:text-foreground">Library →</Link>
      </div>
      {reading.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3">Mark a Body resource as <em>In Progress</em> in the library to surface it here.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {reading.map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-body/10 border border-body/30">
              <div className="text-[10px] uppercase text-body">{r.type}</div>
              <div className="font-bold text-sm">{r.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Relationships() {
  const [reflection, setReflection] = useState("");
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Boundary blueprint">
        <ul className="mt-3 text-sm space-y-2 text-muted-foreground list-disc pl-5">
          <li>Define what you'll say yes / no to this week.</li>
          <li>Replace "I should" with "I choose".</li>
          <li>Codependency check: am I rescuing or relating?</li>
          <li>Schedule one mutual-energy conversation.</li>
        </ul>
      </Card>
      <Card title="Reflection space">
        <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Where am I leaking energy?" className="mt-3 w-full h-40 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </Card>
    </div>
  );
}

function Finance() {
  const { user, savingsRatio, setSavingsRatio, income, setIncome } = useApp();
  const save = Math.round((income * savingsRatio) / 100);
  const spend = income - save;
  const makeStrategies: Record<string, string[]> = {
    Student: ["Tutor / TA for your strongest subject", "Sell a digital template or notes pack", "Freelance micro-gigs on weekends"],
    Employee: ["Negotiate next review with a value memo", "Side-skill: pick one high-leverage skill", "Coach juniors in your craft for a fee"],
    "Business Owner": ["Raise a single price by 10%", "Launch a productized service", "Build one referral partnership"],
    "In-Transition": ["Offer paid 1:1 consults in your last domain", "Ship a small portfolio piece this week", "Convert one connection into a paid intro project"],
  };
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Make">
        <p className="text-xs text-muted-foreground mt-1">For your phase: {user.phase}</p>
        <ul className="mt-3 text-sm space-y-2 text-muted-foreground list-disc pl-5">
          {makeStrategies[user.phase].map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Card>
      <Card title="Manage">
        <label className="block text-xs text-muted-foreground mt-2">Monthly income</label>
        <input type="number" value={income} onChange={(e) => setIncome(+e.target.value || 0)} className="w-full bg-background border border-border rounded-xl px-3 py-2 mt-1 text-sm" />
        <label className="block text-xs text-muted-foreground mt-3">Savings ratio: <span className="font-bold text-body">{savingsRatio}%</span></label>
        <input type="range" min={0} max={70} value={savingsRatio} onChange={(e) => setSavingsRatio(+e.target.value)} className="w-full accent-body mt-1" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Pill2 label="Save" value={`$${save}`} />
          <Pill2 label="Spend" value={`$${spend}`} />
        </div>
      </Card>
      <Card title="Grow" icon={TrendingUp}>
        <ul className="mt-3 text-sm space-y-2 text-muted-foreground">
          <li>✓ 3–6 mo emergency reserve</li>
          <li>✓ Index funds (auto-invest weekly)</li>
          <li>✓ Skill that pays compounds faster than money</li>
          <li>✓ Avoid lifestyle creep on new income</li>
        </ul>
      </Card>
    </div>
  );
}

function Communication() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Mirror & validate", body: '"What I\'m hearing is… Did I get that right?" — slows reactivity and proves presence.' },
    { title: 'Use "I" statements', body: '"I feel ___ when ___ because ___" instead of "You always…".' },
    { title: "Name the need", body: 'State what would help: "What I need right now is a 10-minute pause."' },
    { title: "Co-create the next step", body: '"How can we both leave this better?"' },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Scenario lab" icon={MessageSquare}>
        <p className="text-sm text-muted-foreground mt-2">Trigger: "You never listen to me."</p>
        <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm">Defensive: "That's not true, you don't either."</div>
        <div className="mt-2 p-3 rounded-xl bg-body/10 border border-body/30 text-sm">Active: "It sounds like you've been feeling unseen. Tell me more."</div>
      </Card>
      <Card title="Active blueprint">
        <div className="flex gap-1 mt-2">
          {steps.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= step ? "bg-body" : "bg-muted")} />
          ))}
        </div>
        <div key={step} className="mt-4 animate-[slide-in_0.3s_ease-out]">
          <div className="text-xs uppercase tracking-wider text-body">Step {step + 1}</div>
          <div className="text-lg font-bold">{steps[step].title}</div>
          <p className="text-sm text-muted-foreground mt-1">{steps[step].body}</p>
        </div>
        <div className="mt-4 flex justify-between">
          <button onClick={() => setStep(Math.max(0, step - 1))} className="press px-3 py-2 rounded-xl border border-border text-sm">Back</button>
          <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} className="press px-3 py-2 rounded-xl bg-body text-body-foreground text-sm font-semibold">Next</button>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, icon: Icon, children, className }: { title: string; icon?: any; children: any; className?: string }) {
  return (
    <div className={cn("lift rounded-3xl border border-border bg-card p-6", className)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-body">
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
      </div>
      {children}
    </div>
  );
}
function Pill2({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-body/10 border border-body/30">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-black text-body">{value}</div>
    </div>
  );
}
