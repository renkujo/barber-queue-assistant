# Pilot Daily Close R1 data dictionary

This dictionary governs the empty CSV template only. Filled files remain blocked until the external private location, data owner, viewers, MFA, deletion/hold procedure, incident response, and proof-of-deletion method are approved. Never commit filled rows.

## Provenance and identifiers

- `date`: shop-local operating date (`YYYY-MM-DD`).
- `pilot_phase`, `release_segment`: approved fixed measurement labels; no customer identifiers.
- `collector`: bounded operator identity; never the customer or queue identity.
- `collection_method`: `SYSTEM_REPORT`, `OPERATOR_OBSERVATION`, or `OWNER_REPORT`.
- `observation_source`: fixed non-customer source label describing who observed the manual fields.

## Reconciliation

- `app_recorded_real_queue_count`: unique `REAL` app queues from the database report.
- `off_app_fallback_count`: unique real queues handled outside the app at any point.
- `fallback_later_entered_count`: fallback queues later represented in the app; must not exceed `off_app_fallback_count`.
- `reconciled_real_queue_total`: `app_recorded_real_queue_count + off_app_fallback_count - fallback_later_entered_count`.
- `fallback_used`: `true` or `false`.
- `fallback_reason`: empty, `PAPER`, `LINE_LIST`, `PHONE_NOTE`, `MEMORY`, `APP_DOWN`, `OWNER_PREFERENCE`, or `OTHER`.
- `fallback_category_version`: exactly `pilot-r1-v1`.
- `denominator_confidence`: `HIGH`, `MEDIUM`, or `LOW`.

## Operating-day trust

- `shop_open_time`, `shop_close_time`, `reconciliation_closed_at`: shop-local ISO date/time values.
- `operating_day`, `safety_incident`, `trustworthy_data_day`: lowercase `true` or `false`.
- `trustworthy_exclusion_reason`: empty, `CLOSED`, `RECONCILIATION_INCOMPLETE`, `SAFETY_INCIDENT`, `RELEASE_CHANGE`, `MISSING_REQUIRED_DATA`, or `OTHER`.
- `missing_fields`: `NONE` or semicolon-separated exact template column names.
- `close_duration_seconds`: non-negative integer measured by the operator workflow.

## Owner/operator observations

- `repeated_questions_observed`, `owner_queue_minutes_observed`: numeric observations with provenance; do not infer missing values.
- `owner_confidence_1_5`: integer `1` through `5` using the approved anchors.
- `primary_problem_category`: approved fixed non-PII issue category.
- `primary_problem_summary_no_pii`: short operational summary with no name, phone, LINE ID, URL, token, PIN, queue code, note, or other customer identifier.

## Corrections

- `corrects_date`: original shop-local date; populated only by an additive correction row.
- `correction_reason`: bounded non-PII reason. Never overwrite the original row.

Validate the empty template or a candidate file with `pnpm pilot:daily-close:validate -- <path>`. The validator is a structural/allowlist check, not proof that free text is anonymous; a human PII review remains mandatory.
