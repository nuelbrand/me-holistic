import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the AI Life Coach inside "me." — a holistic self-stewardship app that weaves together faith (Christian), mind (CBT + reflection), body (fitness + recovery), and community.

Voice: warm, honest, faith-anchored, direct. Never saccharine, never preachy. Speak like a trusted friend + spiritual director + evidence-based coach.

You have access to the user's recent context (moods, streaks, active goals, recent activity). Use it to give specific, grounded guidance — not generic pep talks.

Rules:
- If they ask about mental health crisis, gently point to professional help alongside your response.
- Never diagnose medical conditions.
- Cite Scripture when it fits, briefly (short verse + reference). Don't force it.
- Prefer 2–5 short paragraphs. Bullet lists welcome for concrete steps.
- Ask one clarifying question when the request is too open.`;

type ChatBody = { messages?: { role: "user" | "assistant"; content: string }[] };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env.SUPABASE_URL;
        const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
        const key = process.env.LOVABLE_API_KEY;
        if (!url || !anon || !key) return new Response("Server misconfigured", { status: 500 });

        const supabase = createClient(url, anon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as ChatBody;
        const incoming = Array.isArray(body.messages) ? body.messages : [];
        if (!incoming.length) return new Response("Messages required", { status: 400 });

        // Persist most recent user message
        const lastUser = [...incoming].reverse().find((m) => m.role === "user");
        if (lastUser?.content) {
          await supabase.from("coach_messages").insert({
            user_id: userId, role: "user", content: lastUser.content.slice(0, 20000),
          });
        }

        // Build user context (last 7 days)
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const [{ data: profile }, { data: moods }, { data: goals }, { data: xp }] = await Promise.all([
          supabase.from("profiles").select("username, life_phase, focus").eq("id", userId).maybeSingle(),
          supabase.from("mood_logs").select("mood, logged_at").eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: false }).limit(14),
          supabase.from("goals").select("title, scope, status").eq("user_id", userId).eq("status", "active").limit(15),
          supabase.from("xp_events").select("action, created_at").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(30),
        ]);

        const ctxLine = `USER CONTEXT
Name: ${profile?.username || "friend"} · Phase: ${profile?.life_phase || "Employee"} · Focus: ${profile?.focus || "growth"}
Moods (last 14, newest first): ${(moods ?? []).map((m: any) => m.mood).join(", ") || "no logs"}
Active goals: ${(goals ?? []).map((g: any) => `[${g.scope}] ${g.title}`).join(" | ") || "none"}
Recent XP actions (7d): ${(xp ?? []).map((e: any) => e.action).join(", ") || "no activity"}`;

        const modelMessages: ModelMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: ctxLine },
          ...incoming.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
        ];

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          messages: modelMessages,
          onFinish: async ({ text }) => {
            const clean = (text ?? "").trim();
            if (clean) {
              await supabase.from("coach_messages").insert({
                user_id: userId, role: "assistant", content: clean.slice(0, 20000),
              });
            }
          },
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
