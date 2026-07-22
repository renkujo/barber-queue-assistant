-- Rebuild pilot function ownership/privileges after a portable --no-owner --no-acl restore.
-- Required psql variables: expected_database, app_role.
\set ON_ERROR_STOP on

SELECT current_database() = :'expected_database' AS database_matches \gset
\if :database_matches
\else
  \warn 'Refusing to reconcile the unexpected database'
  \quit 3
\endif

SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'app_role') AS app_role_exists \gset
\if :app_role_exists
\else
  \warn 'Application role does not exist'
  \quit 3
\endif

DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_function_owner') THEN
    CREATE ROLE bqa_pilot_function_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$block$;

ALTER ROLE bqa_pilot_function_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO bqa_pilot_function_owner;
GRANT USAGE ON SCHEMA public TO :"app_role";

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public."PilotCohort",
  public."PilotClassificationAudit",
  public."QueueItem",
  public."Customer",
  public."QueueMutationOperation",
  public."QueueEvent",
  public."EvidenceHold",
  public."NotificationLog",
  public."RateLimitBucket"
TO bqa_pilot_function_owner;
GRANT SELECT ON public."ShopSettings" TO bqa_pilot_function_owner;

ALTER FUNCTION public.prevent_pilot_cohort_expiry_change() OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_event_append_only_v1() OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_validate_correction_v1() OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_create_cohort_v1(text,date,text,text,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_classify_queue_v1(text,public."PilotQueueClassification",text,text,boolean,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_manage_hold_v1(text,text,public."EvidenceHoldReason",integer,text,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_correct_event_v1(text,public."QueueItemStatus",timestamptz,text,text,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_retention_preview_v1(integer) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_retention_execute_v1(integer) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_report_v1(date,date,text) OWNER TO bqa_pilot_function_owner;

REVOKE ALL ON FUNCTION public.prevent_pilot_cohort_expiry_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_event_append_only_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_validate_correction_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_create_cohort_v1(text,date,text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_classify_queue_v1(text,public."PilotQueueClassification",text,text,boolean,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_manage_hold_v1(text,text,public."EvidenceHoldReason",integer,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_correct_event_v1(text,public."QueueItemStatus",timestamptz,text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_retention_preview_v1(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_retention_execute_v1(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_report_v1(date,date,text) FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE bqa_pilot_function_owner IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

DO $block$
DECLARE invalid_owner_count integer;
BEGIN
  SELECT count(*) INTO invalid_owner_count
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'prevent_pilot_cohort_expiry_change',
      'bqa_pilot_event_append_only_v1',
      'bqa_pilot_validate_correction_v1',
      'bqa_pilot_create_cohort_v1',
      'bqa_pilot_classify_queue_v1',
      'bqa_pilot_manage_hold_v1',
      'bqa_pilot_correct_event_v1',
      'bqa_pilot_subject_delete_v1',
      'bqa_pilot_retention_preview_v1',
      'bqa_pilot_retention_execute_v1',
      'bqa_pilot_report_v1'
    )
    AND r.rolname <> 'bqa_pilot_function_owner';

  IF invalid_owner_count <> 0 THEN
    RAISE EXCEPTION 'Pilot function-owner reconciliation failed';
  END IF;
END
$block$;

SELECT current_database() AS database,
  current_user AS reconciliation_role,
  'bqa_pilot_function_owner' AS restored_function_owner,
  has_schema_privilege('bqa_pilot_function_owner', 'public', 'USAGE') AS owner_schema_usage,
  has_function_privilege('bqa_pilot_function_owner', 'public.bqa_pilot_retention_execute_v1(integer)', 'EXECUTE') AS owner_retention_execute;
