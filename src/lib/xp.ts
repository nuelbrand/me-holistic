import { supabase } from "@/integrations/supabase/client";

export type XpAction =
  | "mood_logged"
  | "task_completed"
  | "journal_saved"
  | "devotional_saved"
  | "prayer_added"
  | "prayer_answered"
  | "resource_completed"
  | "goal_completed"
  | "briefing_opened"
  | "post_created"
  | "tribe_joined"
  | "habit_checked"
  | "focus_completed"
  | "verse_added"
  | "verse_reviewed"
  | "verse_mastered"
  | "thought_reframed";

const AMOUNTS: Record<XpAction, number> = {
  mood_logged: 5,
  task_completed: 8,
  journal_saved: 15,
  devotional_saved: 15,
  prayer_added: 10,
  prayer_answered: 20,
  resource_completed: 25,
  goal_completed: 30,
  briefing_opened: 2,
  post_created: 10,
  tribe_joined: 15,
  habit_checked: 10,
  focus_completed: 20,
  verse_added: 8,
  verse_reviewed: 12,
  verse_mastered: 50,
  thought_reframed: 25,
};

export async function awardXp(userId: string | undefined | null, action: XpAction) {
  if (!userId) return;
  try {
    await supabase.from("xp_events").insert({ user_id: userId, action, amount: AMOUNTS[action] });
  } catch {
    // silent — XP is a bonus, never block user action
  }
}

export function levelFromXp(total: number) {
  return Math.max(1, Math.floor(Math.sqrt(total / 50)) + 1);
}
export function xpForLevel(level: number) {
  return Math.pow(level - 1, 2) * 50;
}
export function xpToNext(total: number) {
  const lvl = levelFromXp(total);
  const next = xpForLevel(lvl + 1);
  return { current: total - xpForLevel(lvl), needed: next - xpForLevel(lvl), pct: Math.min(100, ((total - xpForLevel(lvl)) / (next - xpForLevel(lvl))) * 100) };
}
