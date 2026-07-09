
DROP POLICY IF EXISTS pr_select ON public.post_reactions;
CREATE POLICY pr_select ON public.post_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_posts tp
      WHERE tp.id = post_reactions.post_id
        AND (
          public.is_tribe_member(tp.tribe_id, auth.uid())
          OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tp.tribe_id AND t.creator_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS prep_select ON public.post_replies;
CREATE POLICY prep_select ON public.post_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_posts tp
      WHERE tp.id = post_replies.post_id
        AND (
          public.is_tribe_member(tp.tribe_id, auth.uid())
          OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tp.tribe_id AND t.creator_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS tpl_select_all ON public.tribe_post_likes;
CREATE POLICY tpl_select_all ON public.tribe_post_likes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tribe_posts tp
      WHERE tp.id = tribe_post_likes.post_id
        AND (
          public.is_tribe_member(tp.tribe_id, auth.uid())
          OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tp.tribe_id AND t.creator_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS cp_select ON public.challenge_progress;
CREATE POLICY cp_select ON public.challenge_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_progress.challenge_id
        AND (
          public.is_tribe_member(c.tribe_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
