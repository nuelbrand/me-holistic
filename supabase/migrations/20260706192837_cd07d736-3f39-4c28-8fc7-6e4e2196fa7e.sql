
-- Defense in depth: constrain amount range
ALTER TABLE public.xp_events ADD CONSTRAINT xp_events_amount_range CHECK (amount >= 0 AND amount <= 100);

-- Remove client-side insert capability
DROP POLICY IF EXISTS xp_events_insert_own ON public.xp_events;
REVOKE INSERT ON public.xp_events FROM anon, authenticated;

-- Server-side XP awarding function
CREATE OR REPLACE FUNCTION public.award_xp(_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_amount int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_amount := CASE _action
    WHEN 'mood_logged' THEN 5
    WHEN 'task_completed' THEN 8
    WHEN 'journal_saved' THEN 15
    WHEN 'devotional_saved' THEN 15
    WHEN 'prayer_added' THEN 10
    WHEN 'prayer_answered' THEN 20
    WHEN 'resource_completed' THEN 25
    WHEN 'goal_completed' THEN 30
    WHEN 'briefing_opened' THEN 2
    WHEN 'post_created' THEN 10
    WHEN 'tribe_joined' THEN 15
    WHEN 'habit_checked' THEN 10
    WHEN 'focus_completed' THEN 20
    WHEN 'verse_added' THEN 8
    WHEN 'verse_reviewed' THEN 12
    WHEN 'verse_mastered' THEN 50
    WHEN 'thought_reframed' THEN 25
    ELSE NULL
  END;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'unknown xp action: %', _action;
  END IF;

  INSERT INTO public.xp_events (user_id, action, amount)
  VALUES (v_uid, _action, v_amount);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(text) TO authenticated;
