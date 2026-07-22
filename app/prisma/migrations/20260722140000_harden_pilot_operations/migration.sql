-- Security/privacy hardening for pilot operator workflows. All operator entry points are
-- versioned SECURITY DEFINER functions owned by a non-login role.
DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'bqa_pilot_function_owner') THEN
    CREATE ROLE bqa_pilot_function_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$block$;

ALTER TABLE public."PilotCohort"
  ALTER COLUMN "evidenceExpiresAt" TYPE timestamptz(3) USING "evidenceExpiresAt" AT TIME ZONE 'UTC',
  ADD COLUMN "pilotEndDate" date,
  ADD COLUMN "shopTimezone" text,
  ADD COLUMN "approvalRef" text;

CREATE OR REPLACE FUNCTION public.prevent_pilot_cohort_expiry_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $function$
BEGIN
  IF NEW."evidenceExpiresAt" IS DISTINCT FROM OLD."evidenceExpiresAt"
     OR NEW."pilotEndDate" IS DISTINCT FROM OLD."pilotEndDate"
     OR NEW."shopTimezone" IS DISTINCT FROM OLD."shopTimezone"
     OR NEW."approvalRef" IS DISTINCT FROM OLD."approvalRef" THEN
    RAISE EXCEPTION 'Pilot cohort evidence contract is immutable';
  END IF;
  RETURN NEW;
END
$function$;

CREATE TABLE public."PilotClassificationAudit" (
  "id" text PRIMARY KEY,
  "queueItemId" text NOT NULL REFERENCES public."QueueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "fromClassification" public."PilotQueueClassification" NOT NULL,
  "toClassification" public."PilotQueueClassification" NOT NULL,
  "reason" text NOT NULL,
  "operatorId" text NOT NULL,
  "reviewedRestore" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz(3) NOT NULL DEFAULT pg_catalog.clock_timestamp()
);
CREATE INDEX "PilotClassificationAudit_queueItemId_createdAt_idx"
  ON public."PilotClassificationAudit"("queueItemId", "createdAt");

CREATE OR REPLACE FUNCTION public.bqa_pilot_event_append_only_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND pg_catalog.current_setting('bqa.pilot_maintenance', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'QueueEvent is append-only';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_validate_correction_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE original public."QueueEvent"%ROWTYPE;
BEGIN
  IF NEW."type" <> 'EVIDENCE_CORRECTION' THEN
    IF NEW."correctsEventId" IS NOT NULL THEN RAISE EXCEPTION 'Only correction events may reference corrected evidence'; END IF;
    RETURN NEW;
  END IF;
  IF NEW."correctsEventId" IS NULL OR NEW."actor" <> 'OPERATOR' OR NEW."mutationSource" <> 'OPERATOR_CORRECTION'
     OR NEW."role" <> 'CORRECTION' OR NEW."reason" <> 'EVIDENCE_CORRECTION' THEN
    RAISE EXCEPTION 'Invalid correction event boundary';
  END IF;
  SELECT * INTO original FROM public."QueueEvent" WHERE "id" = NEW."correctsEventId" FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Corrected event does not exist'; END IF;
  IF original."queueItemId" <> NEW."queueItemId" OR original."pilotCohortId" <> NEW."pilotCohortId" THEN
    RAISE EXCEPTION 'Correction must remain in the same queue and cohort';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW."queueItemId", 0));
  RETURN NEW;
END
$function$;

CREATE TRIGGER "QueueEvent_append_only_v1"
BEFORE UPDATE OR DELETE ON public."QueueEvent"
FOR EACH ROW EXECUTE FUNCTION public.bqa_pilot_event_append_only_v1();
CREATE TRIGGER "QueueEvent_correction_boundary_v1"
BEFORE INSERT ON public."QueueEvent"
FOR EACH ROW EXECUTE FUNCTION public.bqa_pilot_validate_correction_v1();

CREATE OR REPLACE FUNCTION public.bqa_pilot_create_cohort_v1(
  cohort_id text, pilot_end date, shop_timezone text, approval_ref text, execute_change boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE expires_at timestamptz; existing public."PilotCohort"%ROWTYPE; existing_found boolean;
BEGIN
  IF cohort_id !~ '^[a-z0-9][a-z0-9-]{0,47}$' THEN RAISE EXCEPTION 'Invalid cohort id'; END IF;
  IF pilot_end IS NULL OR pilot_end < CURRENT_DATE THEN RAISE EXCEPTION 'Pilot end must be today or later'; END IF;
  IF shop_timezone IS NULL OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = shop_timezone) THEN RAISE EXCEPTION 'Invalid shop timezone'; END IF;
  IF approval_ref IS NULL OR approval_ref !~ '^[A-Za-z0-9._:/-]{3,96}$' THEN RAISE EXCEPTION 'Invalid approval reference'; END IF;
  expires_at := ((pilot_end + 90)::timestamp + time '23:59:59.999') AT TIME ZONE shop_timezone;
  SELECT * INTO existing FROM public."PilotCohort" WHERE "id" = cohort_id FOR UPDATE;
  existing_found := FOUND;
  IF existing_found THEN
    IF existing."evidenceExpiresAt" IS DISTINCT FROM expires_at OR existing."pilotEndDate" IS DISTINCT FROM pilot_end
       OR existing."shopTimezone" IS DISTINCT FROM shop_timezone OR existing."approvalRef" IS DISTINCT FROM approval_ref THEN
      RAISE EXCEPTION 'Existing cohort is immutable and does not match';
    END IF;
  ELSIF execute_change THEN
    INSERT INTO public."PilotCohort"("id", "evidenceExpiresAt", "pilotEndDate", "shopTimezone", "approvalRef", "createdAt")
    VALUES (cohort_id, expires_at, pilot_end, shop_timezone, approval_ref, pg_catalog.clock_timestamp());
  END IF;
  RETURN pg_catalog.jsonb_build_object('action', CASE WHEN existing_found THEN 'verify' WHEN execute_change THEN 'created' ELSE 'would-create' END,
    'cohort', cohort_id, 'pilotEnd', pilot_end, 'shopTimezone', shop_timezone, 'evidenceExpiresAt', expires_at, 'approvalRef', approval_ref);
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_classify_queue_v1(
  queue_suffix text, new_classification public."PilotQueueClassification", reason text, operator_id text,
  reviewed_restore boolean DEFAULT false, execute_change boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE q public."QueueItem"%ROWTYPE; matches integer; audit_id text;
BEGIN
  IF queue_suffix !~ '^[A-Z0-9]{6}$' THEN RAISE EXCEPTION 'Invalid queue suffix'; END IF;
  IF new_classification = 'PRE_PILOT' OR (new_classification = 'REAL' AND NOT reviewed_restore) THEN
    RAISE EXCEPTION 'REAL restore requires reviewed restore; PRE_PILOT is not an operator classification';
  END IF;
  IF reason NOT IN ('SMOKE_TEST','TRAINING_RECORD','DATA_QUALITY','OPERATOR_ERROR','REVIEWED_RESTORE','OTHER_APPROVED') THEN RAISE EXCEPTION 'Invalid classification reason'; END IF;
  IF new_classification = 'REAL' AND reason <> 'REVIEWED_RESTORE' THEN RAISE EXCEPTION 'REAL restore requires reviewed reason'; END IF;
  IF operator_id IS NULL OR operator_id !~ '^[A-Za-z0-9._@-]{2,64}$' THEN RAISE EXCEPTION 'Invalid operator identity'; END IF;
  SELECT count(*) INTO matches FROM public."QueueItem" WHERE pg_catalog.upper(pg_catalog.right("id", 6)) = queue_suffix;
  IF matches <> 1 THEN RAISE EXCEPTION 'Queue suffix must match exactly one queue'; END IF;
  SELECT * INTO q FROM public."QueueItem" WHERE pg_catalog.upper(pg_catalog.right("id", 6)) = queue_suffix FOR UPDATE;
  IF q."pilotClassification" = new_classification THEN RAISE EXCEPTION 'Classification is unchanged'; END IF;
  audit_id := 'pca_' || pg_catalog.md5(pg_catalog.gen_random_uuid()::text);
  IF execute_change THEN
    UPDATE public."QueueItem" SET "pilotClassification" = new_classification WHERE "id" = q."id";
    INSERT INTO public."PilotClassificationAudit"("id", "queueItemId", "fromClassification", "toClassification", "reason", "operatorId", "reviewedRestore")
    VALUES (audit_id, q."id", q."pilotClassification", new_classification, pg_catalog.btrim(reason), operator_id, reviewed_restore);
  END IF;
  RETURN pg_catalog.jsonb_build_object('queueCode', 'Q' || queue_suffix, 'from', q."pilotClassification", 'to', new_classification,
    'cohort', q."pilotCohortId", 'date', q."date"::date, 'reviewedRestore', reviewed_restore, 'mode', CASE WHEN execute_change THEN 'execute' ELSE 'dry-run' END);
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_manage_hold_v1(
  queue_suffix text, action text, hold_reason public."EvidenceHoldReason", days integer, approved_by text,
  execute_change boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE queue_id text; matches integer; active_count integer; expires_at timestamptz;
BEGIN
  IF queue_suffix !~ '^[A-Z0-9]{6}$' OR action NOT IN ('create','release') THEN RAISE EXCEPTION 'Invalid hold request'; END IF;
  IF approved_by IS NULL OR approved_by !~ '^[A-Za-z0-9._@-]{2,64}$' THEN RAISE EXCEPTION 'Invalid approver'; END IF;
  IF action = 'create' AND (hold_reason IS NULL OR days < 1 OR days > 30) THEN RAISE EXCEPTION 'Create requires reason and 1..30 days'; END IF;
  SELECT count(*), min("id") INTO matches, queue_id FROM public."QueueItem" WHERE pg_catalog.upper(pg_catalog.right("id", 6)) = queue_suffix;
  IF matches <> 1 THEN RAISE EXCEPTION 'Queue suffix must match exactly one queue'; END IF;
  PERFORM 1 FROM public."QueueItem" WHERE "id" = queue_id FOR UPDATE;
  SELECT count(*) INTO active_count FROM public."EvidenceHold" WHERE "queueItemId" = queue_id AND "releasedAt" IS NULL AND "expiresAt" > pg_catalog.clock_timestamp();
  IF action = 'create' AND active_count > 0 THEN RAISE EXCEPTION 'Active hold already exists; fresh approval is required'; END IF;
  expires_at := pg_catalog.clock_timestamp() + pg_catalog.make_interval(days => days);
  IF execute_change AND action = 'create' THEN
    INSERT INTO public."EvidenceHold"("id", "queueItemId", "reason", "approvedBy", "startsAt", "expiresAt", "createdAt")
    VALUES ('hold_' || pg_catalog.md5(pg_catalog.gen_random_uuid()::text), queue_id, hold_reason, approved_by, pg_catalog.clock_timestamp(), expires_at, pg_catalog.clock_timestamp());
  ELSIF execute_change AND action = 'release' THEN
    UPDATE public."EvidenceHold" SET "releasedAt" = pg_catalog.clock_timestamp()
    WHERE "queueItemId" = queue_id AND "releasedAt" IS NULL AND "expiresAt" > pg_catalog.clock_timestamp();
  END IF;
  RETURN pg_catalog.jsonb_build_object('queueCode','Q'||queue_suffix,'action',action,'activeHolds',active_count,
    'expiresAt',CASE WHEN action='create' THEN expires_at ELSE NULL END,'mode',CASE WHEN execute_change THEN 'execute' ELSE 'dry-run' END);
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_correct_event_v1(
  event_id text, corrected_status public."QueueItemStatus", corrected_effective_at timestamptz,
  reason text, operator_id text, execute_change boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE original public."QueueEvent"%ROWTYPE; operation_id text; correction_id text; next_sequence integer;
BEGIN
  IF reason NOT IN ('FACTUAL_STATUS_ERROR','FACTUAL_TIME_ERROR','FACTUAL_STATUS_AND_TIME_ERROR') THEN RAISE EXCEPTION 'Invalid correction reason'; END IF;
  IF operator_id IS NULL OR operator_id !~ '^[A-Za-z0-9._@-]{2,64}$' THEN RAISE EXCEPTION 'Invalid operator identity'; END IF;
  SELECT * INTO original FROM public."QueueEvent" WHERE "id" = event_id FOR UPDATE;
  IF NOT FOUND OR original."type" = 'EVIDENCE_CORRECTION' THEN RAISE EXCEPTION 'Correctable original event not found'; END IF;
  PERFORM 1 FROM public."QueueItem" WHERE "id" = original."queueItemId" FOR UPDATE;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(original."queueItemId", 0));
  SELECT coalesce(max("sequence"),0)+1 INTO next_sequence FROM public."QueueEvent" WHERE "queueItemId" = original."queueItemId";
  IF corrected_status IS NULL AND corrected_effective_at IS NULL THEN RAISE EXCEPTION 'At least one typed correction is required'; END IF;
  IF corrected_effective_at IS NOT NULL AND corrected_effective_at > pg_catalog.clock_timestamp() THEN RAISE EXCEPTION 'Correction time cannot be in the future'; END IF;
  operation_id := pg_catalog.gen_random_uuid()::text; correction_id := pg_catalog.gen_random_uuid()::text;
  IF execute_change THEN
    INSERT INTO public."QueueMutationOperation"("id","mutationSource","primaryQueueItemId","outcome","pilotCohortId","pilotReleaseSegment","createdAt","completedAt")
    VALUES(operation_id,'OPERATOR_CORRECTION',original."queueItemId",'APPLIED',original."pilotCohortId",original."pilotReleaseSegment",pg_catalog.clock_timestamp(),pg_catalog.clock_timestamp());
    INSERT INTO public."QueueEvent"("id","operationId","role","eventOrdinal","queueItemId","type","actor","mutationSource","reason","schemaVersion","sequence","effectiveAt","recordedAt","pilotCohortId","pilotReleaseSegment","toStatus","correctsEventId")
    VALUES(correction_id,operation_id,'CORRECTION',0,original."queueItemId",'EVIDENCE_CORRECTION','OPERATOR','OPERATOR_CORRECTION','EVIDENCE_CORRECTION',1,next_sequence,
      coalesce(corrected_effective_at,original."effectiveAt"),pg_catalog.clock_timestamp(),original."pilotCohortId",original."pilotReleaseSegment",coalesce(corrected_status,original."toStatus"),original."id");
  END IF;
  RETURN pg_catalog.jsonb_build_object('action','append-correction','eventId',event_id,'queueCode','Q'||pg_catalog.upper(pg_catalog.right(original."queueItemId",6)),
    'toStatus',coalesce(corrected_status,original."toStatus"),'effectiveAt',coalesce(corrected_effective_at,original."effectiveAt"),'mode',CASE WHEN execute_change THEN 'execute' ELSE 'dry-run' END);
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_subject_delete_v1(queue_suffix text, operator_id text, execute_change boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE seed public."QueueItem"%ROWTYPE; matches integer; queue_ids text[]; hold_count integer; event_count integer; notification_count integer; customer_id text; operation_ids text[];
BEGIN
  IF queue_suffix !~ '^[A-Z0-9]{6}$' OR operator_id !~ '^[A-Za-z0-9._@-]{2,64}$' THEN RAISE EXCEPTION 'Invalid subject request'; END IF;
  SELECT count(*) INTO matches FROM public."QueueItem" WHERE pg_catalog.upper(pg_catalog.right("id",6))=queue_suffix;
  IF matches <> 1 THEN RAISE EXCEPTION 'Queue suffix must match exactly one queue'; END IF;
  SELECT * INTO seed FROM public."QueueItem" WHERE pg_catalog.upper(pg_catalog.right("id",6))=queue_suffix FOR UPDATE;
  customer_id := seed."customerId";
  IF customer_id IS NOT NULL THEN PERFORM 1 FROM public."Customer" WHERE "id"=customer_id FOR UPDATE; END IF;
  SELECT pg_catalog.array_agg("id" ORDER BY "id") INTO queue_ids FROM public."QueueItem" WHERE "id"=seed."id" OR (customer_id IS NOT NULL AND "customerId"=customer_id);
  PERFORM 1 FROM public."QueueItem" WHERE "id"=ANY(queue_ids) ORDER BY "id" FOR UPDATE;
  PERFORM 1 FROM public."EvidenceHold" WHERE "queueItemId"=ANY(queue_ids) AND "releasedAt" IS NULL AND "expiresAt">pg_catalog.clock_timestamp() FOR SHARE;
  SELECT count(*) INTO hold_count FROM public."EvidenceHold" WHERE "queueItemId"=ANY(queue_ids) AND "releasedAt" IS NULL AND "expiresAt">pg_catalog.clock_timestamp();
  SELECT count(*) INTO event_count FROM public."QueueEvent" WHERE "queueItemId"=ANY(queue_ids);
  SELECT count(*) INTO notification_count FROM public."NotificationLog" WHERE "queueItemId"=ANY(queue_ids) OR (customer_id IS NOT NULL AND "customerId"=customer_id);
  SELECT pg_catalog.array_agg(DISTINCT operation_id) INTO operation_ids FROM (
    SELECT "operationId" operation_id FROM public."QueueEvent" WHERE "queueItemId"=ANY(queue_ids)
    UNION SELECT "operationId" FROM public."NotificationLog" WHERE ("queueItemId"=ANY(queue_ids) OR (customer_id IS NOT NULL AND "customerId"=customer_id)) AND "operationId" IS NOT NULL
  ) ids;
  IF hold_count > 0 THEN RAISE EXCEPTION 'Deletion is deferred by an active approved hold'; END IF;
  IF execute_change THEN
    PERFORM pg_catalog.set_config('bqa.pilot_maintenance','on',true);
    UPDATE public."NotificationLog" SET "customerId"=NULL,"recipient"=NULL,"messagePreview"='ลบรายละเอียดตามคำขอ',"error"=NULL,
      "audience"=NULL,"skipReason"=NULL,"businessEventKey"=NULL,"attemptNumber"=NULL,"pilotCohortId"=NULL,"operationId"=NULL
      WHERE "queueItemId"=ANY(queue_ids) OR (customer_id IS NOT NULL AND "customerId"=customer_id);
    DELETE FROM public."QueueEvent" WHERE "queueItemId"=ANY(queue_ids);
    UPDATE public."QueueMutationOperation" SET "primaryQueueItemId"=NULL WHERE "primaryQueueItemId"=ANY(queue_ids);
    UPDATE public."QueueItem" SET "customerId"=NULL,"customerNameSnapshot"='ลบข้อมูลแล้ว',"phoneSnapshot"=NULL,"lineUserIdSnapshot"=NULL,"note"=NULL,"ownerNote"=NULL,
      "entrySource"='UNKNOWN',"quotedEstimatedAt"=NULL,"quotedWaitMinutes"=NULL,"pilotClassification"='PRE_PILOT',"pilotCohortId"=NULL,"pilotReleaseSegment"=NULL
      WHERE "id"=ANY(queue_ids);
    IF operation_ids IS NOT NULL THEN DELETE FROM public."QueueMutationOperation" o WHERE o."id"=ANY(operation_ids) AND NOT EXISTS(SELECT 1 FROM public."QueueEvent" e WHERE e."operationId"=o."id") AND NOT EXISTS(SELECT 1 FROM public."NotificationLog" n WHERE n."operationId"=o."id"); END IF;
    IF customer_id IS NOT NULL THEN DELETE FROM public."Customer" c WHERE c."id"=customer_id AND NOT EXISTS(SELECT 1 FROM public."QueueItem" q WHERE q."customerId"=c."id") AND NOT EXISTS(SELECT 1 FROM public."NotificationLog" n WHERE n."customerId"=c."id"); END IF;
  END IF;
  RETURN pg_catalog.jsonb_build_object('queueCode','Q'||queue_suffix,'customerLinkedQueues',pg_catalog.cardinality(queue_ids),'activeHolds',hold_count,
    'events',event_count,'notifications',notification_count,'mode',CASE WHEN execute_change THEN 'execute' ELSE 'dry-run' END);
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_retention_preview_v1(retention_days integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
DECLARE cutoff timestamptz; result jsonb;
BEGIN
  IF retention_days < 30 OR retention_days > 3650 THEN RAISE EXCEPTION 'Retention days out of range'; END IF;
  cutoff := pg_catalog.clock_timestamp()-pg_catalog.make_interval(days=>retention_days);
  SELECT pg_catalog.jsonb_build_object('retentionDays',retention_days,'cutoff',cutoff,
    'expiredCohorts',(SELECT count(*) FROM public."PilotCohort" WHERE "evidenceExpiresAt"<=pg_catalog.clock_timestamp()),
    'expiredEventsEligible',(SELECT count(*) FROM public."QueueEvent" e JOIN public."PilotCohort" c ON c."id"=e."pilotCohortId" WHERE c."evidenceExpiresAt"<=pg_catalog.clock_timestamp() AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=e."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp())),
    'expiredNotificationsEligible',(SELECT count(*) FROM public."NotificationLog" n JOIN public."PilotCohort" c ON c."id"=n."pilotCohortId" WHERE c."evidenceExpiresAt"<=pg_catalog.clock_timestamp() AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=n."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp())),
    'customerQueuesEligible',(SELECT count(*) FROM public."QueueItem" q WHERE q."date"<cutoff AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=q."id" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp())),
    'customerNotificationsEligible',(SELECT count(*) FROM public."NotificationLog" n WHERE n."createdAt"<cutoff AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=n."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp()))) INTO result;
  RETURN result;
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_retention_execute_v1(retention_days integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
DECLARE preview jsonb; cutoff timestamptz; post_failures integer;
BEGIN
  preview:=public.bqa_pilot_retention_preview_v1(retention_days); cutoff:=pg_catalog.clock_timestamp()-pg_catalog.make_interval(days=>retention_days);
  PERFORM pg_catalog.set_config('bqa.pilot_maintenance','on',true);
  DELETE FROM public."EvidenceHold" WHERE "releasedAt" IS NOT NULL OR "expiresAt"<=pg_catalog.clock_timestamp();
  DELETE FROM public."QueueEvent" e USING public."PilotCohort" c WHERE c."id"=e."pilotCohortId" AND c."evidenceExpiresAt"<=pg_catalog.clock_timestamp()
    AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=e."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  UPDATE public."NotificationLog" n SET "audience"=NULL,"skipReason"=NULL,"businessEventKey"=NULL,"attemptNumber"=NULL,"pilotCohortId"=NULL,"operationId"=NULL
    FROM public."PilotCohort" c WHERE c."id"=n."pilotCohortId" AND c."evidenceExpiresAt"<=pg_catalog.clock_timestamp()
    AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=n."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  UPDATE public."QueueItem" q SET "entrySource"='UNKNOWN',"quotedEstimatedAt"=NULL,"quotedWaitMinutes"=NULL,"pilotClassification"='PRE_PILOT',"pilotCohortId"=NULL,"pilotReleaseSegment"=NULL
    FROM public."PilotCohort" c WHERE c."id"=q."pilotCohortId" AND c."evidenceExpiresAt"<=pg_catalog.clock_timestamp()
    AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=q."id" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  DELETE FROM public."QueueMutationOperation" o WHERE EXISTS(SELECT 1 FROM public."PilotCohort" c WHERE c."id"=o."pilotCohortId" AND c."evidenceExpiresAt"<=pg_catalog.clock_timestamp())
    AND NOT EXISTS(SELECT 1 FROM public."QueueEvent" e WHERE e."operationId"=o."id") AND NOT EXISTS(SELECT 1 FROM public."NotificationLog" n WHERE n."operationId"=o."id");
  UPDATE public."NotificationLog" n SET "customerId"=NULL,"recipient"=NULL,"messagePreview"='ลบรายละเอียดตามนโยบายการเก็บข้อมูล',"error"=NULL WHERE n."createdAt"<cutoff
    AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=n."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  UPDATE public."QueueItem" q SET "customerId"=NULL,"customerNameSnapshot"='ลบข้อมูลแล้ว',"phoneSnapshot"=NULL,"lineUserIdSnapshot"=NULL,"note"=NULL,"ownerNote"=NULL WHERE q."date"<cutoff
    AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=q."id" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  DELETE FROM public."Customer" c WHERE c."updatedAt"<cutoff AND NOT EXISTS(SELECT 1 FROM public."QueueItem" q WHERE q."customerId"=c."id") AND NOT EXISTS(SELECT 1 FROM public."NotificationLog" n WHERE n."customerId"=c."id")
    AND NOT EXISTS(SELECT 1 FROM public."QueueItem" q JOIN public."EvidenceHold" h ON h."queueItemId"=q."id" WHERE q."customerId"=c."id" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  DELETE FROM public."RateLimitBucket" WHERE "updatedAt"<pg_catalog.clock_timestamp()-interval '30 days';
  SELECT count(*) INTO post_failures FROM public."QueueEvent" e JOIN public."PilotCohort" c ON c."id"=e."pilotCohortId" WHERE c."evidenceExpiresAt"<=pg_catalog.clock_timestamp() AND NOT EXISTS(SELECT 1 FROM public."EvidenceHold" h WHERE h."queueItemId"=e."queueItemId" AND h."releasedAt" IS NULL AND h."expiresAt">pg_catalog.clock_timestamp());
  IF post_failures<>0 THEN RAISE EXCEPTION 'Retention post-condition failed for eligible expired events'; END IF;
  RETURN preview || pg_catalog.jsonb_build_object('mode','execute','postconditions','satisfied');
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_report_v1(from_date date, to_date date, cohort_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
DECLARE tz text; from_at timestamptz; to_at timestamptz; cohort_count integer; report jsonb;
BEGIN
  IF from_date IS NULL OR to_date IS NULL OR from_date>to_date THEN RAISE EXCEPTION 'Invalid report period'; END IF;
  SELECT count(*),min("timezone") INTO cohort_count,tz FROM public."ShopSettings";
  IF cohort_count<>1 THEN RAISE EXCEPTION 'Exactly one shop settings row is required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public."PilotCohort" WHERE "id"=cohort_id) THEN RAISE EXCEPTION 'Cohort not found'; END IF;
  from_at:=from_date::timestamp AT TIME ZONE tz; to_at:=(to_date+1)::timestamp AT TIME ZONE tz;
  WITH real_q AS (SELECT * FROM public."QueueItem" WHERE "pilotCohortId"=cohort_id AND "pilotClassification"='REAL' AND "createdAt">=from_at AND "createdAt"<to_at),
  q AS (SELECT count(*) total,count(*) FILTER(WHERE "createdBy"='CUSTOMER') self_service,count(*) FILTER(WHERE "createdBy"='OWNER') owner_created,
    count(*) FILTER(WHERE "status" IN ('DONE','CANCELLED','NO_SHOW')) terminal,count(*) FILTER(WHERE "status"='DONE') done,count(*) FILTER(WHERE "status"='CANCELLED') cancelled,
    count(*) FILTER(WHERE "type"='BOOKING' AND "status" IN ('DONE','CANCELLED','NO_SHOW')) booking_terminal,count(*) FILTER(WHERE "type"='BOOKING' AND "status"='NO_SHOW') booking_no_show,
    count(*) FILTER(WHERE "type"='WALK_IN') walk_eligible,count(*) FILTER(WHERE "type"='WALK_IN' AND "quotedEstimatedAt" IS NOT NULL) walk_quote,
    count(*) FILTER(WHERE "type"='WALK_IN' AND "quotedEstimatedAt" IS NULL) walk_missing_quote,count(*) FILTER(WHERE "type"='WALK_IN' AND "startedAt" IS NULL) walk_unstarted,
    count(*) FILTER(WHERE "type"='WALK_IN' AND "quotedEstimatedAt" IS NOT NULL AND "startedAt">="quotedEstimatedAt"-interval '24 hours') walk_valid,
    count(*) FILTER(WHERE "type"='WALK_IN' AND "quotedEstimatedAt" IS NOT NULL AND "startedAt" IS NOT NULL AND "startedAt"<"quotedEstimatedAt"-interval '24 hours') walk_invalid,
    count(*) FILTER(WHERE "type"='BOOKING') booking_eligible,count(*) FILTER(WHERE "type"='BOOKING' AND "startedAt" IS NULL) booking_unstarted,
    count(*) FILTER(WHERE "type"='BOOKING' AND "startAt" IS NOT NULL AND "startedAt" IS NOT NULL AND "startedAt">="startAt"-interval '24 hours') booking_valid,
    count(*) FILTER(WHERE "type"='BOOKING' AND "startAt" IS NOT NULL AND "startedAt" IS NOT NULL AND "startedAt"<"startAt"-interval '24 hours') booking_invalid,
    count(*) FILTER(WHERE "startedAt" IS NULL OR "completedAt" IS NULL) duration_missing,count(*) FILTER(WHERE "startedAt" IS NOT NULL AND "completedAt">="startedAt") duration_valid,count(*) FILTER(WHERE "startedAt" IS NOT NULL AND "completedAt" IS NOT NULL AND "completedAt"<"startedAt") duration_invalid FROM real_q),
  classifications AS (SELECT pg_catalog.jsonb_object_agg("pilotClassification",n) value FROM (SELECT "pilotClassification",count(*) n FROM public."QueueItem" WHERE "pilotCohortId"=cohort_id AND "createdAt">=from_at AND "createdAt"<to_at GROUP BY 1)s),
  sources AS (SELECT pg_catalog.jsonb_object_agg("entrySource",n) value FROM (SELECT "entrySource",count(*) n FROM real_q GROUP BY 1)s),
  queue_types AS (SELECT pg_catalog.jsonb_object_agg("type",n) value FROM (SELECT "type",count(*) n FROM real_q GROUP BY 1)s),
  release_segments AS (SELECT pg_catalog.jsonb_object_agg(coalesce("pilotReleaseSegment",'MISSING'),n) value FROM (SELECT "pilotReleaseSegment",count(*) n FROM real_q GROUP BY 1)s),
  notif AS (SELECT count(*) total,count(*) FILTER(WHERE "status"='SENT') sent,count(*) FILTER(WHERE "status"='FAILED') failed,count(*) FILTER(WHERE "status"='SKIPPED') skipped,
    count(*) FILTER(WHERE "status"='SKIPPED' AND "skipReason"='NO_CUSTOMER_RECIPIENT') skipped_no_customer_recipient,
    count(*) FILTER(WHERE "status"='SKIPPED' AND "skipReason"='NO_OWNER_RECIPIENT') skipped_no_owner_recipient,
    count(*) FILTER(WHERE "status"='SKIPPED' AND "skipReason"='LINE_TOKEN_MISSING') skipped_line_token_missing,
    count(*) FILTER(WHERE "status"='PENDING' AND "createdAt"<pg_catalog.clock_timestamp()-interval '10 minutes') aged_pending,
    count(DISTINCT "businessEventKey") FILTER(WHERE "businessEventKey" IS NOT NULL AND "status" IN ('SENT','FAILED')) terminal_business_events,
    count(DISTINCT "businessEventKey") FILTER(WHERE "businessEventKey" IS NOT NULL AND "status"='SENT') successful_business_events FROM public."NotificationLog" WHERE "pilotCohortId"=cohort_id AND "audience"='CUSTOMER' AND "createdAt">=from_at AND "createdAt"<to_at),
  event_truth AS (SELECT count(*) FILTER(WHERE "type"='EVIDENCE_CORRECTION') corrections,count(DISTINCT "queueItemId") FILTER(WHERE "type" IN ('QUEUE_REORDERED','SCHEDULE_CHANGED','SERVICE_CHANGED','OWNER_OVERRIDE')) corrected_queues,
    count(*) FILTER(WHERE "type"<>'EVIDENCE_CORRECTION' AND NOT EXISTS(SELECT 1 FROM public."QueueEvent" c WHERE c."correctsEventId"=e."id")) effective_events FROM public."QueueEvent" e WHERE e."pilotCohortId"=cohort_id AND e."effectiveAt">=from_at AND e."effectiveAt"<to_at),
  walk_stats AS (SELECT count(*) samples,percentile_cont(.5) WITHIN GROUP(ORDER BY extract(epoch FROM ("startedAt"-"quotedEstimatedAt"))/60) median_signed,
    percentile_cont(.5) WITHIN GROUP(ORDER BY abs(extract(epoch FROM ("startedAt"-"quotedEstimatedAt"))/60)) median_abs,percentile_cont(.75) WITHIN GROUP(ORDER BY abs(extract(epoch FROM ("startedAt"-"quotedEstimatedAt"))/60)) p75_abs,percentile_cont(.9) WITHIN GROUP(ORDER BY abs(extract(epoch FROM ("startedAt"-"quotedEstimatedAt"))/60)) p90_abs FROM real_q WHERE "type"='WALK_IN' AND "quotedEstimatedAt" IS NOT NULL AND "startedAt">="quotedEstimatedAt"-interval '24 hours'),
  booking_stats AS (SELECT count(*) samples,percentile_cont(.5) WITHIN GROUP(ORDER BY extract(epoch FROM ("startedAt"-"startAt"))/60) median_signed,percentile_cont(.9) WITHIN GROUP(ORDER BY abs(extract(epoch FROM ("startedAt"-"startAt"))/60)) p90_abs FROM real_q WHERE "type"='BOOKING' AND "startAt" IS NOT NULL AND "startedAt">="startAt"-interval '24 hours'),
  duration_stats AS (SELECT count(*) samples,percentile_cont(.5) WITHIN GROUP(ORDER BY extract(epoch FROM ("completedAt"-"startedAt"))/60) median_actual_minutes,percentile_cont(.9) WITHIN GROUP(ORDER BY extract(epoch FROM ("completedAt"-"startedAt"))/60) p90_actual_minutes FROM real_q WHERE "startedAt" IS NOT NULL AND "completedAt">="startedAt")
  SELECT pg_catalog.jsonb_build_object('classification','OWNER/OPERATOR ONLY - DO NOT SHARE','shareSafe',false,'schemaVersion',1,'generatedAt',pg_catalog.clock_timestamp(),'cohort',cohort_id,'period',pg_catalog.jsonb_build_object('from',from_date,'to',to_date),'timezone',tz,
    'queue',pg_catalog.to_jsonb(q),'classifications',coalesce(classifications.value,'{}'::jsonb),'sourceCounts',coalesce(sources.value,'{}'::jsonb),'queueTypeCounts',coalesce(queue_types.value,'{}'::jsonb),'releaseSegmentCounts',coalesce(release_segments.value,'{}'::jsonb),
    'rates',pg_catalog.jsonb_build_object('selfService',CASE WHEN q.total>0 THEN q.self_service::numeric/q.total END,'ownerManual',CASE WHEN q.total>0 THEN q.owner_created::numeric/q.total END,'completion',CASE WHEN q.terminal>0 THEN q.done::numeric/q.terminal END,'cancellation',CASE WHEN q.terminal>0 THEN q.cancelled::numeric/q.terminal END,'bookingNoShow',CASE WHEN q.booking_terminal>0 THEN q.booking_no_show::numeric/q.booking_terminal END,'quoteCoverage',CASE WHEN q.walk_eligible>0 THEN q.walk_quote::numeric/q.walk_eligible END,'validWaitCoverage',CASE WHEN q.walk_eligible>0 THEN q.walk_valid::numeric/q.walk_eligible END,'correction',CASE WHEN q.total>0 THEN event_truth.corrected_queues::numeric/q.total END),
    'walkInWait',pg_catalog.to_jsonb(walk_stats),'bookingScheduledStart',pg_catalog.to_jsonb(booking_stats),'actualServiceDuration',pg_catalog.to_jsonb(duration_stats),
    'customerNotificationTruth',pg_catalog.to_jsonb(notif)||pg_catalog.jsonb_build_object('apiAcceptanceRate',CASE WHEN notif.sent+notif.failed>0 THEN notif.sent::numeric/(notif.sent+notif.failed) END,'uniqueBusinessEventSuccessRate',CASE WHEN notif.terminal_business_events>0 THEN notif.successful_business_events::numeric/notif.terminal_business_events END),
    'eventTruth',pg_catalog.to_jsonb(event_truth),'unavailableFromApp',pg_catalog.jsonb_build_array('adoption denominator','off-app fallback','repeated questions','owner minutes','owner confidence')) INTO report
  FROM q,classifications,sources,queue_types,release_segments,notif,event_truth,walk_stats,booking_stats,duration_stats;
  RETURN report;
END
$function$;

GRANT USAGE ON SCHEMA public TO bqa_pilot_function_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PilotCohort", public."PilotClassificationAudit", public."QueueItem", public."Customer",
  public."QueueMutationOperation", public."QueueEvent", public."EvidenceHold", public."NotificationLog", public."RateLimitBucket"
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
