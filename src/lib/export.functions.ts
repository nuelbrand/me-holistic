import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = [
  "profiles", "mood_logs", "journal_entries", "devotionals", "resources",
  "goals", "habits", "habit_logs", "focus_sessions", "thought_records",
  "memory_verses", "prayer_requests" as unknown as string, "workouts",
  "workout_exercises", "sleep_logs", "weight_logs", "nutrition_logs",
  "water_logs", "xp_events", "tribe_posts", "coach_messages",
  "challenges", "challenge_progress", "accountability_pairs",
  "direct_messages", "tribe_events",
];

export const exportUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      app: "me.",
      version: 1,
    };
    for (const t of TABLES) {
      try {
        // Try user_id filter first, then sender/created_by for DMs/events
        const q = supabase.from(t as never).select("*");
        const filters = ["user_id", "author_id", "sender_id", "created_by", "id"] as const;
        let data: unknown[] | null = null;
        for (const col of filters) {
          const { data: rows, error } = await (q as any).eq(col, userId);
          if (!error && Array.isArray(rows)) { data = rows; break; }
        }
        out[t] = data ?? [];
      } catch {
        out[t] = [];
      }
    }
    return out;
  });
