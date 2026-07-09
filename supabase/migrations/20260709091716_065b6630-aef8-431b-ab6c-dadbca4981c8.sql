
-- Direct messages (1:1)
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DMs: participants read" ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "DMs: sender writes" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "DMs: recipient marks read" ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "DMs: sender deletes own" ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);
CREATE INDEX idx_dm_pair ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_dm_recipient ON public.direct_messages (recipient_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Tribe events
CREATE TABLE public.tribe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id uuid NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_events TO authenticated;
GRANT ALL ON public.tribe_events TO service_role;
ALTER TABLE public.tribe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events: tribe members read" ON public.tribe_events FOR SELECT TO authenticated
  USING (public.is_tribe_member(tribe_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND t.creator_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Events: tribe members create" ON public.tribe_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_tribe_member(tribe_id, auth.uid()));
CREATE POLICY "Events: creator updates" ON public.tribe_events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Events: creator or admin deletes" ON public.tribe_events FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_tribe_events_touch BEFORE UPDATE ON public.tribe_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Web push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Push: user manages own" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin analytics helper (SECURITY DEFINER, admin-only)
CREATE OR REPLACE FUNCTION public.admin_stats(_days int DEFAULT 30)
RETURNS TABLE (
  total_users bigint,
  dau bigint,
  wau bigint,
  mau bigint,
  posts_last bigint,
  moods_last bigint,
  journals_last bigint,
  xp_last bigint,
  by_action jsonb,
  daily_active jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  since timestamptz := now() - make_interval(days => _days);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(DISTINCT user_id) INTO dau FROM public.xp_events WHERE created_at >= now() - interval '1 day';
  SELECT COUNT(DISTINCT user_id) INTO wau FROM public.xp_events WHERE created_at >= now() - interval '7 days';
  SELECT COUNT(DISTINCT user_id) INTO mau FROM public.xp_events WHERE created_at >= now() - interval '30 days';
  SELECT COUNT(*) INTO posts_last FROM public.tribe_posts WHERE created_at >= since;
  SELECT COUNT(*) INTO moods_last FROM public.mood_logs WHERE logged_at >= since;
  SELECT COUNT(*) INTO journals_last FROM public.journal_entries WHERE created_at >= since;
  SELECT COALESCE(SUM(amount),0) INTO xp_last FROM public.xp_events WHERE created_at >= since;
  SELECT COALESCE(jsonb_object_agg(action, c), '{}'::jsonb) INTO by_action
    FROM (SELECT action, COUNT(*) c FROM public.xp_events WHERE created_at >= since GROUP BY action ORDER BY c DESC LIMIT 20) s;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d, 'users', u) ORDER BY d), '[]'::jsonb) INTO daily_active
    FROM (SELECT created_at::date d, COUNT(DISTINCT user_id) u FROM public.xp_events WHERE created_at >= since GROUP BY 1) s;
  RETURN NEXT;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_stats(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats(int) TO authenticated;
