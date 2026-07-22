CREATE OR REPLACE FUNCTION public.bqa_pilot_subject_delete_v1(
  queue_suffix text,
  operator_id text,
  execute_change boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  seed public."QueueItem"%ROWTYPE;
  matches integer;
  customer_id text;
  queue_ids text[] := ARRAY[]::text[];
  eligible_queue_ids text[] := ARRAY[]::text[];
  held_queue_ids text[] := ARRAY[]::text[];
  operation_ids text[] := ARRAY[]::text[];
  event_count integer := 0;
  notification_count integer := 0;
BEGIN
  IF queue_suffix !~ '^[A-Z0-9]{6}$' OR operator_id !~ '^[A-Za-z0-9._@-]{2,64}$' THEN
    RAISE EXCEPTION 'Invalid subject request';
  END IF;

  SELECT count(*) INTO matches
  FROM public."QueueItem"
  WHERE pg_catalog.upper(pg_catalog.right("id", 6)) = queue_suffix;

  IF matches <> 1 THEN
    RAISE EXCEPTION 'Queue suffix must match exactly one queue';
  END IF;

  SELECT * INTO seed
  FROM public."QueueItem"
  WHERE pg_catalog.upper(pg_catalog.right("id", 6)) = queue_suffix
  FOR UPDATE;

  customer_id := seed."customerId";

  IF customer_id IS NOT NULL THEN
    PERFORM 1 FROM public."Customer" WHERE "id" = customer_id FOR UPDATE;
  END IF;

  SELECT coalesce(pg_catalog.array_agg("id" ORDER BY "id"), ARRAY[]::text[])
  INTO queue_ids
  FROM public."QueueItem"
  WHERE "id" = seed."id" OR (customer_id IS NOT NULL AND "customerId" = customer_id);

  PERFORM 1
  FROM public."QueueItem"
  WHERE "id" = ANY(queue_ids)
  ORDER BY "id"
  FOR UPDATE;

  PERFORM 1
  FROM public."EvidenceHold"
  WHERE "queueItemId" = ANY(queue_ids)
    AND "releasedAt" IS NULL
    AND "expiresAt" > pg_catalog.clock_timestamp()
  ORDER BY "queueItemId", "id"
  FOR SHARE;

  SELECT
    coalesce(pg_catalog.array_agg(q."id" ORDER BY q."id") FILTER (WHERE h."queueItemId" IS NULL), ARRAY[]::text[]),
    coalesce(pg_catalog.array_agg(q."id" ORDER BY q."id") FILTER (WHERE h."queueItemId" IS NOT NULL), ARRAY[]::text[])
  INTO eligible_queue_ids, held_queue_ids
  FROM public."QueueItem" q
  LEFT JOIN LATERAL (
    SELECT eh."queueItemId"
    FROM public."EvidenceHold" eh
    WHERE eh."queueItemId" = q."id"
      AND eh."releasedAt" IS NULL
      AND eh."expiresAt" > pg_catalog.clock_timestamp()
    LIMIT 1
  ) h ON true
  WHERE q."id" = ANY(queue_ids);

  SELECT count(*) INTO event_count
  FROM public."QueueEvent"
  WHERE "queueItemId" = ANY(eligible_queue_ids);

  SELECT count(*) INTO notification_count
  FROM public."NotificationLog"
  WHERE "queueItemId" = ANY(eligible_queue_ids);

  SELECT coalesce(pg_catalog.array_agg(DISTINCT operation_id), ARRAY[]::text[])
  INTO operation_ids
  FROM (
    SELECT "operationId" AS operation_id
    FROM public."QueueEvent"
    WHERE "queueItemId" = ANY(eligible_queue_ids)
    UNION
    SELECT "operationId"
    FROM public."NotificationLog"
    WHERE "queueItemId" = ANY(eligible_queue_ids)
      AND "operationId" IS NOT NULL
  ) ids;

  IF execute_change AND pg_catalog.cardinality(eligible_queue_ids) > 0 THEN
    PERFORM pg_catalog.set_config('bqa.pilot_maintenance', 'on', true);

    UPDATE public."NotificationLog"
    SET "customerId" = NULL,
        "recipient" = NULL,
        "messagePreview" = 'ลบรายละเอียดตามคำขอ',
        "error" = NULL,
        "audience" = NULL,
        "skipReason" = NULL,
        "businessEventKey" = NULL,
        "attemptNumber" = NULL,
        "pilotCohortId" = NULL,
        "operationId" = NULL
    WHERE "queueItemId" = ANY(eligible_queue_ids);

    DELETE FROM public."QueueEvent"
    WHERE "queueItemId" = ANY(eligible_queue_ids);

    UPDATE public."QueueMutationOperation"
    SET "primaryQueueItemId" = NULL
    WHERE "primaryQueueItemId" = ANY(eligible_queue_ids);

    UPDATE public."QueueItem"
    SET "customerId" = NULL,
        "customerNameSnapshot" = 'ลบข้อมูลแล้ว',
        "phoneSnapshot" = NULL,
        "lineUserIdSnapshot" = NULL,
        "note" = NULL,
        "ownerNote" = NULL,
        "publicToken" = 'deleted_' || pg_catalog.md5(pg_catalog.gen_random_uuid()::text || "id"),
        "entrySource" = 'UNKNOWN',
        "quotedEstimatedAt" = NULL,
        "quotedWaitMinutes" = NULL,
        "pilotClassification" = 'PRE_PILOT',
        "pilotCohortId" = NULL,
        "pilotReleaseSegment" = NULL
    WHERE "id" = ANY(eligible_queue_ids);

    DELETE FROM public."QueueMutationOperation" o
    WHERE o."id" = ANY(operation_ids)
      AND NOT EXISTS (SELECT 1 FROM public."QueueEvent" e WHERE e."operationId" = o."id")
      AND NOT EXISTS (SELECT 1 FROM public."NotificationLog" n WHERE n."operationId" = o."id");

    IF customer_id IS NOT NULL THEN
      DELETE FROM public."Customer" c
      WHERE c."id" = customer_id
        AND NOT EXISTS (SELECT 1 FROM public."QueueItem" q WHERE q."customerId" = c."id")
        AND NOT EXISTS (SELECT 1 FROM public."NotificationLog" n WHERE n."customerId" = c."id");
    END IF;
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'queueCode', 'Q' || queue_suffix,
    'customerLinkedQueues', pg_catalog.cardinality(queue_ids),
    'processedQueues', pg_catalog.cardinality(eligible_queue_ids),
    'deferredHeldQueues', pg_catalog.cardinality(held_queue_ids),
    'events', event_count,
    'notifications', notification_count,
    'mode', CASE WHEN execute_change THEN 'execute' ELSE 'dry-run' END
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.bqa_pilot_report_v1(
  from_date date,
  to_date date,
  cohort_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  tz text;
  from_at timestamptz;
  to_at timestamptz;
  settings_count integer;
  report jsonb;
BEGIN
  IF from_date IS NULL OR to_date IS NULL OR from_date > to_date THEN
    RAISE EXCEPTION 'Invalid report period';
  END IF;

  SELECT count(*), min("timezone") INTO settings_count, tz FROM public."ShopSettings";
  IF settings_count <> 1 THEN RAISE EXCEPTION 'Exactly one shop settings row is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public."PilotCohort" WHERE "id" = cohort_id) THEN RAISE EXCEPTION 'Cohort not found'; END IF;

  from_at := from_date::timestamp AT TIME ZONE tz;
  to_at := (to_date + 1)::timestamp AT TIME ZONE tz;

  WITH latest_correction AS (
    SELECT DISTINCT ON (c."correctsEventId")
      c."correctsEventId",
      c."toStatus" AS corrected_status,
      c."effectiveAt" AS corrected_effective_at
    FROM public."QueueEvent" c
    WHERE c."type" = 'EVIDENCE_CORRECTION'
      AND c."correctsEventId" IS NOT NULL
    ORDER BY c."correctsEventId", c."recordedAt" DESC, c."sequence" DESC
  ),
  effective_events AS (
    SELECT
      e.*,
      coalesce(lc.corrected_status, e."toStatus") AS factual_status,
      coalesce(lc.corrected_effective_at, e."effectiveAt") AS factual_effective_at
    FROM public."QueueEvent" e
    LEFT JOIN latest_correction lc ON lc."correctsEventId" = e."id"
    WHERE e."type" <> 'EVIDENCE_CORRECTION'
  ),
  base_q AS (
    SELECT *
    FROM public."QueueItem"
    WHERE "pilotCohortId" = cohort_id
      AND "pilotClassification" = 'REAL'
      AND "createdAt" >= from_at
      AND "createdAt" < to_at
  ),
  latest_status AS (
    SELECT DISTINCT ON (e."queueItemId") e."queueItemId", e.factual_status
    FROM effective_events e
    JOIN base_q b ON b."id" = e."queueItemId"
    WHERE e.factual_status IS NOT NULL
    ORDER BY e."queueItemId", e.factual_effective_at DESC, e."sequence" DESC
  ),
  real_q AS (
    SELECT
      b.*,
      coalesce(ls.factual_status, b."status") AS factual_status,
      schedule.factual_start_at
    FROM base_q b
    LEFT JOIN latest_status ls ON ls."queueItemId" = b."id"
    LEFT JOIN LATERAL (
      SELECT e."toStartAt" AS factual_start_at
      FROM effective_events e
      WHERE e."queueItemId" = b."id"
        AND e."type" IN ('QUEUE_CREATED', 'SCHEDULE_CHANGED')
        AND e."toStartAt" IS NOT NULL
        AND b."startedAt" IS NOT NULL
        AND e.factual_effective_at <= b."startedAt"
      ORDER BY e.factual_effective_at DESC, e."sequence" DESC
      LIMIT 1
    ) schedule ON true
  ),
  q AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE "createdBy" = 'CUSTOMER') AS self_service,
      count(*) FILTER (WHERE "createdBy" = 'OWNER') AS owner_created,
      count(*) FILTER (WHERE factual_status IN ('DONE', 'CANCELLED', 'NO_SHOW')) AS terminal,
      count(*) FILTER (WHERE factual_status = 'DONE') AS done,
      count(*) FILTER (WHERE factual_status = 'CANCELLED') AS cancelled,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND factual_status IN ('DONE', 'CANCELLED', 'NO_SHOW')) AS booking_terminal,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND factual_status = 'NO_SHOW') AS booking_no_show,
      count(*) FILTER (WHERE "type" = 'WALK_IN') AS walk_eligible,
      count(*) FILTER (WHERE "type" = 'WALK_IN' AND "quotedEstimatedAt" IS NOT NULL) AS walk_quote,
      count(*) FILTER (WHERE "type" = 'WALK_IN' AND "quotedEstimatedAt" IS NULL) AS walk_missing_quote,
      count(*) FILTER (WHERE "type" = 'WALK_IN' AND "startedAt" IS NULL) AS walk_unstarted,
      count(*) FILTER (WHERE "type" = 'WALK_IN' AND "quotedEstimatedAt" IS NOT NULL AND "startedAt" >= "createdAt") AS walk_valid,
      count(*) FILTER (WHERE "type" = 'WALK_IN' AND "startedAt" IS NOT NULL AND "startedAt" < "createdAt") AS walk_invalid,
      count(*) FILTER (WHERE "type" = 'BOOKING') AS booking_eligible,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND "startedAt" IS NULL) AS booking_unstarted,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND factual_start_at IS NULL) AS booking_missing_schedule,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND factual_start_at IS NOT NULL AND "startedAt" >= "createdAt") AS booking_valid,
      count(*) FILTER (WHERE "type" = 'BOOKING' AND "startedAt" IS NOT NULL AND "startedAt" < "createdAt") AS booking_invalid,
      count(*) FILTER (WHERE "startedAt" IS NULL OR "completedAt" IS NULL) AS duration_missing,
      count(*) FILTER (WHERE "startedAt" IS NOT NULL AND "completedAt" >= "startedAt") AS duration_valid,
      count(*) FILTER (WHERE "startedAt" IS NOT NULL AND "completedAt" IS NOT NULL AND "completedAt" < "startedAt") AS duration_invalid
    FROM real_q
  ),
  classifications AS (
    SELECT pg_catalog.jsonb_object_agg("pilotClassification", n) AS value
    FROM (
      SELECT "pilotClassification", count(*) AS n
      FROM public."QueueItem"
      WHERE "pilotCohortId" = cohort_id AND "createdAt" >= from_at AND "createdAt" < to_at
      GROUP BY 1
    ) values_by_classification
  ),
  sources AS (
    SELECT pg_catalog.jsonb_object_agg("entrySource", n) AS value
    FROM (SELECT "entrySource", count(*) AS n FROM real_q GROUP BY 1) values_by_source
  ),
  queue_types AS (
    SELECT pg_catalog.jsonb_object_agg("type", n) AS value
    FROM (SELECT "type", count(*) AS n FROM real_q GROUP BY 1) values_by_type
  ),
  release_segments AS (
    SELECT pg_catalog.jsonb_object_agg(coalesce("pilotReleaseSegment", 'MISSING'), n) AS value
    FROM (SELECT "pilotReleaseSegment", count(*) AS n FROM real_q GROUP BY 1) values_by_release
  ),
  notif AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE "status" = 'SENT') AS sent,
      count(*) FILTER (WHERE "status" = 'FAILED') AS failed,
      count(*) FILTER (WHERE "status" = 'SKIPPED') AS skipped,
      count(*) FILTER (WHERE "status" = 'SKIPPED' AND "skipReason" = 'NO_CUSTOMER_RECIPIENT') AS skipped_no_customer_recipient,
      count(*) FILTER (WHERE "status" = 'SKIPPED' AND "skipReason" = 'LINE_TOKEN_MISSING') AS skipped_line_token_missing,
      count(*) FILTER (WHERE "status" = 'PENDING' AND "createdAt" >= pg_catalog.clock_timestamp() - interval '10 minutes') AS recent_pending,
      count(*) FILTER (WHERE "status" = 'PENDING' AND "createdAt" < pg_catalog.clock_timestamp() - interval '10 minutes') AS aged_pending,
      count(DISTINCT "businessEventKey") FILTER (WHERE "businessEventKey" IS NOT NULL AND "status" IN ('SENT', 'FAILED')) AS terminal_business_events,
      count(DISTINCT "businessEventKey") FILTER (WHERE "businessEventKey" IS NOT NULL AND "status" = 'SENT') AS successful_business_events
    FROM public."NotificationLog"
    WHERE "pilotCohortId" = cohort_id
      AND "audience" = 'CUSTOMER'
      AND "createdAt" >= from_at
      AND "createdAt" < to_at
  ),
  event_truth AS (
    SELECT
      (SELECT count(*) FROM public."QueueEvent" c WHERE c."pilotCohortId" = cohort_id AND c."type" = 'EVIDENCE_CORRECTION' AND c."recordedAt" >= from_at AND c."recordedAt" < to_at) AS corrections,
      count(DISTINCT e."queueItemId") FILTER (WHERE e."type" IN ('QUEUE_REORDERED', 'SCHEDULE_CHANGED', 'SERVICE_CHANGED', 'OWNER_OVERRIDE')) AS corrected_queues,
      count(*) AS effective_events
    FROM effective_events e
    WHERE e."pilotCohortId" = cohort_id
      AND e.factual_effective_at >= from_at
      AND e.factual_effective_at < to_at
  ),
  walk_stats AS (
    SELECT
      count(*) AS samples,
      percentile_cont(.5) WITHIN GROUP (ORDER BY extract(epoch FROM ("startedAt" - "quotedEstimatedAt")) / 60) AS median_signed,
      percentile_cont(.5) WITHIN GROUP (ORDER BY abs(extract(epoch FROM ("startedAt" - "quotedEstimatedAt")) / 60)) AS median_abs,
      percentile_cont(.75) WITHIN GROUP (ORDER BY abs(extract(epoch FROM ("startedAt" - "quotedEstimatedAt")) / 60)) AS p75_abs,
      percentile_cont(.9) WITHIN GROUP (ORDER BY abs(extract(epoch FROM ("startedAt" - "quotedEstimatedAt")) / 60)) AS p90_abs
    FROM real_q
    WHERE "type" = 'WALK_IN' AND "quotedEstimatedAt" IS NOT NULL AND "startedAt" >= "createdAt"
  ),
  booking_stats AS (
    SELECT
      count(*) AS samples,
      percentile_cont(.5) WITHIN GROUP (ORDER BY extract(epoch FROM ("startedAt" - factual_start_at)) / 60) AS median_signed,
      percentile_cont(.75) WITHIN GROUP (ORDER BY abs(extract(epoch FROM ("startedAt" - factual_start_at)) / 60)) AS p75_abs,
      percentile_cont(.9) WITHIN GROUP (ORDER BY abs(extract(epoch FROM ("startedAt" - factual_start_at)) / 60)) AS p90_abs
    FROM real_q
    WHERE "type" = 'BOOKING' AND factual_start_at IS NOT NULL AND "startedAt" >= "createdAt"
  ),
  duration_stats AS (
    SELECT
      count(*) AS samples,
      percentile_cont(.5) WITHIN GROUP (ORDER BY extract(epoch FROM ("completedAt" - "startedAt")) / 60) AS median_actual_minutes,
      percentile_cont(.75) WITHIN GROUP (ORDER BY extract(epoch FROM ("completedAt" - "startedAt")) / 60) AS p75_actual_minutes,
      percentile_cont(.9) WITHIN GROUP (ORDER BY extract(epoch FROM ("completedAt" - "startedAt")) / 60) AS p90_actual_minutes,
      percentile_cont(.5) WITHIN GROUP (ORDER BY "serviceDurationMinutes") AS median_configured_minutes
    FROM real_q
    WHERE "startedAt" IS NOT NULL AND "completedAt" >= "startedAt"
  )
  SELECT pg_catalog.jsonb_build_object(
    'classification', 'OWNER/OPERATOR ONLY - DO NOT SHARE',
    'shareSafe', false,
    'schemaVersion', 2,
    'generatedAt', pg_catalog.clock_timestamp(),
    'cohort', cohort_id,
    'period', pg_catalog.jsonb_build_object('from', from_date, 'to', to_date),
    'timezone', tz,
    'queue', pg_catalog.to_jsonb(q),
    'classifications', coalesce(classifications.value, '{}'::jsonb),
    'sourceCounts', coalesce(sources.value, '{}'::jsonb),
    'queueTypeCounts', coalesce(queue_types.value, '{}'::jsonb),
    'releaseSegmentCounts', coalesce(release_segments.value, '{}'::jsonb),
    'rates', pg_catalog.jsonb_build_object(
      'selfService', CASE WHEN q.total > 0 THEN q.self_service::numeric / q.total END,
      'ownerManual', CASE WHEN q.total > 0 THEN q.owner_created::numeric / q.total END,
      'completion', CASE WHEN q.terminal > 0 THEN q.done::numeric / q.terminal END,
      'cancellation', CASE WHEN q.terminal > 0 THEN q.cancelled::numeric / q.terminal END,
      'bookingNoShow', CASE WHEN q.booking_terminal > 0 THEN q.booking_no_show::numeric / q.booking_terminal END,
      'quoteCoverage', CASE WHEN q.walk_eligible > 0 THEN q.walk_quote::numeric / q.walk_eligible END,
      'validWaitCoverage', CASE WHEN q.walk_eligible > 0 THEN q.walk_valid::numeric / q.walk_eligible END,
      'correction', CASE WHEN q.total > 0 THEN event_truth.corrected_queues::numeric / q.total END
    ),
    'walkInWait', pg_catalog.to_jsonb(walk_stats),
    'bookingScheduledStart', pg_catalog.to_jsonb(booking_stats),
    'actualServiceDuration', pg_catalog.to_jsonb(duration_stats),
    'customerNotificationTruth', pg_catalog.to_jsonb(notif) || pg_catalog.jsonb_build_object(
      'apiAcceptanceRate', CASE WHEN notif.sent + notif.failed > 0 THEN notif.sent::numeric / (notif.sent + notif.failed) END,
      'uniqueBusinessEventSuccessRate', CASE WHEN notif.terminal_business_events > 0 THEN notif.successful_business_events::numeric / notif.terminal_business_events END
    ),
    'eventTruth', pg_catalog.to_jsonb(event_truth),
    'unavailableFromApp', pg_catalog.jsonb_build_array('adoption denominator', 'off-app fallback', 'repeated questions', 'owner minutes', 'owner confidence')
  ) INTO report
  FROM q, classifications, sources, queue_types, release_segments, notif, event_truth, walk_stats, booking_stats, duration_stats;

  RETURN report;
END
$function$;

ALTER FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) OWNER TO bqa_pilot_function_owner;
ALTER FUNCTION public.bqa_pilot_report_v1(date,date,text) OWNER TO bqa_pilot_function_owner;
REVOKE ALL ON FUNCTION public.bqa_pilot_subject_delete_v1(text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bqa_pilot_report_v1(date,date,text) FROM PUBLIC;
