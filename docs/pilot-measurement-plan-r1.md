# Barber Queue Assistant — Pilot Measurement Plan R1

Status: **human-approved planning contract — 2026-07-22**

This document authorizes no implementation, schema change, pilot execution, customer recruitment, new data collection, external form/sheet, customer-feedback request, or pricing offer. Each requires a separate explicit approval after the relevant P0 readiness, privacy/retention design, owner agreement, implementation, and validation gates pass.

Approval applies to the plan and the resolved decision bundle in Section 15. It does not authorize the implementation sequence in Section 14.

Pilot boundary: one real barber shop, one owner/barber, 1–2 months, and a controlled customer rollout. The repository remains single-shop. Do not onboard another shop until tenant isolation has a separately approved design and migration.

Related operating documents:

- [Real-Shop Pilot Readiness Plan](./pilot-readiness-plan.md)
- [Pilot Operations Runbook](./operations/pilot-operations-runbook.md)
- [Product Data Model](./data-model.md)
- [Deployment Checklist](./deployment-checklist.md)

## 1. Decision this pilot must support

At the end of the pilot, Kiattisak and the shop owner must be able to choose `continue`, `revise`, or `stop` using operational evidence rather than feature-request volume or page views.

The pilot tests four hypotheses:

1. **Operational adoption:** normal queue work can live in the app instead of paper, chat, and owner memory.
2. **Owner value:** the app reduces repeated questions, queue-management time, and avoidable mistakes.
3. **Customer self-service:** customers can create and track queues with less owner assistance.
4. **Commercial value:** the owner experiences enough continuing value to make a real package choice after the free pilot.

The pilot is not a test of multi-shop management, staff scheduling, payments, deposits, loyalty, inventory, marketplace, advertising, or broad product analytics.

## 2. Measurement principles

- Measure workflow outcomes, not surveillance. Page views are not the north-star metric.
- Prefer existing first-party operational records over third-party analytics.
- Never send customer names, phone numbers, LINE IDs, notes, owner notes, queue IDs, access PINs, or public tracking tokens to analytics.
- Never place unsanitized `/queue/<publicToken>` paths into an external analytics service.
- Use fixed enumerations for sources and reasons; do not accept arbitrary campaign text that may contain PII.
- Preserve event history as append-only evidence written atomically with successful business mutations. Corrections create later events rather than rewriting prior events.
- Separate automatic facts, owner estimates, and customer feedback in every report.
- Do not change non-critical product behavior every day. Batch changes so week-to-week evidence remains interpretable.
- A high owner-override count is not automatically a failure. Overrides are expected; the reason and operational outcome matter.

## 3. Success, safety, and learning gates

### Safety gate — must remain true

- Confirmed detected public PII exposure: `0`
- Confirmed detected lost queues: `0`
- Confirmed detected accepted double-booked fixed slots: `0`
- Confirmed detected wrong-queue owner updates: `0`
- Confirmed detected notifications sent to the wrong LINE user: `0`
- Confirmed detected unrecoverable production or backup state: `0`

Detection depends on daily reconciliation, owner reports, notification review, and the technical checks in the readiness/runbook documents. Any safety-gate failure triggers the stop procedure in the Pilot Operations Runbook. Preserve evidence before cleanup or redeploy.

### Adoption gate

- At least `80%` of reconciled unique real queues are recorded in the app during the stable measurement period.
- The owner can operate normal active queues from a phone without a second system.
- Record the number and reason for every paper, phone-note, or LINE-list fallback.
- Review active operating days each week; do not count closed days as non-adoption.

### Customer self-service gate

- Report customer-created queue share separately for bookings and walk-ins.
- Report owner-created/manual queue share and its reasons; manual entry is valid, not automatically a failure.
- Track customer confusion/support questions by category.

### Accuracy and reliability gate

- Median absolute walk-in wait-estimate error is understood and targeted at `≤ 20 minutes` for the first pilot.
- Report P75 and P90 error as diagnostics so a good median cannot hide severe misses.
- Report quote-capture and valid-sample coverage so cancelled, no-show, missing-quote, and unstarted queues do not disappear silently.
- Notification `SENT`, `FAILED`, `PENDING`, and `SKIPPED` are always separate. Current `SENT` means LINE API acceptance, not confirmed customer delivery.
- Uptime and database health incidents are reported independently from user mistakes.

### Owner-value gate

- Compare repeated queue questions and owner queue-management minutes against the baseline.
- Record owner confidence weekly on an anchored 1–5 scale defined in Section 8.
- The strongest signal is whether the owner chooses to continue using the product when the pilot support period ends.

Initial thresholds other than the safety gate and `≤ 20 minute` median error are learning targets, not marketing claims. Re-baseline them after the first complete week of trustworthy data.

## 4. Measurement periods

### Phase 0 — Baseline, 5–7 operating days

Kiattisak owns observation, reconciliation, and report production. The barber should only answer short exception/value questions that cannot be derived automatically. Record the shop's current process before broad app use:

- total queues by day;
- booking, walk-in, and chat/phone/manual mix;
- repeated queue/status questions;
- approximate owner minutes spent arranging or answering queues;
- lost, forgotten, duplicated, or conflicting queues;
- customer wait complaints;
- current paper, chat, phone-note, or memory workflow.

The baseline may be approximate, but its collector, method, observation window, confidence (`HIGH`, `MEDIUM`, or `LOW`), and missing fields must be written down and used consistently for all baseline days.

Baseline record template:

```text
Shop-local date and operating hours:
Collector and observation method:
Unique reconciled real queues:
Booking / walk-in / owner-chat-phone mix:
Repeated queue/status questions:
Approximate queue-management minutes:
Lost / duplicate / conflicting queues:
Paper / chat / phone-note / memory fallback:
Missing fields and confidence: HIGH / MEDIUM / LOW
```

### Phase 1 — Controlled pilot, first 5–7 operating days

- After separate pilot-execution approval, one owner and roughly 10–20 invited customers.
- Keep the existing paper/LINE fallback available.
- Do not broadly publish the QR/rich menu until two consecutive operating days have no lost or duplicate queues.
- Fix P0 safety, privacy, availability, and queue-integrity issues immediately.
- Do not optimize pricing from this phase; first establish trustworthy operation.

### Phase 2 — Workflow validation, weeks 2–4

- Expand QR/LINE use gradually.
- Run one short owner review per week.
- Batch non-critical UX changes into a declared release window.
- Compare complete weeks only after excluding closed days and documented incidents.
- At the end of week 4, choose `continue`, `revise`, or `stop` for month 2.

### Phase 3 — Independent value validation, weeks 5–8

- Reduce hands-on support from Kiattisak so the shop's independent operation can be observed.
- Continue measuring fallback and owner confidence.
- Identify capabilities the owner considers indispensable versus merely convenient.
- Present a separately approved, non-coercive continuation/package decision around week 6; do not rely on an abstract “would you pay?” question.
- Hold the final evidence review after at least two stable weeks without a material workflow change.

## 5. Data inventory and minimum additions

### 5.1 Existing operational evidence

The current database already supports:

| Evidence | Existing source |
| --- | --- |
| Queue volume and booking/walk-in/manual mix | `QueueItem.type`, `QueueItem.createdBy`, `QueueItem.createdAt` |
| Final queue outcome | `QueueItem.status` and terminal timestamps |
| Scheduled, estimated, started, and completed time | `startAt`, `estimatedAt`, `startedAt`, `completedAt` |
| Configured service duration and service mix | queue service snapshots |
| Customer completion/late/no-show/cancel counters | `Customer` counters; corroborative only because lifetime counters are mutable and queue records remain outcome authority |
| LINE attempt outcome | `NotificationLog.channel`, `status`, `type`, `createdAt` |
| Availability and intake configuration | shop, weekly, and date availability records |

Final state alone cannot reconstruct status reversals, reorder frequency, owner corrections, the original wait estimate shown to the customer, acquisition source, fallback use, or incident cause.

### 5.2 Proposed queue-event evidence

Prepare one append-only event owner in the later implementation plan. Exact Prisma names remain subject to technical review.

Minimum logical fields:

| Field | Type/constraint | Purpose |
| --- | --- | --- |
| `id` | generated identifier | Event identity |
| `queueItemId` | queue relation | Queue affected |
| `type` | fixed enum | Event meaning |
| `actor` | `CUSTOMER`, `OWNER`, `SYSTEM` | Who initiated it |
| `recordedAt` | server timestamp | When evidence was written |
| `effectiveAt` | server timestamp | When the business action took effect |
| `sequence` | deterministic per-queue order | Stable event ordering |
| `schemaVersion` | fixed version | Event-contract provenance |
| `idempotencyKey` | unique bounded key | Prevent duplicate event creation on retries |
| `mutationSource` | fixed enum | Server action/job/import owner |
| `fromStatus` | optional status enum | Status transition evidence |
| `toStatus` | optional status enum | Status transition evidence |
| `reason` | optional fixed enum | Why a correction/fallback happened |
| `metadata` | bounded allowlisted JSON or typed columns | Non-PII values only |

Initial event types:

- `QUEUE_CREATED`
- `STATUS_CHANGED`
- `QUEUE_REORDERED`
- `SCHEDULE_CHANGED`
- `SERVICE_CHANGED`
- `OWNER_OVERRIDE`
- `CUSTOMER_CANCELLED`
- `FALLBACK_RECORDED`

Do not store names, phone numbers, LINE IDs, notes, public tokens, access PINs, raw URLs, User-Agent strings, or raw IP addresses in event metadata.

The event and its queue mutation must commit in the same database transaction or neither may commit. Typed columns are preferred; any metadata must have an allowlisted schema, size bound, and explicit PII-negative tests. A factual correction writes a new correction event referencing the prior event ID and never edits the prior record.

### 5.3 Proposed immutable creation evidence

The later implementation plan should decide whether these fields belong on `QueueItem` or in the creation event:

| Field | Allowed values/purpose |
| --- | --- |
| `entrySource` | `LINE`, `SHOP_QR`, `OWNER_SHARED_LINK`, `FACEBOOK`, `INSTAGRAM`, `DIRECT`, `IN_SHOP`, `UNKNOWN` |
| `quotedEstimatedAt` | The estimate displayed immediately after creation |
| `quotedWaitMinutes` | Optional derived/displayed wait duration at creation |

The quoted estimate must not change when the live queue later changes. `UNKNOWN` is valid; do not infer a source from PII or referrer text.

Use controlled links or fixed source parameters only after abuse and spoofing behavior is documented. Source attribution is directional product evidence, not billing-grade truth.

Later notification instrumentation also needs:

| Field | Purpose |
| --- | --- |
| `audience` | Distinguish `CUSTOMER` from `OWNER` attempts |
| `skipReason` | Fixed reason for `SKIPPED` |
| `businessEventKey` | Logical notification/event identity across retries |
| `attemptNumber` | Ordered delivery attempt number |

`PENDING` attempts need an age threshold and explicit incomplete outcome. Do not claim customer delivery without provider delivery evidence.

### 5.4 Manual pilot evidence

Use a small first-party pilot log rather than forcing free-form notes into queue events.

Required logical fields:

| Field | Values |
| --- | --- |
| `date` | Shop-local date |
| `kind` | `INCIDENT`, `FALLBACK`, `OWNER_FEEDBACK`, `CUSTOMER_FEEDBACK`, `SUPPORT_QUESTION` |
| `category` | Fixed category list maintained in the plan |
| `categoryVersion` | Version of the fixed category dictionary |
| `severity` | `INFO`, `FRICTION`, `BLOCKER`, `STOP` |
| `queueItemId` | Optional internal relation; never included in exported reports |
| `summary` | Short non-PII operational description |
| `collector` | Fixed operator identity |
| `collectionMethod` | `OBSERVATION`, `OWNER_REPORT`, `CUSTOMER_REPORT`, `SYSTEM_REVIEW` |
| `resolvedAt` | Optional timestamp |

Recommended categories:

- `QUEUE_MISSING`
- `QUEUE_DUPLICATE`
- `TIME_CONFLICT`
- `WRONG_STATUS`
- `WAIT_ESTIMATE`
- `CUSTOMER_CONFUSION`
- `OWNER_WORKFLOW`
- `LINE_DELIVERY`
- `LOGIN_OR_ACCESS`
- `APP_OR_DATABASE_DOWN`
- `PAPER_OR_CHAT_FALLBACK`
- `OTHER`

Free text must not contain a customer name, phone number, LINE ID, public token, access PIN, note, raw URL, or other customer identifier. Provide redaction guidance and review free text before aggregate reporting.

The implementation review must decide whether this is a protected owner route with least-privilege operator access, an operator-only script/form, or an external private sheet. Do not assume the existing shared owner session is appropriate operator access. Do not silently add a public feedback endpoint.

## 6. Metric definitions

All day and week boundaries use the shop timezone from `ShopSettings` (`Asia/Bangkok` by default). Exclude clearly labelled smoke/test queues from pilot reports; the later implementation must define a reliable exclusion method rather than filtering customer names.

### 6.1 Population and reconciliation contract

- A **real queue** is one genuine customer service intent accepted by the shop for one service occurrence. It exists once even if it moves between paper/chat and the app.
- An **app-recorded real queue** is a real queue represented by one non-test `QueueItem`.
- The **reconciled total** is the independently observed daily real-queue list after matching app entries and fallback entries. Kiattisak owns reconciliation, collector/method provenance, confidence, and missingness.
- A fallback queue entered into the app later remains one real queue. Link it to the prior fallback observation or mark a documented deduplication; never count both records as two real queues.
- Daily reconciliation closes at the next shop-local opening or `12:00` the following day, whichever comes first. A later discovery is a dated correction to the original day, not a queue on the discovery day.
- Customer self-service, owner/manual, fallback, correction, and terminal-outcome shares use **app-recorded real queues** unless the metric explicitly names the reconciled total.
- Adoption alone uses the reconciled total: unique app-recorded real queues / unique reconciled real queues.
- Every manually estimated denominator records `collector`, `method`, `confidence`, and missingness.
- Report by pilot phase/release segment and trustworthy-data day. Split booking and walk-in populations whenever workflow meaning differs.

A **trustworthy-data day** is an operating day with completed reconciliation, known release segment, no unresolved safety incident, and no unexplained missing required fields. Excluded days remain visible with their exclusion reason.

### 6.2 Metrics

| Metric | Definition |
| --- | --- |
| Recorded-queue adoption | Unique app-recorded real queues / unique reconciled real queues |
| Customer self-service share | `createdBy=CUSTOMER` app-recorded real queues / all app-recorded real queues |
| Owner/manual share | `createdBy=OWNER` app-recorded real queues / all app-recorded real queues |
| Completion rate | `DONE` app-recorded real queues / terminal app-recorded real queues |
| Cancellation rate | `CANCELLED` app-recorded real queues / terminal app-recorded real queues |
| No-show rate | `NO_SHOW` booking queues / terminal booking queues |
| Actual service minutes | `completedAt - startedAt` when both exist and order is valid |
| Walk-in wait signed error | `startedAt - quotedEstimatedAt` for eligible walk-ins |
| Walk-in wait absolute error | Absolute value of walk-in signed error |
| Booking scheduled-start deviation | `startedAt - startAt` for eligible bookings; never merge with walk-in wait error |
| Quote-capture coverage | Eligible queues with immutable quote / all eligible queues |
| Valid wait-sample coverage | Eligible queues with valid start + quote / all eligible queues |
| LINE API acceptance rate | Customer-audience `SENT / (SENT + FAILED)` eligible attempts; not confirmed delivery |
| Unique LINE business-event API success | Eligible customer `businessEventKey` values with at least one `SENT` attempt / all eligible customer business events with a terminal attempt |
| Notification skipped share | Customer-audience `SKIPPED / all customer attempts`, split by fixed skip reason |
| Pending/incomplete share | Customer-audience aged `PENDING / all customer attempts` using the approved age threshold |
| App-recorded fallback rate | App-recorded real queues with at least one fallback event / all app-recorded real queues |
| Reconciled off-app fallback rate | Unique reconciled real queues handled outside the app at any point / unique reconciled real queues |
| Correction rate | App-recorded real queues with reorder/schedule/service/override events / all app-recorded real queues |
| Repeated-question change | Pilot count versus baseline, normalized both per operating hour and per reconciled real queue |
| Owner-time change | Pilot queue-management minutes versus baseline, normalized both per operating hour and per reconciled real queue |

Guardrails:

- Never create a duration from missing or reversed timestamps.
- Report the valid sample count beside every time metric.
- Report eligible, quote-captured, valid, cancelled, no-show, unstarted, missing-quote, and invalid-timestamp counts so survivorship bias is visible.
- Do not treat unresolved active queues as terminal failures.
- Do not combine bookings and walk-ins when the denominator changes the meaning.
- Show median plus P75/P90 for wait error; averages alone are insufficient.
- Separate configured service duration from actual service duration.
- A notification retry must share one `businessEventKey`, increment `attemptNumber`, and never inflate unique business-event counts.

## 7. Daily close template

Kiattisak—not the barber—owns database reconciliation, categorization, and report production. All database-derived values must be prefilled. The owner's close should ask only about exceptions the system cannot know plus one confidence/value response.

```text
วันที่:
เปิดร้านจริงหรือไม่: ใช่ / ไม่ใช่
[ระบบเติมให้] จำนวนคิวในระบบและสถานะรวม:
มีคิวจริงที่ไม่อยู่ในระบบหรือไม่: ไม่มี / มี (จำนวนโดยประมาณ)
วันนี้ต้องกลับไปใช้กระดาษ/LINE/ความจำแทนระบบหรือไม่: ไม่มี / มี
มีเหตุร้ายแรง เช่น คิวหาย ซ้ำ ชน หรืออัปเดตผิดคนหรือไม่: ไม่มี / มี
ความมั่นใจต่อระบบวันนี้ (1–5):
ถ้ามี ระบุปัญหาสำคัญที่สุดหนึ่งเรื่องโดยไม่ใส่ข้อมูลลูกค้า:
```

Time the close task and record missing answers. If the median completion time exceeds three minutes or missingness is high, simplify the form or sample the observation on declared days rather than adding owner burden.

## 8. Weekly owner review

Keep the conversation to roughly 20 minutes:

1. สัปดาห์นี้ระบบลดงานตรงไหนมากที่สุด
2. ตรงไหนทำให้ช้าหรือทำให้อยากกลับไปใช้วิธีเดิม
3. มีเหตุการณ์ใดที่ทำให้ไม่กล้าเชื่อระบบ
4. ถ้าตัดได้หนึ่งอย่างหรือเพิ่มได้หนึ่งอย่าง จะเลือกอะไร

Also record:

- confidence score, 1–5, using these anchors:
  - `1` — ไม่กล้าใช้เป็นระบบหลัก;
  - `2` — ต้องตรวจซ้ำหรือใช้ระบบสำรองบ่อย;
  - `3` — ใช้ได้แต่ยังมีจุดที่ต้องระวัง;
  - `4` — เชื่อถือได้สำหรับงานปกติ;
  - `5` — ใช้เป็นระบบหลักได้โดยไม่ต้องตรวจซ้ำในงานปกติ;
- whether the app was the primary queue record;
- fallback count and dominant reason;
- one change to test next week, if any;
- whether the next week remains comparable or begins a new measurement segment.

Feature requests enter a backlog scored by frequency, operational impact, existing workaround, and evidence of continuing/payment value. One request from one conversation is not automatically a roadmap priority.

## 9. Customer feedback

Ask only after a real completed or terminal queue and keep it optional:

1. การจองหรือรับคิวง่ายแค่ไหน — `1–5`
2. เวลารอใกล้เคียงกับที่แจ้งหรือไม่ — `ใกล้เคียง / เร็วกว่ามาก / ช้ากว่ามาก / ไม่เห็นเวลา`
3. มีจุดไหนที่ไม่เข้าใจ — optional short answer

For every feedback period, record eligible, invited, responded, response rate, queue outcome, and collection channel. Keep response identity separate from aggregate reporting where possible. Report findings as voluntary-response evidence, not representative customer sentiment.

Do not collect marketing consent implicitly through operational feedback. Do not make feedback submission a condition for viewing queue status.

## 10. Change and reporting cadence

### Immediate changes

Deploy immediately only for:

- PII/privacy exposure;
- queue loss/duplication/wrong-target updates;
- accepted fixed-slot conflicts;
- login, database, or public availability blockers;
- notification delivery to the wrong recipient.

### Batched changes

Usability, copy, layout, estimate tuning, and convenience changes should normally ship in one declared weekly window. Record the release timestamp and affected hypothesis so pre/post evidence is not blended silently.

### Weekly report

The report should contain:

- operating days, trustworthy-data days, exclusions, phase, and release segment;
- queue mix and adoption;
- self-service/manual shares;
- terminal outcomes;
- walk-in wait error and booking scheduled-start deviation separately, each with capture/valid coverage, exclusions, median/P75/P90, and sample count;
- actual versus configured service duration;
- customer-audience LINE attempt-level API acceptance, unique-business-event API success, `PENDING`, and `SKIPPED` outcomes without claiming confirmed delivery;
- corrections, fallback, incidents, and support questions;
- repeated questions and owner minutes versus baseline, normalized per operating hour and reconciled real queue;
- owner confidence and one qualitative takeaway;
- feedback eligible/invited/responded counts and voluntary-response warning;
- changes shipped during the week;
- recommendation for the next week.

Export only aggregate values. Because one-shop small cells can still identify a customer, suppress or coarsen small cells in shared reports; otherwise keep the entire report owner/operator-only. Any row-level operational review stays behind separately approved least-privilege access.

## 11. Privacy, retention, and access

- The existing customer-data retention default is `180` days and the retention job runs monthly during pilot after backup and dry-run review.
- The current prune job does not cover proposed events or feedback. Before any collection, extend and test pruning/anonymization for every new table, remove queue links when their parent data is anonymized/deleted, define customer-deletion behavior, and verify backup expiry.
- Pilot events and feedback need an explicit retention decision in the implementation plan. Recommended starting point: keep row-level pilot evidence only through the pilot plus `90` days for review, then retain only reports that pass a small-cell re-identification review.
- A safety incident may create a narrowly scoped legal/incident hold with reason, approver, affected records, start date, and expiry/review date. It must not silently suspend deletion for unrelated data.
- Only the shop owner and Kiattisak should see row-level pilot evidence during the single-shop pilot, through separately defined least-privilege identities. Do not share the owner's passcode/session as operator access.
- Customer operational data must not be sold, used for ads, or treated as model-training data.
- Update `/privacy` before collecting source attribution, linked feedback, queue events, or any other newly approved customer-linked category.
- Backups inherit the same sensitivity as production data and must remain private with controlled retention.

If an external private form/sheet is selected, approval must specify account owner, allowed viewers, MFA/access controls, fields, PII prohibition, export behavior, backup behavior, deletion schedule, incident handling, and proof of deletion. No external tool is approved by this document.

The exact legal disclosure and consent wording requires human review before launch; this document defines product boundaries, not legal advice.

## 12. Commercial experiment

The pilot itself is free for a declared period. The owner should know from the beginning that continuation may be discussed; do not surprise the shop with a charge after operational dependence forms. Any result from one owner is directional one-shop evidence, not pricing validation.

Preferred model to test: **Free Core + Optional Pro**.

Only after separate owner agreement and pricing-offer approval, around week 6 present a real but reversible choice such as:

- `Basic — free`: core daily queue, customer queue creation, tracking, and essential reliability;
- `Pro — candidate price`: optional automation, richer LINE operations, reports, customization, or support;
- annual equivalent: only if the owner prefers annual payment.

The previously discussed `299 THB/month` is a research anchor, not an approved price. Final packaging must follow observed value and actual operating cost.

“Reversible” requires:

- no retroactive charge;
- no loss of existing queue records or essential reliability for declining;
- clear export/offboarding and retention behavior;
- no service penalty for declining;
- no payment, discount, or continued access conditioned on favorable feedback.

If Kiattisak decides not to charge shops monthly, evaluate optional one-time setup/onboarding, usage-based LINE add-ons, future deposit/payment transaction fees, custom branding/reporting, or optional support. Do not use customer-data sales or intrusive advertising.

Commercial evidence to record:

- which plan the owner actually chooses;
- the single capability that justifies the choice;
- the price objection, if any;
- whether annual versus monthly changes the decision;
- whether continued use depends on ongoing manual support from Kiattisak.

Record only the owner's freely given package decision. Do not interpret politeness, pilot participation, or dependence created during the pilot as willingness to pay.

## 13. End-of-pilot decision

### Continue

Choose `continue` when safety gates hold, the app is the primary queue record for normal cases, the owner independently receives clear value, and the next commercial/product hypothesis is specific.

### Revise

Choose `revise` when the shop wants to continue but one or two repeatable workflow failures prevent primary-system use. Record the bounded revision and run another stable measurement period.

### Stop

Choose `stop` when safety cannot be trusted, the owner consistently returns to the old process, support burden exceeds owner value, or the product solves an infrequent/non-costly problem.

Do not label a pilot successful only because the owner is polite, customers liked the UI, or the system accumulated many records.

## 14. Proposed implementation order after plan approval

Plan approval still authorizes no implementation, pilot operation, or data collection. After approval, prepare a separate scoped implementation plan in this order:

1. Define smoke/test-data exclusion without using customer names.
2. Define the reconciliation identity/deduplication method and trustworthy-data-day rules.
3. Add immutable creation evidence and transactional append-only queue events with idempotency, ordering, provenance, and PII-negative tests.
4. Add customer-versus-owner notification audience, fixed skip reason, business-event identity, attempt number, and aged-`PENDING` behavior.
5. Define least-privilege operator access and add a protected minimal incident/daily-close capture path, or separately approve a secured external private template.
6. Add aggregate weekly-report queries/export with population, coverage, small-cell, and PII-negative tests.
7. Extend privacy disclosure, customer deletion, retention pruning, scoped holds, and backup expiry for every final approved field/table.
8. Validate that owner close time stays at or below three minutes with acceptable missingness; simplify before launch if it does not.
9. Run migration, integration, security/privacy, production-build, backup, restore, and retention validation.
10. Complete the existing P0 pilot-readiness checklist and obtain separate pilot-execution/owner agreement before inviting customers.

No external analytics SDK, multi-tenant work, pricing UI, payment flow, public feedback endpoint, or broad dashboard is part of the minimum pilot instrumentation slice.

## 15. Human-approved decision bundle

Kiattisak approved this bundle on 2026-07-22:

1. **Daily Close ownership:** use a private operator-owned template for the first shop. Do not add Daily Close to the authenticated owner UI in the minimum instrumentation slice. Kiattisak owns reconciliation/reporting and asks the barber only for exception/value signals.
2. **Row-level retention:** retain approved row-level pilot evidence through the pilot plus `90` days, subject to scoped incident holds; after that retain only aggregate reports that pass small-cell re-identification review.
3. **First-shop entry sources:** `LINE`, `SHOP_QR`, `OWNER_SHARED_LINK`, `IN_SHOP`, and `UNKNOWN`. Do not expose unused Facebook/Instagram sources until those channels are actually deployed and separately reviewed.
4. **Commercial anchor:** test a monthly Pro anchor first. Discuss an annual equivalent only if the owner expresses interest; no annual offer is part of the first test by default.
5. **Operator access:** Kiattisak must use a separate least-privilege operator/reporting identity or workflow. The shop owner's passcode/session must not be shared or reused as operator access.
6. **Fallback reconciliation:** use an operator-owned daily record containing only the fallback count, fixed reason/category, collector/method provenance, and confidence. Do not collect customer identity or PII merely to reconcile the count. Match a fallback to a later app queue only through a separately approved non-PII reconciliation mechanism.

These decisions resolve the planning questions but do not select an external tool, create credentials, approve a data-collection form, or authorize schema/code work. Those details belong to the separately reviewed implementation plan.
