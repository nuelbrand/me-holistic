
# me. — World-Class Productivity Roadmap

Since you picked all four clusters, I've sequenced them into **4 shippable phases**. Each phase is self-contained, testable, and ships real user value before the next begins. We build on the existing structure (Dashboard, Faith, Mind, Body, Community, Resources, Admin) — no rewrites.

---

## Phase 1 — Engagement Core (the "come back every day" layer)

**Goal:** make opening the app feel indispensable.

- **AI Daily Briefing** on Dashboard: greets by name, shows verse of the day, mood trend arrow, top 3 focus tasks, weather-of-your-week summary. Regenerates each morning; cached per user per day.
- **Streaks & XP system**: every meaningful action (journal, devotional, mood log, workout, prayer, resource complete) awards XP. Streak counters per module + one global streak. Freeze-day allowance so a single miss doesn't kill motivation.
- **Cascading Goals**: Yearly → Quarterly → Weekly → Daily. Daily tasks roll up into weekly progress bars; weekly rolls into quarterly, etc. Lives in a new `/goals` route accessible from Dashboard.
- **AI Weekly Review** (Sundays): recaps wins, patterns, mood-vs-habit correlations, suggests next week's focus. One-tap "accept suggestions" seeds next week's goals.
- **Level & badge display** in the top nav avatar.

**New tables:** `xp_events`, `streaks`, `goals` (with parent_id for hierarchy), `daily_briefings`, `weekly_reviews`.
**New backend:** `createServerFn` calls to Lovable AI Gateway (Gemini) for briefing & review generation.

---

## Phase 2 — Faith + Mind Depth (the "why me. is different" layer)

**Faith**
- **Bible Reading Plans**: 365-day, chronological, topical (Anxiety, Purpose, Leadership). Progress persists; today's reading shown on Faith page.
- **Verse Memorization** with spaced-repetition (SM-2 algorithm) flashcards.
- **Prayer Journal**: log requests, mark answered with date & story. "Answered prayers" wall for personal encouragement.
- **AI Prayer Companion**: guided prayer sessions (ACTS model), voice-optional.

**Mind**
- **CBT Thought Records**: structured journal template (situation → automatic thought → distortion → reframe → new feeling).
- **Guided Meditations & Breathwork**: timer + audio (Lovable AI text-to-speech for scripts).
- **AI Journal Companion**: after each entry, surfaces recurring themes, emotional patterns, gentle questions.
- **Habit Builder**: create custom habits, streak recovery, weekly consistency chart.
- **Focus Timer**: Pomodoro (25/5) with session log feeding XP.

**New tables:** `reading_plans`, `reading_progress`, `verses_memorization`, `prayer_requests`, `habits`, `habit_logs`, `thought_records`, `focus_sessions`.

---

## Phase 3 — Body + Integrations (the "whole self" layer)

- **Health logging**: water, sleep hours, steps (manual + optional Apple Health / Google Fit via Health Connect bridge — PWA-based, disclosed as beta).
- **Meal Planner + Macro Tracker**: log meals; AI-generated recipes respecting diet preferences and budget; weekly meal plan generator.
- **Workout Library**: pre-seeded workouts (Push/Pull/Legs, HIIT, mobility, walking), custom builder, video embeds, PR tracking, progress charts.
- **Body Trends**: weight, measurements, energy scores → line charts.
- **Finance Hub inside Resources**: budget, net worth, savings goals, tithing tracker (manual entry — no bank connections in v1).
- **Reminders**: supplement/medication with local notifications (via PWA).

**New tables:** `health_logs` (water/sleep/steps), `meals`, `workouts`, `workout_logs`, `body_measurements`, `finance_accounts`, `finance_transactions`, `finance_goals`.

---

## Phase 4 — Community + Platform Superpowers (the "sticky social" layer)

**Community**
- **Accountability Partners**: 1:1 pairings, shared weekly check-in prompt, view each other's public streaks.
- **Group Challenges**: 30-day challenges (Bible-in-a-month, no-sugar, 10k-steps). Auto leaderboards inside a tribe.
- **Rich posts**: threaded replies, reactions (🙏 ❤️ 🔥 💪), @mentions.
- **DMs** (1:1) with Realtime Postgres channels.
- **Events calendar** per tribe.

**Platform**
- **AI Life Coach chat** (`/coach`): context-aware across mood, streaks, goals, journal — a persistent conversation using Lovable AI Gateway (streamed responses). Follows the tanstack-ai-chat pattern.
- **PWA + push notifications**: installable app, morning briefing push, streak-at-risk push.
- **Data export**: JSON + PDF weekly report.
- **Themes**: dark/light/sepia + font-size scale.
- **Voice input** everywhere (browser SpeechRecognition).
- **Subscription tiers scaffolding** (Free/Pro) — Stripe hooks stubbed, not enforced until you're ready to monetize.

**Admin additions** delivered alongside:
- **Content Scheduler** (verses/prompts/devotionals by date).
- **Analytics** (DAU, module engagement, streak retention).
- **In-app announcements**.

**New tables:** `accountability_pairs`, `challenges`, `challenge_participants`, `post_reactions`, `post_replies`, `direct_messages`, `events`, `coach_conversations`, `coach_messages`, `notifications`, `announcements`, `subscriptions`.

---

## Technical Approach (details)

- **Backend:** Supabase (Lovable Cloud) for all data; RLS on every table scoped to `auth.uid()`; SECURITY DEFINER helpers for cross-table membership checks (pattern already established).
- **AI:** Lovable AI Gateway via `createServerFn` for one-shot generations (briefing, review, journal insights) and a streaming `/api/chat` route for the AI Coach (Phase 4). Default model `google/gemini-3-flash-preview`.
- **Scheduling:** `pg_cron` + `pg_net` calling `/api/public/hooks/*` routes for daily briefing generation, streak rollovers, weekly reviews, challenge day-tick.
- **Realtime:** Supabase Realtime for DMs, tribe posts, live challenge leaderboards.
- **Styling:** reuse the current design system — `bg-card`, `border-border`, `press`, `lift` classes; no visual redesign.
- **Routing:** each feature gets its own file-based route under existing `_shell.*` layout (e.g. `_shell.goals.tsx`, `_shell.coach.tsx`, `_shell.challenges.tsx`).

---

## Suggested Delivery Cadence

Each phase = one focused build session. I recommend approving them one at a time so you can test and give feedback between phases rather than shipping everything blind.

**Next step after you approve this roadmap:** I start Phase 1 (Engagement Core). Say the word and I'll switch to build mode.
