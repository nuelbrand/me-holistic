
DROP POLICY IF EXISTS tribes_select_all ON public.tribes;
CREATE POLICY tribes_select_members
ON public.tribes
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR public.is_tribe_member(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS posts_select_all ON public.tribe_posts;
CREATE POLICY posts_select_members
ON public.tribe_posts
FOR SELECT
TO authenticated
USING (
  public.is_tribe_member(tribe_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_posts.tribe_id AND t.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
