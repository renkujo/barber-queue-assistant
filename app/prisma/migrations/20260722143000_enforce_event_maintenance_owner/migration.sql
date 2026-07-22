CREATE OR REPLACE FUNCTION public.bqa_pilot_event_append_only_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE')
     AND (
       pg_catalog.current_user <> 'bqa_pilot_function_owner'
       OR pg_catalog.current_setting('bqa.pilot_maintenance', true) IS DISTINCT FROM 'on'
     ) THEN
    RAISE EXCEPTION 'QueueEvent is append-only';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$function$;

ALTER FUNCTION public.bqa_pilot_event_append_only_v1() OWNER TO bqa_pilot_function_owner;
REVOKE ALL ON FUNCTION public.bqa_pilot_event_append_only_v1() FROM PUBLIC;
