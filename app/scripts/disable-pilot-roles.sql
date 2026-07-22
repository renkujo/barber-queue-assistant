-- Emergency-disable all pilot login roles in the exact database.
-- Required psql variable: expected_database.
\set ON_ERROR_STOP on

SELECT current_database() = :'expected_database' AS database_matches \gset
\if :database_matches
\else
  \warn 'Refusing to disable roles in the unexpected database'
  \quit 3
\endif

ALTER ROLE bqa_pilot_reporter NOLOGIN;
ALTER ROLE bqa_pilot_operator NOLOGIN;
ALTER ROLE bqa_pilot_retention NOLOGIN;

REVOKE EXECUTE ON FUNCTION public.bqa_pilot_report_v1(date,date,text) FROM bqa_pilot_reporter;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_create_cohort_v1(text,date,text,text,boolean) FROM bqa_pilot_operator;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_classify_queue_v1(text,public."PilotQueueClassification",text,text,boolean,boolean) FROM bqa_pilot_operator;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_manage_hold_v1(text,text,public."EvidenceHoldReason",integer,text,boolean) FROM bqa_pilot_operator;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_correct_event_v1(text,public."QueueItemStatus",timestamptz,text,text,boolean) FROM bqa_pilot_operator;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) FROM bqa_pilot_operator;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_retention_preview_v1(integer) FROM bqa_pilot_retention;
REVOKE EXECUTE ON FUNCTION public.bqa_pilot_retention_execute_v1(integer) FROM bqa_pilot_retention;

SELECT pg_catalog.pg_terminate_backend(pid)
FROM pg_catalog.pg_stat_activity
WHERE datname = current_database()
  AND usename IN ('bqa_pilot_reporter','bqa_pilot_operator','bqa_pilot_retention')
  AND pid <> pg_catalog.pg_backend_pid();

SELECT current_database() AS database,
  'DISABLED' AS pilot_roles,
  (SELECT NOT rolcanlogin FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_reporter') AS reporter_disabled,
  (SELECT NOT rolcanlogin FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_operator') AS operator_disabled,
  (SELECT NOT rolcanlogin FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_retention') AS retention_disabled;
