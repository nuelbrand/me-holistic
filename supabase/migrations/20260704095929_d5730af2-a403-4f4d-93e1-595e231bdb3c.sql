
-- HABITS
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'primary',
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  cadence TEXT NOT NULL DEFAULT 'daily',
  archived BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- HABIT LOGS
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX habit_logs_habit_date_idx ON public.habit_logs(habit_id, log_date DESC);

-- FOCUS SESSIONS
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Focus',
  planned_min INTEGER NOT NULL DEFAULT 25,
  actual_min INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
GRANT ALL ON public.focus_sessions TO service_role;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MEMORY VERSES (SM-2)
CREATE TABLE public.memory_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  translation TEXT DEFAULT 'kjv',
  ease NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  review_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_verses TO authenticated;
GRANT ALL ON public.memory_verses TO service_role;
ALTER TABLE public.memory_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory verses" ON public.memory_verses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER memory_verses_updated BEFORE UPDATE ON public.memory_verses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX memory_verses_next_idx ON public.memory_verses(user_id, next_review);

-- THOUGHT RECORDS (CBT)
CREATE TABLE public.thought_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situation TEXT NOT NULL,
  automatic_thought TEXT NOT NULL,
  emotions TEXT[] NOT NULL DEFAULT '{}',
  intensity_before INTEGER NOT NULL DEFAULT 5,
  evidence_for TEXT,
  evidence_against TEXT,
  balanced_thought TEXT,
  intensity_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thought_records TO authenticated;
GRANT ALL ON public.thought_records TO service_role;
ALTER TABLE public.thought_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own thought records" ON public.thought_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend devotionals with public flag for the (future) community prayer wall
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
