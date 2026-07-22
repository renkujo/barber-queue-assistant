-- Verify bounded pilot-role grants after provisioning or rotation.
-- Required psql variables: expected_database, app_role.
\set ON_ERROR_STOP on

SELECT current_database() = :'expected_database' AS database_matches \gset
\if :database_matches
\else
  \warn 'Refusing to verify the unexpected database'
  \quit 3
\endif

SELECT pg_catalog.set_config('bqa.verify_app_role', :'app_role', false) \gset

DO $block$
DECLARE role_name text;
DECLARE role_row pg_catalog.pg_roles%ROWTYPE;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['bqa_pilot_reporter','bqa_pilot_operator','bqa_pilot_retention'] LOOP
    SELECT * INTO role_row FROM pg_catalog.pg_roles WHERE rolname = role_name;
    IF NOT FOUND OR NOT role_row.rolcanlogin OR role_row.rolsuper OR role_row.rolcreatedb
       OR role_row.rolcreaterole OR role_row.rolreplication OR role_row.rolbypassrls THEN
      RAISE EXCEPTION 'Pilot role attributes are invalid for %', role_name;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid = m.member
      WHERE r.rolname = role_name
    ) THEN
      RAISE EXCEPTION 'Pilot role % must not inherit another role', role_name;
    END IF;
    IF pg_catalog.has_schema_privilege(role_name, 'public', 'CREATE') THEN
      RAISE EXCEPTION 'Pilot role % can create schema objects', role_name;
    END IF;
    IF pg_catalog.has_database_privilege(role_name, current_database(), 'TEMPORARY') THEN
      RAISE EXCEPTION 'Pilot role % can create temporary objects', role_name;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r','p','v','m','S')
        AND (
          pg_catalog.has_table_privilege(role_name, c.oid, 'SELECT')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'INSERT')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'UPDATE')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'DELETE')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'TRUNCATE')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'REFERENCES')
          OR pg_catalog.has_table_privilege(role_name, c.oid, 'TRIGGER')
        )
    ) THEN
      RAISE EXCEPTION 'Pilot role % has direct relation privileges', role_name;
    END IF;
  END LOOP;

  IF NOT pg_catalog.has_schema_privilege(pg_catalog.current_setting('bqa.verify_app_role'), 'public', 'USAGE') THEN
    RAISE EXCEPTION 'Application role lost public schema usage';
  END IF;

  IF NOT pg_catalog.has_function_privilege('bqa_pilot_reporter', 'public.bqa_pilot_report_v1(date,date,text)', 'EXECUTE')
     OR pg_catalog.has_function_privilege('bqa_pilot_reporter', 'public.bqa_pilot_subject_delete_v1(text,text,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Reporter function boundary is invalid';
  END IF;

  IF NOT pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_create_cohort_v1(text,date,text,text,boolean)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_classify_queue_v1(text,public."PilotQueueClassification",text,text,boolean,boolean)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_manage_hold_v1(text,text,public."EvidenceHoldReason",integer,text,boolean)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_correct_event_v1(text,public."QueueItemStatus",timestamptz,text,text,boolean)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_subject_delete_v1(text,text,boolean)', 'EXECUTE')
     OR pg_catalog.has_function_privilege('bqa_pilot_operator', 'public.bqa_pilot_retention_execute_v1(integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Operator function boundary is invalid';
  END IF;

  IF NOT pg_catalog.has_function_privilege('bqa_pilot_retention', 'public.bqa_pilot_retention_preview_v1(integer)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('bqa_pilot_retention', 'public.bqa_pilot_retention_execute_v1(integer)', 'EXECUTE')
     OR pg_catalog.has_function_privilege('bqa_pilot_retention', 'public.bqa_pilot_report_v1(date,date,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Retention function boundary is invalid';
  END IF;
END
$block$;

SELECT current_database() AS database,
  'PASS' AS bounded_role_verification,
  pg_catalog.has_schema_privilege(:'app_role', 'public', 'USAGE') AS application_schema_usage;
