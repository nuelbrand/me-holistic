
-- ================= POST REACTIONS =================
CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id UUID NOT NULL REFERENCES public.tribe_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('🙏','❤️','🔥','💪')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_select ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY pr_insert ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY pr_delete ON public.post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ================= POST REPLIES =================
CREATE TABLE IF NOT EXISTS public.post_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.tribe_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.post_replies(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_replies TO authenticated;
GRANT ALL ON public.post_replies TO service_role;
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY prep_select ON public.post_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY prep_insert ON public.post_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY prep_delete ON public.post_replies FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE INDEX IF NOT EXISTS post_replies_post_idx ON public.post_replies(post_id, created_at);

-- ================= CHALLENGES =================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  duration_days INTEGER NOT NULL DEFAULT 30 CHECK (duration_days BETWEEN 1 AND 365),
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY ch_select ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY ch_insert ON public.challenges FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY ch_delete_own ON public.challenges FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.challenge_progress (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id, log_date)
);
GRANT SELECT, INSERT, DELETE ON public.challenge_progress TO authenticated;
GRANT ALL ON public.challenge_progress TO service_role;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_select ON public.challenge_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY cp_insert_own ON public.challenge_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY cp_delete_own ON public.challenge_progress FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ================= ACCOUNTABILITY PAIRS =================
CREATE TABLE IF NOT EXISTS public.accountability_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','ended','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> partner_id),
  UNIQUE (requester_id, partner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_pairs TO authenticated;
GRANT ALL ON public.accountability_pairs TO service_role;
ALTER TABLE public.accountability_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ap_select_mine ON public.accountability_pairs
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR partner_id = auth.uid());
CREATE POLICY ap_insert_mine ON public.accountability_pairs
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY ap_update_participant ON public.accountability_pairs
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR partner_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR partner_id = auth.uid());
CREATE POLICY ap_delete_participant ON public.accountability_pairs
  FOR DELETE TO authenticated USING (requester_id = auth.uid() OR partner_id = auth.uid());
CREATE TRIGGER accountability_pairs_touch BEFORE UPDATE ON public.accountability_pairs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ================= COACH MESSAGES =================
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 20000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_select_own ON public.coach_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY cm_insert_own ON public.coach_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY cm_delete_own ON public.coach_messages FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS coach_messages_user_time_idx ON public.coach_messages(user_id, created_at);
