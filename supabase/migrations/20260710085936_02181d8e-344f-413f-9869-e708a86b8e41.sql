-- 1. Restrict challenges SELECT to tribe members / creator / admin
DROP POLICY IF EXISTS ch_select ON public.challenges;
CREATE POLICY ch_select ON public.challenges FOR SELECT TO authenticated
USING (
  public.is_tribe_member(tribe_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = challenges.tribe_id AND t.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 2. Lock down SECURITY DEFINER functions: revoke default PUBLIC EXECUTE,
--    then grant EXECUTE only where the app requires it.
REVOKE EXECUTE ON FUNCTION public.award_xp(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_stats(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tribe_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- award_xp is the sole guarded XP write path for signed-in users
GRANT EXECUTE ON FUNCTION public.award_xp(text) TO authenticated;
-- has_role and is_tribe_member are invoked by RLS policies executed as the
-- calling user, so authenticated must retain EXECUTE.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tribe_member(uuid, uuid) TO authenticated;