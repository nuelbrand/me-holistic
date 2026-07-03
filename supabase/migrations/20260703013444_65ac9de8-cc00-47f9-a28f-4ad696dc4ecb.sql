
-- 1) Restrict tribe_members SELECT to same-tribe members, tribe creator, or admin.
-- Use SECURITY DEFINER helper to avoid recursive RLS on tribe_members itself.
CREATE OR REPLACE FUNCTION public.is_tribe_member(_tribe_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tribe_members
    WHERE tribe_id = _tribe_id AND user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_tribe_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tribe_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS tribe_members_select_all ON public.tribe_members;

CREATE POLICY tribe_members_select_same_tribe
ON public.tribe_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_tribe_member(tribe_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_members.tribe_id AND t.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2) Lock down user_roles: explicitly deny self-insert / self-update / self-delete.
-- Only service_role (bypasses RLS) and the SECURITY DEFINER handle_new_user trigger can write.
CREATE POLICY user_roles_no_self_insert
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY user_roles_no_self_update
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY user_roles_no_self_delete
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- 3) Revoke EXECUTE on SECURITY DEFINER functions that should NOT be callable by end users.
-- Trigger functions do not need direct EXECUTE grants — triggers fire as table owner.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies so authenticated must retain EXECUTE;
-- revoke from anon and public to minimize surface.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
