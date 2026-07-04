CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id uuid)
 RETURNS TABLE(total_xp integer, level integer, current_streak integer, longest_streak integer, xp_today integer)
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
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
$function$;