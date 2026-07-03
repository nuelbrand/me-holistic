import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function weekStart() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}
function safeJson<T = unknown>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return fallback;
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
}

// ============ DAILY BRIEFING ============
export const getDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ regenerate: z.boolean().optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const dateStr = today();

    if (!data.regenerate) {
      const { data: existing } = await supabase
        .from("daily_briefings")
        .select("*")
        .eq("user_id", userId)
        .eq("briefing_date", dateStr)
        .maybeSingle();
      if (existing) return existing;
    }

    const [{ data: profile }, { data: moods }, { data: goals }, { data: tasksXp }] = await Promise.all([
      supabase.from("profiles").select("username, life_phase, focus").eq("id", userId).maybeSingle(),
      supabase.from("mood_logs").select("mood, logged_at").eq("user_id", userId).order("logged_at", { ascending: false }).limit(7),
      supabase.from("goals").select("title, scope").eq("user_id", userId).eq("status", "active").limit(10),
      supabase.from("xp_events").select("action, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const context_str = `
User: ${profile?.username || "friend"} · phase: ${profile?.life_phase || "Employee"} · focus: ${profile?.focus || "growth"}
Recent moods (newest first): ${(moods ?? []).map((m: any) => m.mood).join(", ") || "no logs yet"}
Active goals: ${(goals ?? []).map((g: any) => `[${g.scope}] ${g.title}`).join(" | ") || "none set"}
Recent activity (last 20 XP events): ${(tasksXp ?? []).map((t: any) => t.action).join(", ") || "no activity yet"}
`.trim();

    const { text } = await generateText({
      model: gateway(MODEL),
      messages: [
        {
          role: "system",
          content: `You are the AI companion inside "me." — a holistic self-stewardship app grounded in Christian faith. Respond ONLY with strict JSON matching:
{"greeting": "warm 1-sentence greeting using their name", "verse_text": "a real short Bible verse (KJV or similar public domain)", "verse_ref": "book chapter:verse", "mood_summary": "1 sentence acknowledging their recent emotional trend", "focus_points": ["exactly 3 short, concrete focus actions for today (max 8 words each)"]}
No markdown, no prose outside JSON. Be encouraging, faith-anchored, specific to their phase.`,
        },
        { role: "user", content: context_str },
      ],
    });

    const parsed = safeJson<{
      greeting: string;
      verse_text: string;
      verse_ref: string;
      mood_summary: string;
      focus_points: string[];
    }>(text, {
      greeting: `Good morning, ${profile?.username || "friend"}.`,
      verse_text: "Be still, and know that I am God.",
      verse_ref: "Psalm 46:10",
      mood_summary: "A fresh day to begin again.",
      focus_points: ["Pray for 5 minutes", "Drink water", "One deep-work block"],
    });

    const { data: saved } = await supabase
      .from("daily_briefings")
      .upsert(
        {
          user_id: userId,
          briefing_date: dateStr,
          greeting: parsed.greeting,
          verse_text: parsed.verse_text,
          verse_ref: parsed.verse_ref,
          mood_summary: parsed.mood_summary,
          focus_points: parsed.focus_points,
        },
        { onConflict: "user_id,briefing_date" }
      )
      .select()
      .single();
    return saved;
  });

// ============ WEEKLY REVIEW ============
export const getWeeklyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ regenerate: z.boolean().optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ws = weekStart();

    if (!data.regenerate) {
      const { data: existing } = await supabase
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", ws)
        .maybeSingle();
      if (existing) return existing;
    }

    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [{ data: moods }, { data: xp }, { data: journal }, { data: goals }] = await Promise.all([
      supabase.from("mood_logs").select("mood, logged_at").eq("user_id", userId).gte("logged_at", since),
      supabase.from("xp_events").select("action, amount, created_at").eq("user_id", userId).gte("created_at", since),
      supabase.from("journal_entries").select("content, created_at").eq("user_id", userId).gte("created_at", since).limit(10),
      supabase.from("goals").select("title, scope, status").eq("user_id", userId),
    ]);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const totalXp = (xp ?? []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const activityCount = (xp ?? []).length;
    const moodList = (moods ?? []).map((m: any) => m.mood).join(", ");
    const journalSnips = (journal ?? []).map((j: any) => `- ${(j.content || "").slice(0, 120)}`).join("\n");
    const goalList = (goals ?? []).map((g: any) => `[${g.scope}/${g.status}] ${g.title}`).join(" | ");

    const { text } = await generateText({
      model: gateway(MODEL),
      messages: [
        {
          role: "system",
          content: `You are a compassionate life-coach reviewing a user's week inside "me." Respond ONLY with strict JSON:
{"wins": ["3-5 short wins from this week"], "patterns": ["2-4 short observed patterns (emotional, behavioral)"], "suggestions": ["3-5 short concrete focus points for next week"], "summary": "1-2 sentence warm summary"}
Be specific, faith-informed, kind but honest. Max ~12 words per bullet.`,
        },
        {
          role: "user",
          content: `This week's data:
- Total XP earned: ${totalXp} across ${activityCount} actions
- Moods logged: ${moodList || "none"}
- Goals: ${goalList || "none"}
- Journal snippets:
${journalSnips || "(no journal entries)"}`,
        },
      ],
    });

    const parsed = safeJson<{ wins: string[]; patterns: string[]; suggestions: string[]; summary: string }>(text, {
      wins: activityCount > 0 ? [`Logged ${activityCount} actions`, `Earned ${totalXp} XP`] : ["A fresh week ahead"],
      patterns: ["Consistency is building"],
      suggestions: ["Log mood daily", "One deep prayer session", "Move your body 3× this week"],
      summary: "Keep showing up — small consistent steps compound.",
    });

    const { data: saved } = await supabase
      .from("weekly_reviews")
      .upsert(
        {
          user_id: userId,
          week_start: ws,
          wins: parsed.wins,
          patterns: parsed.patterns,
          suggestions: parsed.suggestions,
          summary: parsed.summary,
        },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single();
    return saved;
  });

// ============ SEED GOALS from suggestions ============
export const seedGoalsFromSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ titles: z.array(z.string().min(1)).min(1).max(10) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.titles.map((title, i) => ({
      user_id: userId,
      title,
      scope: "weekly" as const,
      status: "active" as const,
      order_index: i,
    }));
    const { data: inserted } = await supabase.from("goals").insert(rows).select();
    return inserted ?? [];
  });
