import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Smile, Meh, Frown, Star, Plus, X, Zap, ArrowRight, RefreshCw, Sparkles, Flame, Trophy, Target, CalendarCheck } from "lucide-react";
import { useApp, type Mood } from "@/lib/app-context";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useStats } from "@/lib/stats-context";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDailyBriefing, getWeeklyReview, seedGoalsFromSuggestions } from "@/lib/ai.functions";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · me." }] }),
  component: Dashboard,
});

const MOODS: { m: Mood; icon: typeof Smile }[] = [
  { m: "Excellent", icon: Star }, { m: "Good", icon: Smile }, { m: "Neutral", icon: Meh }, { m: "Stressed", icon: Frown },
];

interface Briefing {
  greeting: string;
  verse_text: string | null;
  verse_ref: string | null;
  mood_summary: string | null;
  focus_points: string[];
}
interface Review {
  wins: string[];
  patterns: string[];
  suggestions: string[];
  summary: string | null;
  week_start: string;
}

function Dashboard() {
  const { user, mood, setMood, tasks, toggleTask, addTask, removeTask, lifeHappens, setLifeHappens, moodHistory } = useApp();
  const { user: authUser } = useAuth();
  const stats = useStats();
  const [newTask, setNewTask] = useState("");
  const done = tasks.filter((t) => t.done).length;

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBriefing = useServerFn(getDailyBriefing);
  const fetchReview = useServerFn(getWeeklyReview);
  const seedGoals = useServerFn(seedGoalsFromSuggestions);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    (async () => {
      setBriefingLoading(true);
      try {
        const b = await fetchBriefing({ data: {} });
        if (!cancelled) setBriefing(b as Briefing);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) toast.error("Couldn't load your briefing.");
      } finally {
        if (!cancelled) setBriefingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const regenerate = async () => {
    setBriefingLoading(true);
    try {
      const b = await fetchBriefing({ data: { regenerate: true } });
      setBriefing(b as Briefing);
      toast.success("Fresh briefing generated.");
    } catch { toast.error("Regeneration failed."); }
    setBriefingLoading(false);
  };

  const loadReview = async () => {
    setReviewLoading(true);
    try {
      const r = await fetchReview({ data: {} });
      setReview(r as Review);
    } catch { toast.error("Couldn't generate weekly review."); }
    setReviewLoading(false);
  };

  const acceptSuggestions = async () => {
    if (!review?.suggestions?.length) return;
    try {
      await seedGoals({ data: { titles: review.suggestions.slice(0, 5) } });
      toast.success("Suggestions added to weekly goals.");
    } catch { toast.error("Couldn't seed goals."); }
  };

  const handleMood = async (m: Mood) => {
    await setMood(m);
    await awardXp(authUser?.id, "mood_logged");
    stats.refresh();
  };
  const handleToggle = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    toggleTask(id);
    if (t && !t.done) {
      await awardXp(authUser?.id, "task_completed");
      stats.refresh();
    }
  };

  return (
    <div>
      <PageHeader title={`Hi, ${user.name} 👋`} subtitle={`${user.detailB || "On your path"} ${user.detailA ? "at " + user.detailA : ""} · ${user.phase}`} />

      {/* AI Daily Briefing hero */}
      <div className="lift rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-faith/10 p-6 mb-5 relative overflow-hidden animate-[fade-in_0.4s_ease-out]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Today's Briefing · AI</span>
          </div>
          <button onClick={regenerate} disabled={briefingLoading} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", briefingLoading && "animate-spin")} /> Regenerate
          </button>
        </div>
        {briefingLoading && !briefing && <div className="mt-4 space-y-2"><div className="h-6 w-3/4 rounded bg-muted animate-pulse" /><div className="h-4 w-1/2 rounded bg-muted animate-pulse" /></div>}
        {briefing && (
          <div className="mt-3 space-y-3">
            <p className="text-lg md:text-xl font-bold">{briefing.greeting}</p>
            {briefing.verse_text && (
              <blockquote className="border-l-2 border-faith pl-4 italic text-sm text-muted-foreground">
                "{briefing.verse_text}" <span className="not-italic font-semibold text-faith">— {briefing.verse_ref}</span>
              </blockquote>
            )}
            {briefing.mood_summary && <p className="text-sm text-muted-foreground">{briefing.mood_summary}</p>}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Today's focus</div>
              <ul className="grid sm:grid-cols-3 gap-2">
                {briefing.focus_points.map((p, i) => (
                  <li key={i} className="press rounded-xl bg-background border border-border p-3 text-sm font-medium">
                    <span className="text-primary font-bold mr-1">{i + 1}.</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Trophy} label="Level" value={stats.level.toString()} color="text-primary" sub={`${stats.totalXp} XP total`} />
        <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} color="text-orange-500" sub={`best ${stats.longestStreak}d`} />
        <StatCard icon={Zap} label="XP today" value={stats.xpToday.toString()} color="text-mind" sub={`${stats.currentInLevel}/${stats.neededInLevel} to next`} />
        <Link to="/goals" className="lift group rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <Target className="h-5 w-5 text-body" />
          <div className="flex-1">
            <div className="text-[10px] uppercase text-muted-foreground">Goals</div>
            <div className="text-sm font-bold">Manage cascade</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lift rounded-3xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Today's mood</div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {MOODS.map(({ m, icon: Icon }) => (
              <button
                key={m}
                onClick={() => handleMood(m)}
                className={cn("press flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium",
                  mood === m ? "bg-primary text-primary-foreground border-primary animate-pulse-glow" : "bg-background border-border")}
              >
                <Icon className="h-5 w-5" /> {m}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-xs text-muted-foreground mb-2">This week</div>
            <div className="flex items-end gap-1 h-20">
              {moodHistory.slice(-7).map((d, i) => {
                const h = d.mood === "Excellent" ? 100 : d.mood === "Good" ? 75 : d.mood === "Neutral" ? 45 : 25;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-md bg-gradient-to-t from-primary to-mind transition-all duration-500" style={{ height: `${h}%` }} />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Today's timeline</div>
              <div className="text-lg font-bold">{done}/{tasks.length} complete</div>
            </div>
            <button onClick={() => setLifeHappens(!lifeHappens)} className={cn("press inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border",
              lifeHappens ? "bg-mind text-mind-foreground border-mind animate-pulse-glow" : "border-border")}>
              <Zap className="h-3.5 w-3.5" /> Life Happens {lifeHappens ? "On" : "Off"}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="press flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <button onClick={() => handleToggle(t.id)} className={cn("h-5 w-5 rounded-md border-2 grid place-items-center shrink-0",
                  t.done ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {t.done && <span className="text-[10px]">✓</span>}
                </button>
                <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>{t.text}</span>
                <button onClick={() => removeTask(t.id)} className="text-muted-foreground hover:text-destructive press"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { addTask(newTask.trim()); setNewTask(""); } }}
            className="mt-4 flex gap-2"
          >
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a custom habit…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" /></button>
          </form>
        </div>

        {/* Weekly Review */}
        <div className="lift rounded-3xl border border-border bg-card p-6 lg:col-span-3 animate-[fade-in_0.4s_ease-out]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-faith" />
              <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Weekly Review</div>
            </div>
            {!review ? (
              <button onClick={loadReview} disabled={reviewLoading} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5" /> {reviewLoading ? "Generating…" : "Generate my review"}
              </button>
            ) : (
              <button onClick={acceptSuggestions} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                <Target className="h-3.5 w-3.5" /> Seed weekly goals
              </button>
            )}
          </div>
          {!review && !reviewLoading && <p className="text-sm text-muted-foreground">Generate a personalized recap of your week — wins, patterns, and next steps.</p>}
          {review && (
            <div className="grid md:grid-cols-3 gap-4 mt-2">
              <ReviewList title="Wins" tint="text-primary" items={review.wins} />
              <ReviewList title="Patterns" tint="text-mind" items={review.patterns} />
              <ReviewList title="Next week" tint="text-faith" items={review.suggestions} />
              {review.summary && <p className="md:col-span-3 text-sm italic text-muted-foreground">{review.summary}</p>}
            </div>
          )}
        </div>

        <Link to="/faith" className="lift group rounded-3xl border border-border bg-card p-6 block">
          <div className="text-xs uppercase tracking-wider text-faith">Faith</div>
          <div className="text-2xl font-black mt-1 flex items-center gap-2">Stay rooted. <ArrowRight className="h-5 w-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-faith" /></div>
          <p className="text-sm text-muted-foreground mt-2">Open today's scripture and pray for one person.</p>
        </Link>
        <Link to="/mind" className="lift group rounded-3xl border border-border bg-card p-6 block">
          <div className="text-xs uppercase tracking-wider text-mind">Mind</div>
          <div className="text-2xl font-black mt-1 flex items-center gap-2">Renew your thinking. <ArrowRight className="h-5 w-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-mind" /></div>
          <p className="text-sm text-muted-foreground mt-2">10 minutes of reflection beats 1 hour of scroll.</p>
        </Link>
        <Link to="/body" className="lift group rounded-3xl border border-border bg-card p-6 block">
          <div className="text-xs uppercase tracking-wider text-body">Body</div>
          <div className="text-2xl font-black mt-1 flex items-center gap-2">Honor the temple. <ArrowRight className="h-5 w-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-body" /></div>
          <p className="text-sm text-muted-foreground mt-2">Hydrate, move, sleep — the unsexy basics compound.</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: typeof Flame; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="lift rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <Icon className={cn("h-5 w-5", color)} />
      <div>
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="text-lg font-black">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function ReviewList({ title, items, tint }: { title: string; items: string[]; tint: string }) {
  return (
    <div>
      <div className={cn("text-xs uppercase tracking-wider mb-2", tint)}>{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm bg-background border border-border rounded-lg px-3 py-2">{it}</li>
        ))}
        {items.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}
