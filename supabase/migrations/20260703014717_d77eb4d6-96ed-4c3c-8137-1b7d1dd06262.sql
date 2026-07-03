
-- ============ XP EVENTS ============
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  amount integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX xp_events_user_created_idx ON public.xp_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY xp_events_select_own ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY xp_events_insert_own ON public.xp_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ GOALS (cascading) ============
CREATE TYPE public.goal_scope AS ENUM ('yearly','quarterly','weekly','daily');
CREATE TYPE public.goal_status AS ENUM ('active','done','archived');

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  scope public.goal_scope NOT NULL,
  status public.goal_status NOT NULL DEFAULT 'active',
  target_date date,
  completed_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_user_scope_idx ON public.goals(user_id, scope, status);
CREATE INDEX goals_parent_idx ON public.goals(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_all_own ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_touch_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ DAILY BRIEFINGS ============
CREATE TABLE public.daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  greeting text NOT NULL,
  verse_text text,
  verse_ref text,
  mood_summary text,
  focus_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, briefing_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_briefings TO authenticated;
GRANT ALL ON public.daily_briefings TO service_role;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_briefings_all_own ON public.daily_briefings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ WEEKLY REVIEWS ============
CREATE TABLE public.weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  wins jsonb NOT NULL DEFAULT '[]'::jsonb,
  patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_reviews TO authenticated;
GRANT ALL ON public.weekly_reviews TO service_role;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY weekly_reviews_all_own ON public.weekly_reviews FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ STATS FUNCTION ============
CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id uuid)
RETURNS TABLE(total_xp integer, level integer, current_streak integer, longest_streak integer, xp_today integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_today integer;
  v_current integer := 0;
  v_longest integer := 0;
  v_run integer := 0;
  v_prev date;
  r record;
BEGIN
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    _user_id := auth.uid();
  END IF;

  SELECT COALESCE(SUM(amount),0) INTO v_total FROM public.xp_events WHERE user_id = _user_id;
  SELECT COALESCE(SUM(amount),0) INTO v_today FROM public.xp_events
    WHERE user_id = _user_id AND created_at::date = CURRENT_DATE;

  FOR r IN
    SELECT DISTINCT created_at::date AS d FROM public.xp_events
    WHERE user_id = _user_id ORDER BY d DESC
  LOOP
    IF v_prev IS NULL THEN
      IF r.d = CURRENT_DATE OR r.d = CURRENT_DATE - 1 THEN v_run := 1; v_current := 1; ELSE EXIT; END IF;
    ELSE
      IF v_prev - r.d = 1 THEN v_run := v_run + 1; v_current := v_run; ELSE EXIT; END IF;
    END IF;
    IF v_run > v_longest THEN v_longest := v_run; END IF;
    v_prev := r.d;
  END LOOP;

  -- longest across all history
  v_prev := NULL; v_run := 0;
  FOR r IN
    SELECT DISTINCT created_at::date AS d FROM public.xp_events
    WHERE user_id = _user_id ORDER BY d ASC
  LOOP
    IF v_prev IS NULL OR r.d - v_prev = 1 THEN v_run := v_run + 1;
    ELSE v_run := 1; END IF;
    IF v_run > v_longest THEN v_longest := v_run; END IF;
    v_prev := r.d;
  END LOOP;

  total_xp := v_total;
  level := GREATEST(1, FLOOR(SQRT(v_total::float / 50))::integer + 1);
  current_streak := v_current;
  longest_streak := v_longest;
  xp_today := v_today;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;
