
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_stats(int) FROM PUBLIC, anon, authenticated;
-- service_role retains EXECUTE (default for owner). Admin UI will call this via a privileged server function.
