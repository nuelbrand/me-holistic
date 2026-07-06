
-- ============ WORKOUTS ============
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL DEFAULT 'strength', -- strength|cardio|yoga|walk|run|ride|swim|hiit|mobility|sport|other
  title TEXT,
  duration_min INT NOT NULL DEFAULT 0,
  intensity SMALLINT NOT NULL DEFAULT 3 CHECK (intensity BETWEEN 1 AND 5),
  calories INT,
  distance_km NUMERIC(6,2),
  mood_after SMALLINT CHECK (mood_after BETWEEN 1 AND 5),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual', -- manual|strava|apple_health|google_fit|csv
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY workouts_own ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER workouts_touch BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX workouts_user_date_idx ON public.workouts (user_id, performed_at DESC);

-- ============ WORKOUT EXERCISES (structured sets/reps) ============
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{reps:8, weight_kg:60, rpe:8}]
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY wex_own ON public.workout_exercises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX wex_workout_idx ON public.workout_exercises (workout_id, order_index);

-- ============ SLEEP ============
CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(4,2) NOT NULL,
  quality SMALLINT CHECK (quality BETWEEN 1 AND 5),
  bedtime TIME,
  wake_time TIME,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sleep_own ON public.sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sleep_user_date_idx ON public.sleep_logs (user_id, log_date DESC);

-- ============ WEIGHT ============
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  body_fat_pct NUMERIC(4,1),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY weight_own ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NUTRITION ============
CREATE TABLE public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal TEXT NOT NULL, -- breakfast|lunch|dinner|snack
  description TEXT NOT NULL,
  calories INT,
  protein_g INT,
  carbs_g INT,
  fat_g INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT ALL ON public.nutrition_logs TO service_role;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY nutri_own ON public.nutrition_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX nutri_user_date_idx ON public.nutrition_logs (user_id, log_date DESC);

-- ============ WATER (daily) ============
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses INT NOT NULL DEFAULT 0,
  goal INT NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY water_own ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER water_touch BEFORE UPDATE ON public.water_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ XP: add body actions to award_xp() ============
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
    WHEN 'workout_logged' THEN 20
    WHEN 'sleep_logged' THEN 8
    WHEN 'weight_logged' THEN 5
    WHEN 'nutrition_logged' THEN 5
    WHEN 'water_goal_hit' THEN 10
    WHEN 'data_imported' THEN 15
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
