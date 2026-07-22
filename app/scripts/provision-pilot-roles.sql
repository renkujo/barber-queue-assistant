-- Run with ON_ERROR_STOP from a protected one-off psql process on the private network.
-- Required psql variables: expected_database, app_role, report_password,
-- operator_password, retention_password. Values must be injected; never log them.
\set ON_ERROR_STOP on

SELECT current_database() = :'expected_database' AS database_matches \gset
\if :database_matches
\else
  \warn 'Refusing to provision the unexpected database'
  \quit 3
\endif
SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'app_role') AS app_role_exists \gset
\if :app_role_exists
\else
  \warn 'Application role does not exist'
  \quit 3
\endif
SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_function_owner') AS owner_exists \gset
\if :owner_exists
\else
  \warn 'Run migrations before provisioning pilot roles'
  \quit 3
\endif

DO $block$ BEGIN CREATE ROLE bqa_pilot_reporter LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $block$;
DO $block$ BEGIN CREATE ROLE bqa_pilot_operator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $block$;
DO $block$ BEGIN CREATE ROLE bqa_pilot_retention LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END $block$;

ALTER ROLE bqa_pilot_reporter LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :'report_password';
ALTER ROLE bqa_pilot_operator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :'operator_password';
ALTER ROLE bqa_pilot_retention LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :'retention_password';

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.member WHERE r.rolname IN ('bqa_pilot_reporter','bqa_pilot_operator','bqa_pilot_retention')) THEN
    RAISE EXCEPTION 'Pilot login roles must not inherit membership in any role';
  END IF;
END
$block$;

-- Preserve the explicitly identified application role before removing broad schema access.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE USAGE ON SCHEMA public FROM PUBLIC;
REVOKE CONNECT, TEMPORARY ON DATABASE :"expected_database" FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE :"expected_database" TO :"app_role";
GRANT USAGE ON SCHEMA public TO :"app_role";
GRANT CONNECT ON DATABASE :"expected_database" TO bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
GRANT USAGE ON SCHEMA public TO bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
REVOKE CREATE ON SCHEMA public FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;

GRANT EXECUTE ON FUNCTION public.bqa_pilot_report_v1(date,date,text) TO bqa_pilot_reporter;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_create_cohort_v1(text,date,text,text,boolean) TO bqa_pilot_operator;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_classify_queue_v1(text,public."PilotQueueClassification",text,text,boolean,boolean) TO bqa_pilot_operator;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_manage_hold_v1(text,text,public."EvidenceHoldReason",integer,text,boolean) TO bqa_pilot_operator;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_correct_event_v1(text,public."QueueItemStatus",timestamptz,text,text,boolean) TO bqa_pilot_operator;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) TO bqa_pilot_operator;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_retention_preview_v1(integer) TO bqa_pilot_retention;
GRANT EXECUTE ON FUNCTION public.bqa_pilot_retention_execute_v1(integer) TO bqa_pilot_retention;

ALTER DEFAULT PRIVILEGES FOR ROLE bqa_pilot_function_owner IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM bqa_pilot_reporter, bqa_pilot_operator, bqa_pilot_retention;

SELECT current_database() AS database, current_user AS provisioning_role,
  has_database_privilege('bqa_pilot_reporter', current_database(), 'CONNECT') AS reporter_connect,
  has_schema_privilege('bqa_pilot_reporter', 'public', 'USAGE') AS reporter_usage,
  has_function_privilege('bqa_pilot_reporter', 'public.bqa_pilot_report_v1(date,date,text)', 'EXECUTE') AS reporter_report,
  has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_subject_delete_v1(text,text,boolean)', 'EXECUTE') AS operator_subject,
  has_function_privilege('bqa_pilot_retention', 'public.bqa_pilot_retention_execute_v1(integer)', 'EXECUTE') AS retention_execute;
