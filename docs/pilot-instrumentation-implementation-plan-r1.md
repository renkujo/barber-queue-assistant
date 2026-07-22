# Barber Queue Assistant — Pilot Instrumentation Implementation Plan R1

Status: **Slices A–F implemented locally — 2026-07-22; measurement disabled; pre-collection approval pending**

Authority:

- [Human-approved Pilot Measurement Plan R1](./pilot-measurement-plan-r1.md)
- [Real-Shop Pilot Readiness Plan](./pilot-readiness-plan.md)
- [Pilot Operations Runbook](./operations/pilot-operations-runbook.md)

This document proposed the implementation sequence. Kiattisak separately authorized Slices A–F on 2026-07-22, and the local implementation described below was executed without enabling measurement, collecting real data, selecting external storage, recruiting customers, presenting pricing, committing, or pushing.

Collection enablement and pilot execution remain separately blocked by Section 17.

Kiattisak separately authorized **Pre-Collection Operational Validation R1** on 2026-07-22 with measurement required to remain disabled. Synthetic role lifecycle and portable backup/restore reconciliation passed; see [`evidence/pilot-precollection-operational-r1.md`](./evidence/pilot-precollection-operational-r1.md). Real production, R2, external-storage, enablement, and pilot-execution gates remain blocked.

## Implementation receipt — 2026-07-22

Implemented locally:

- additive Prisma schema and six pilot migrations for cohorts, operation ledger, typed events, scoped holds, immutable quotes/source/classification, bounded database procedures, append-only enforcement, corrected reporting, and nullable enabled-only notification attempt fields;
- disabled-by-default config and health truth;
- source propagation, operation IDs, enabled-mode creation/status/restore/reorder/edit evidence, date locks, duplicate-operation convergence, and exact owner/customer action preservation;
- enabled-only at-most-once LINE attempt ownership with honest aged `PENDING` semantics;
- cohort/classification/hold/correction/subject/report/retention scripts, role-provisioning SQL, Daily Close template, privacy and deployment/operations docs;
- integration and E2E coverage including disabled no-collection, idempotent creation, status/demotion truth, notification ownership, source validation, corrected report truth, token-revoking subject deletion, scoped retention, append-only enforcement, and retry-flow stability.

Validated:

- Prisma generate/validate: PASS;
- current local migration deploy and clean disposable `14`-migration deploy: PASS;
- TypeScript and ESLint: PASS;
- integration: `81/81` PASS across `14` files;
- Playwright: `65/65` PASS;
- production build: PASS;
- operator script syntax and `git diff --check`: PASS;
- isolated bounded-role provisioning and negative grants: PASS;
- previous committed client `8179145` against all current migrations: `32/32` repository/notification tests PASS;
- disposable validation databases: removed; temporary login roles returned to `NOLOGIN`;
- port 3000 closed after validation.

Still blocked before collection:

- provision, rotate, and revoke real bounded operator roles/credentials in the production private network;
- approve the filled Daily Close storage location, viewers, MFA/access, deletion/hold, and proof-of-deletion procedure;
- verify real R2 14-day lifecycle/manual-backup expiry and isolated restore + current re-pruning;
- repeat old-image smoke in the deployment environment before rollout;
- human review of exact migration, Thai privacy copy, operator/report output, retention/deletion evidence, and rollback packet;
- separate measurement enablement approval and separate owner agreement/pilot-execution approval.

## 1. Outcome

Build the smallest first-party instrumentation layer that can produce trustworthy one-shop pilot evidence while preserving accepted queue rules, customer-visible outcomes, owner action priority, and privacy boundaries.

The implementation must:

1. preserve every accepted booking, walk-in, queue ordering, status, conflict, availability, notification-eligibility, authentication, redirect, and fallback condition;
2. capture immutable queue-creation evidence and transactional queue events only when pilot measurement is explicitly enabled;
3. distinguish customer and owner LINE attempts without claiming confirmed delivery;
4. produce aggregate operator reports without exposing row-level customer data through HTTP;
5. keep Daily Close/reconciliation outside the owner UI for the first shop;
6. extend privacy, retention, health, tests, backup/restore, and rollback evidence before pilot execution.

The plan distinguishes protected product behavior from intentional internal correctness changes:

- **Must not change:** which queues are accepted/rejected, status meanings, owner actions, order rules, availability precedence, estimate formula, notification recipients/types/copy, public privacy, and route outcomes.
- **Intentionally corrected only when measurement is enabled:** failed booking no longer leaves an incidental customer write; same-date concurrent mutations become deterministic; notification logs gain an internal at-most-once `PENDING` lifecycle.
- **Disabled fast path:** follows the current repository and final-only notification behavior so deploying the additive schema with measurement off does not silently change operation.

These named internal corrections require explicit implementation approval; they are not smuggled under a “no behavior change” claim.

## 2. Explicit non-goals

- No analytics SDK, page-view tracking, referrer storage, fingerprinting, raw IP/User-Agent storage, or public tracking-token capture.
- No owner analytics dashboard, Daily Close route, public feedback endpoint, pricing UI, payment/deposit flow, or customer-marketing consent.
- No multi-shop/tenant, multi-staff, marketplace, loyalty, inventory, or retry worker.
- No change to the current queue status set, queue-ordering conditions, owner override truth, wait-estimation algorithm, LINE message copy, or public masking/access-PIN behavior.
- No automatic matching of off-app fallback records to customers or queues in R1.
- No filled pilot log, row-level export, credential, or production data committed to git.
- No commercial-choice telemetry. A future offer remains separately approved: monthly Pro anchor first, annual only if the owner expresses interest, with no retroactive charge, coercion, payment flow, or adverse treatment for declining.

## 3. Current repo reality

### Queue mutations

Authoritative queue writes currently live in `app/src/lib/queue/repository.ts` and are called by server actions:

- `createBooking` ← `app/src/app/book/actions.ts`
- `createWalkIn` ← `app/src/app/walk-in/actions.ts`
- `createOwnerWalkIn` ← `app/src/app/owner/actions.ts`
- `updateQueueItemStatus`
- `restoreClosedQueueItem`
- `reorderQueueItem`
- `updateQueueItem`

Walk-in creation already uses one PostgreSQL advisory transaction lock for serialized estimates. Status, restore, reorder, and owner edit already use transactions for their write sets, but several pre-write reads happen outside the transaction. Booking creates the customer and queue outside one shared transaction. Instrumentation cannot be bolted onto server actions after the fact because the approved event must commit atomically with the successful business mutation.

`updateQueueItemStatus(IN_PROGRESS)` may also move another in-progress queue back to `WAITING`; that system-caused transition must receive its own event rather than disappearing behind the selected queue's event.

### Notifications

`app/src/lib/notifications/queue-notifications.ts` currently creates final `SENT`, `FAILED`, or `SKIPPED` logs. Customer and owner attempts share the same table without an audience field. `SENT` means the LINE push endpoint returned success; it is not provider-confirmed customer delivery. There is no retry worker and none is proposed.

### Authentication and operator access

The app has one owner passcode/session in `app/src/lib/admin-auth.ts`. It has no separate operator identity and must not expose reports through that shared owner session. R1 therefore uses a non-HTTP operator workflow: scripts run only by Kiattisak through the protected local/deployment operations environment. No reporting route or owner navigation item is added.

### Privacy and retention

`app/scripts/prune-customer-data.mjs` currently anonymizes old queue/notification details, deletes eligible orphan customers, and removes old rate-limit buckets. It knows nothing about proposed queue events, pilot cohort/classification fields, or scoped evidence holds. `/privacy` already states that operational data is used to investigate problems and improve wait accuracy, but it must name the final new source/event categories and the approved pilot retention period before collection starts.

## 4. Configuration and collection gate

Add these non-secret settings:

```env
PILOT_MEASUREMENT_ENABLED=false
PILOT_COHORT_ID=
PILOT_RELEASE_SEGMENT=
PILOT_EVIDENCE_DELETE_AFTER=
```

Operator commands receive separate secret credentials only in the protected execution environment, never through public/client configuration and never committed:

```env
PILOT_REPORT_DATABASE_URL=<read-only reporting role>
PILOT_OPERATOR_DATABASE_URL=<bounded cohort/classification/hold/correction/subject role>
PILOT_RETENTION_DATABASE_URL=<approved retention-procedure role>
PILOT_OPERATOR_ID=<fixed non-customer operator label>
```

Rules:

- Default is disabled in code, `.env.production.example`, and Compose.
- Before enablement, `pilot:cohort` creates one immutable `PilotCohort` row whose expiry is the approved pilot end date plus exactly `90` days, interpreted at the end of that shop-local date and stored as UTC.
- Enabling requires non-empty bounded `PILOT_COHORT_ID`, `PILOT_RELEASE_SEGMENT`, a valid future `PILOT_EVIDENCE_DELETE_AFTER=YYYY-MM-DD`, and an existing cohort row whose immutable expiry matches that date exactly.
- Allowed IDs match `^[a-z0-9][a-z0-9-]{0,47}$`; they are operational labels, never customer data.
- Add `app/src/lib/pilot/config.ts` as the single parser/owner.
- When disabled, an explicit fast path preserves current queue and final-only notification behavior. `entrySource` stays `UNKNOWN`; pilot cohort/release/quote fields remain null; notification pilot fields remain null; no operation ledger or `QueueEvent` is created.
- When enabled but invalidly configured, `/api/health` returns `503` with a non-secret `pilotMeasurement: "misconfigured"` status. Queue mutation functions also fail before writes so incomplete evidence cannot silently enter a trustworthy segment.
- An enabled cohort at or beyond expiry is misconfigured and cannot collect new evidence. A later pilot uses a new cohort row and expiry rather than extending an old row in place.
- To protect shop operation, the documented emergency rollback is to close online intake, record an incident, set measurement disabled, redeploy, run smoke checks, and reopen. The affected day is not trustworthy measurement data.

The migration can deploy while measurement remains disabled. Enabling collection is a separate later pilot-execution action. Expiry extension requires a fresh explicit human approval and a new reviewed cohort amendment; operator scripts cannot extend it silently.

## 5. Proposed schema

Exact generated SQL must be reviewed before execution. New columns are nullable or have backward-compatible defaults so old application code can run against the expanded database during rollback.

### 5.1 Enums

```prisma
enum QueueEntrySource {
  LINE
  SHOP_QR
  OWNER_SHARED_LINK
  IN_SHOP
  UNKNOWN
}

enum PilotQueueClassification {
  PRE_PILOT
  REAL
  TEST_SMOKE
  TRAINING
  EXCLUDED_OTHER
}

enum QueueEventType {
  QUEUE_CREATED
  STATUS_CHANGED
  QUEUE_RESTORED
  QUEUE_REORDERED
  SCHEDULE_CHANGED
  SERVICE_CHANGED
  OWNER_OVERRIDE
  EVIDENCE_CORRECTION
}

enum QueueEventActor {
  CUSTOMER
  OWNER
  SYSTEM
  OPERATOR
}

enum QueueEventMutationSource {
  PUBLIC_BOOKING
  PUBLIC_WALK_IN
  OWNER_WALK_IN
  OWNER_STATUS_ACTION
  OWNER_RESTORE_ACTION
  OWNER_REORDER_ACTION
  OWNER_EDIT_ACTION
  OPERATOR_CORRECTION
}

enum QueueEventReason {
  CREATED
  OWNER_REQUEST
  REPLACED_IN_PROGRESS
  RESTORED
  REORDER_UP
  REORDER_DOWN
  REORDER_BOTTOM
  SCHEDULE_EDIT
  SERVICE_EDIT
  DETAILS_EDIT
  EVIDENCE_CORRECTION
}

enum QueueEventRole {
  PRIMARY
  AUTO_DEMOTION
  CORRECTION
}

enum QueueReorderIntent {
  UP
  DOWN
  BOTTOM
}

enum QueueMutationOutcome {
  APPLIED
  NO_OP
}

enum NotificationAudience {
  CUSTOMER
  OWNER
}

enum NotificationSkipReason {
  NO_CUSTOMER_RECIPIENT
  NO_OWNER_RECIPIENT
  LINE_TOKEN_MISSING
}
enum EvidenceHoldReason {
  INCIDENT
  CUSTOMER_DISPUTE
  LEGAL
}
```

No `CUSTOMER_CANCELLED` event is added because the current product has no customer-cancel mutation. Add it only with a future approved customer-cancel feature.

### 5.2 Pilot cohort and QueueItem additions

```prisma
model PilotCohort {
  id                String                   @id
  evidenceExpiresAt DateTime
  createdAt         DateTime                 @default(now())
  queueItems        QueueItem[]
  operations        QueueMutationOperation[]
  events            QueueEvent[]
  notificationLogs  NotificationLog[]
}

// Add to QueueItem
entrySource          QueueEntrySource         @default(UNKNOWN)
quotedEstimatedAt    DateTime?
quotedWaitMinutes    Int?
pilotClassification PilotQueueClassification @default(PRE_PILOT)
pilotCohortId        String?
pilotCohort          PilotCohort?             @relation(fields: [pilotCohortId], references: [id], onDelete: Restrict)
pilotReleaseSegment String?
queueEvents          QueueEvent[]
pilotOperations      QueueMutationOperation[] @relation("PrimaryQueueOperation")
evidenceHolds        EvidenceHold[]
```

Rules:

- Existing rows backfill to `UNKNOWN` + `PRE_PILOT` with null cohort/release/quote fields.
- When measurement is enabled, genuine app-created queues use `REAL` plus the configured cohort/release.
- `quotedEstimatedAt` and `quotedWaitMinutes` are written once for walk-ins from the same captured `now` and server-assigned `estimatedAt`; they are never changed by later queue edits.
- Add SQL checks that quote fields are paired and `quotedWaitMinutes >= 0`.
- Bookings leave quoted wait fields null. Booking scheduled-start deviation resolves the latest factual schedule event effective before service start.
- Owner-created queues default to `UNKNOWN`; do not claim `IN_SHOP` when the existing owner route may also represent chat/phone entry.
- `pilotClassification` is never accepted from a public or owner form.
- `PilotCohort.evidenceExpiresAt` is immutable after creation. Multiple cohorts retain independent expiries.

### 5.3 Queue mutation operation ledger

Events are not the idempotency ledger. Add one operation row for every accepted enabled-mode mutation, including no-op actions:

```prisma
model QueueMutationOperation {
  id                  String                    @id // validated UUID operationId
  mutationSource      QueueEventMutationSource
  primaryQueueItemId  String?
  primaryQueueItem    QueueItem?                @relation("PrimaryQueueOperation", fields: [primaryQueueItemId], references: [id], onDelete: SetNull)
  outcome             QueueMutationOutcome?
  pilotCohortId        String
  pilotCohort          PilotCohort               @relation(fields: [pilotCohortId], references: [id], onDelete: Restrict)
  pilotReleaseSegment String
  createdAt            DateTime                  @default(now())
  completedAt          DateTime?
  events               QueueEvent[]
  notifications        NotificationLog[]

  @@index([pilotCohortId, createdAt])
  @@index([primaryQueueItemId, createdAt])
}
```

The global operation UUID is reserved before any business write in the same transaction. It is independent of a generated queue ID, so concurrent duplicate creation requests converge on one operation/result.

### 5.4 QueueEvent

```prisma
model QueueEvent {
  id                  String                   @id @default(cuid())
  operationId         String
  operation           QueueMutationOperation   @relation(fields: [operationId], references: [id], onDelete: Cascade)
  role                QueueEventRole
  eventOrdinal        Int
  queueItemId         String
  queueItem           QueueItem                @relation(fields: [queueItemId], references: [id], onDelete: Cascade)
  type                QueueEventType
  actor               QueueEventActor
  mutationSource      QueueEventMutationSource
  reason              QueueEventReason?
  schemaVersion       Int                      @default(1)
  sequence            Int
  effectiveAt         DateTime
  recordedAt          DateTime                 @default(now())
  pilotCohortId        String
  pilotCohort          PilotCohort              @relation(fields: [pilotCohortId], references: [id], onDelete: Restrict)
  pilotReleaseSegment String
  fromStatus          QueueItemStatus?
  toStatus            QueueItemStatus?
  fromStartAt         DateTime?
  toStartAt           DateTime?
  fromEstimatedAt     DateTime?
  toEstimatedAt       DateTime?
  fromArrivedAt       DateTime?
  toArrivedAt         DateTime?
  fromStartedAt       DateTime?
  toStartedAt         DateTime?
  fromCompletedAt     DateTime?
  toCompletedAt       DateTime?
  fromCancelledAt     DateTime?
  toCancelledAt       DateTime?
  fromNoShowAt        DateTime?
  toNoShowAt          DateTime?
  fromServiceId       String?
  toServiceId         String?
  reorderIntent       QueueReorderIntent?
  correctsEventId     String?
  correctsEvent       QueueEvent?               @relation("QueueEventCorrection", fields: [correctsEventId], references: [id], onDelete: SetNull)
  corrections         QueueEvent[]               @relation("QueueEventCorrection")

  @@unique([operationId, eventOrdinal])
  @@unique([queueItemId, sequence])
  @@index([pilotCohortId, effectiveAt])
  @@index([queueItemId, effectiveAt])
  @@index([recordedAt])
}
```

No free-form JSON/text metadata is included. All evidence fields are typed and PII-negative.

`eventOrdinal` is deterministic within one operation: primary event first, auto-demotions ordered by queue ID, then schedule, service, details, or correction events in the fixed implementation order. This permits one owner edit to emit multiple typed events for the same queue while preventing duplicate event replay.

`EVIDENCE_CORRECTION` is created only by a bounded operator script. It references the prior event through the self-relation, stores corrected typed facts in the same typed columns, never edits the original event, and is resolved by reports as the latest valid correction. Business reorder/edit events remain operational events and are never mislabeled as evidence corrections.

### 5.5 NotificationLog additions

```prisma
audience         NotificationAudience?
skipReason       NotificationSkipReason?
businessEventKey String?
attemptNumber    Int?
pilotCohortId    String?
pilotCohort      PilotCohort?          @relation(fields: [pilotCohortId], references: [id], onDelete: Restrict)
operationId      String?
operation        QueueMutationOperation? @relation(fields: [operationId], references: [id], onDelete: SetNull)

@@unique([businessEventKey, audience, attemptNumber])
@@index([audience, status, createdAt])
@@index([pilotCohortId, createdAt])
```

Migration/collection rules:

- Existing and disabled-mode rows keep all pilot fields null; do not infer audience from nullable customer fields.
- Enabled-mode writes set `CUSTOMER` or `OWNER`, cohort, operation ID, business-event key, and attempt `1`.
- The first implementation has only attempt `1`; no retry worker/UI is authorized.
- Retention resets nullable pilot fields to null. Existing message content remains under the current customer-data retention rule.

### 5.6 Scoped retention hold

Add one minimal operator-owned table so a dispute does not pause deletion for unrelated records:

```prisma

model EvidenceHold {
  id          String             @id @default(cuid())
  queueItemId String
  queueItem   QueueItem          @relation(fields: [queueItemId], references: [id], onDelete: Restrict)
  reason      EvidenceHoldReason
  approvedBy  String
  startsAt    DateTime           @default(now())
  expiresAt   DateTime
  releasedAt  DateTime?
  createdAt   DateTime           @default(now())

  @@index([queueItemId])
  @@index([expiresAt, releasedAt])
}
```

`approvedBy` is a fixed bounded operator label, not a customer identifier. Holds are created/released only through a separately guarded operator script with dry-run output; no HTTP route is added.

- Default and maximum hold duration is `30 days`.
- Review active holds weekly.
- Extension requires fresh explicit human approval and creates an audit record; the script cannot silently extend.
- `onDelete: Restrict` prevents queue deletion from erasing a hold. Deletion/prune paths must check active holds before touching queue-linked evidence.

## 6. Operation IDs and event atomicity

### 6.1 Form operation ID

Every instrumented mutation receives one UUID `operationId` rendered once with its form and validated server-side:

- booking and walk-in pages generate and pass it into their client form components;
- each concrete owner action form gets its own ID: every status form, confirmation dialog, restore form, each reorder intent, edit form, and owner walk-in form;
- Zod/action validation rejects missing or malformed IDs while measurement is enabled;
- when measurement is disabled, an absent ID follows current behavior for backward compatibility during rollback.

For `useActionState` booking/walk-in forms, generate once per mounted form instance, preserve the ID after action-state errors, and generate a new ID only after successful navigation/new form rendering. Server-rendered IDs must never be shared through static prerendering.

The browser cannot choose event type, actor, cohort, release, classification, outcome, or typed before/after values. Those are derived on the server. Notification code receives the repository-validated operation ID, never raw `FormData`.

### 6.2 Atomic repository contract

Add `app/src/lib/pilot/events.ts` with transaction-only helpers. For enabled measurement:

1. insert `QueueMutationOperation(id=operationId)` before any business write;
2. if the global UUID already exists, wait for the winning transaction, then require the stored mutation source and intended target to match; mismatch is rejected as invalid reuse, while a match returns the recorded result without applying another write;
3. acquire all affected shop-date locks in ascending date order;
4. acquire target queue row locks in ascending queue-ID order and re-read status/date/eligibility;
5. re-run existing slot/conflict/order validations inside the transaction;
6. execute the business mutation;
7. allocate per-queue event sequence under the same locks and insert typed factual event(s);
8. set operation primary queue, outcome, and completion time;
9. commit operation, business write, and events together, or rollback all.

Existing-queue mutations may need an unlocked discovery read to learn the current date. If the locked row's actual date is not inside the acquired date-lock set, throw a dedicated retryable topology-change result, rollback the entire transaction including the provisional operation row, rediscover dates, and retry from step 1 with the same operation ID. A date-changing edit always includes its requested destination date. Retry at most three times; repeated churn returns the existing action-failure path with zero committed operation, business mutation, or event.

Creation idempotency is rooted only in global `operationId + mutationSource`, never in a newly generated queue ID. Creation writes customer, queue, immutable quote/source/cohort fields, operation, and `QUEUE_CREATED` event in one transaction.

On a duplicate operation, the repository returns the existing operation/result with `{ applied: false }`. Action handlers invoke eligible notification logic with the same business-event key; the insert-winner notification contract either creates the first attempt or returns the existing one.

Repository mutation results become an internal shape such as:

```ts
type QueueMutationResult = {
  queueItem: QueueItem;
  operationId: string;
  eventIds: string[];
  applied: boolean;
};
```

Public routes still redirect to the same tracking URL and owner actions retain the same redirects/toasts. The wrapper type must not leak event IDs publicly.

### 6.3 Date/topology lock protocol

One consistent PostgreSQL transaction advisory-lock namespace owns each shop-local queue date. It replaces the narrower walk-in-only lock in enabled mode.

- Booking creation, walk-in creation, owner walk-in creation, reorder, restore, status transitions affecting active membership or `IN_PROGRESS`, and schedule/date edits all acquire the affected date lock.
- A queue moved between dates acquires old and new date locks in sorted order before any row lock.
- Booking creation and schedule edits revalidate availability/conflicts after the date lock.
- Reorder reads and rewrites its active list only after the date lock.
- Starting a queue updates every prior `IN_PROGRESS` row with `UPDATE ... RETURNING` and emits one `AUTO_DEMOTION` event per changed row.
- The implementation documents exact lock key construction/order; hash collisions may only over-serialize, never weaken correctness.

Disabled mode retains the current locking path. Enabled-mode deterministic concurrency is an explicitly approved internal correction and must be covered by real `Promise.all` tests against different targets/dates.

### 6.4 Exact event and no-op ownership

| Existing mutation | Event(s) |
| --- | --- |
| Customer booking | `QUEUE_CREATED`, actor `CUSTOMER`, source `PUBLIC_BOOKING` |
| Customer walk-in | `QUEUE_CREATED`, actor `CUSTOMER`, source `PUBLIC_WALK_IN` |
| Owner walk-in | `QUEUE_CREATED`, actor `OWNER`, source `OWNER_WALK_IN` |
| Status action | `STATUS_CHANGED`, actor `OWNER` |
| Start new queue while another is in progress | selected queue `STATUS_CHANGED`; every demoted prior queue gets `STATUS_CHANGED`, role `AUTO_DEMOTION`, actor `SYSTEM`, reason `REPLACED_IN_PROGRESS` |
| Restore terminal queue | `QUEUE_RESTORED`, actor `OWNER`, from terminal status to `WAITING` |
| Reorder | one target `QUEUE_REORDERED` with validated intent; do not emit one event for every rewritten `sortOrder` |
| Owner queue edit | emit only changed typed events: `SCHEDULE_CHANGED`, `SERVICE_CHANGED`, and/or PII-free `OWNER_OVERRIDE/DETAILS_EDIT` |
| Operator factual correction | `EVIDENCE_CORRECTION`, actor `OPERATOR`, source `OPERATOR_CORRECTION`, references one prior event; no queue mutation |

Do not store customer name, phone, LINE ID, public token, access PIN, notes, raw URL, IP, User-Agent, or changed PII values in events.

No-op semantics preserve existing business behavior while keeping evidence honest:

- same-status submission that currently refreshes `arrivedAt`, `startedAt`, `completedAt`, `cancelledAt`, or `noShowAt` remains `APPLIED` and emits the corresponding typed before/after lifecycle timestamps plus status truth;
- reorder at a boundary performs the current accepted no-movement result, records operation `NO_OP`, and emits no factual event;
- an edit with no changed input records operation `NO_OP`; if current code still touches `updatedAt`, that incidental write is documented/tested rather than called a factual change;
- a PII-only edit emits `OWNER_OVERRIDE/DETAILS_EDIT` without storing changed PII;
- duplicate operation ID resolves the original operation and is not a second no-op operation.

## 7. Entry-source propagation

Add `app/src/lib/pilot/entry-source.ts` as the only query-token mapper:

| URL token | Stored enum |
| --- | --- |
| `line` | `LINE` |
| `shop-qr` | `SHOP_QR` |
| `owner-shared-link` | `OWNER_SHARED_LINK` |
| `in-shop` | `IN_SHOP` |
| missing/invalid | `UNKNOWN` |

Flow:

1. `/` reads only the fixed `source` token and carries it into its `/book` and `/walk-in` links.
2. `/book` and `/walk-in` pass the validated source enum to their forms as a hidden value.
3. Server actions validate the enum again; arbitrary values become `UNKNOWN`, not errors or stored text.
4. `/line` sends customers to `/book?source=line` or `/walk-in?source=line`. `LineEntryClient` must compare parsed pathname rather than exact path strings so LINE purpose/labels remain correct with a query string.
5. Controlled first-shop QR and owner-shared creation links are documented, not inferred from `Referer`.
6. No source cookie is introduced. Source survives only the intended landing → creation flow.

Source attribution remains directional and user-spoofable; reports must never treat it as billing-grade truth.

## 8. Notification attempt lifecycle

Refactor `queue-notifications.ts` without changing message templates or the rule that notification failure must not block queue work.

When measurement is disabled, use the current final-only log path and leave every pilot notification field null. The lifecycle below applies only when measurement is enabled and privacy/enablement gates have passed.

### Customer/owner rules

- `notifyQueueEvent` writes `audience=CUSTOMER`.
- `notifyOwnerQueueEvent` writes `audience=OWNER`.
- Owner-created queue events remain ineligible for owner self-notification exactly as today; no row is created, preserving current semantics.
- Missing customer recipient → `SKIPPED/NO_CUSTOMER_RECIPIENT`.
- Missing owner recipient → `SKIPPED/NO_OWNER_RECIPIENT`.
- Eligible recipient but no LINE token/client → `SKIPPED/LINE_TOKEN_MISSING`.

### LINE call lifecycle

R1 explicitly adopts **at-most-once application sending**, not exactly-once delivery:

1. atomically insert attempt `1` as `PENDING` using `INSERT ... ON CONFLICT DO NOTHING RETURNING` or an equivalent insert-winner primitive;
2. only the caller that inserted the row performs network I/O;
3. update the same row to `SENT` + `sentAt` when the LINE API accepts it;
4. update it to `FAILED` + bounded error when the call returns a known failure;
5. a crash after `PENDING` but before/after the LINE call leaves outcome unknown; it is never automatically retried;
6. reports mark `PENDING` older than `10 minutes` as **unknown/incomplete**, which may mean unsent or API-accepted;
7. owner/manual fallback handles unknown attempts during R1.

Duplicate calls return the existing attempt. This guarantees one app caller wins network-I/O ownership, but it does not claim provider delivery or prove what happened across a network/process crash. `SENT` is labelled **LINE API accepted**, never “delivered”. Null pilot fields identify legacy/disabled-mode rows.

## 9. Pilot classification and smoke exclusion

Regular enabled collection writes `pilotClassification=REAL`. Existing/pre-enable rows remain `PRE_PILOT`.

Add `app/scripts/classify-pilot-queue.mjs` and `pnpm pilot:classify`:

- requires `PILOT_OPERATOR_DATABASE_URL`; never falls back to or accepts equality with the main app URL in any environment;
- accepts queue code plus `TEST_SMOKE | TRAINING | EXCLUDED_OTHER`;
- locates by the exact six-character ID suffix used by `getQueueCode`, fails if zero or multiple matches exist, and never accepts a customer name;
- dry-run by default; `--execute` is required to update;
- prints queue code, prior/new classification, cohort, and date only—no PII, token, PIN, notes, or internal ID;
- requires protected operator execution and records an operator audit line outside the repo.

Reports include only `REAL` rows by default and show excluded counts by classification. Reclassifying a real customer queue requires an explicit reason and is never used to hide an unfavorable outcome.

## 10. Aggregate report and external reconciliation

### 10.1 App-derived aggregate report

Add `app/scripts/generate-pilot-report.mjs` and:

```json
"pilot:cohort": "node scripts/manage-pilot-cohort.mjs",
"pilot:report": "node scripts/generate-pilot-report.mjs",
"pilot:classify": "node scripts/classify-pilot-queue.mjs",
"pilot:hold": "node scripts/manage-evidence-hold.mjs",
"pilot:correct": "node scripts/correct-pilot-event.mjs",
"pilot:subject-request": "node scripts/process-customer-data-request.mjs"
```

Usage:

```bash
pnpm pilot:report -- --from YYYY-MM-DD --to YYYY-MM-DD --cohort pilot-r1
```

The script:

- requires explicit from/to/cohort and exactly one shop settings/timezone owner;
- requires `PILOT_REPORT_DATABASE_URL`, rejects fallback/equality with `DATABASE_URL`, verifies expected database/current role, and may run against production only through the approved one-off internal-network workflow;
- outputs owner/operator-only aggregate JSON with report schema version, generation time, cohort, release segment, timezone, small-cell threshold, and provenance labels;
- includes source/classification/queue mix, terminal outcomes, quote coverage, walk-in error, booking scheduled-start deviation, service-duration samples, event/correction counts, and customer-audience LINE attempt/business-event outcomes;
- reports eligible, valid, missing, excluded, pending, and legacy sample counts beside rates;
- never creates a customer dimension;
- labels generated JSON **OWNER/OPERATOR ONLY — DO NOT SHARE**;
- has no shared-report mode in R1. Any later shared summary is a separately reviewed manual derivative with threshold `5` across every dimension/intersection plus complementary suppression so hidden cells cannot be derived from totals;
- never outputs queue/customer IDs, names, phone, LINE IDs, public tokens, PINs, notes, recipients, message previews, raw event rows, or raw timestamps narrower than the approved aggregate period.

Generated JSON is deleted at cohort expiry unless a documented small-cell re-identification review approves a longer-lived non-PII derivative. The report cannot calculate adoption denominator, off-app fallback, repeated questions, owner time, or owner confidence by itself. Those remain operator-reconciled evidence and must not be fabricated from app data.

### 10.2 Operator-owned Daily Close template

Add an empty template at `docs/templates/pilot-daily-close-r1.csv`. The filled copy must live outside the repo in a private operator-owned location.

Columns:

```text
date,shop_open_time,shop_close_time,operating_day,pilot_phase,release_segment,
app_recorded_real_queue_count,off_app_fallback_count,fallback_later_entered_count,
reconciled_real_queue_total,fallback_used,fallback_reason,fallback_category_version,
safety_incident,repeated_questions_observed,owner_queue_minutes_observed,
observation_source,owner_confidence_1_5,primary_problem_category,
primary_problem_summary_no_pii,collector,collection_method,denominator_confidence,
reconciliation_closed_at,trustworthy_data_day,trustworthy_exclusion_reason,
close_duration_seconds,missing_fields,corrects_date,correction_reason
```

Rules:

- no customer/queue identifier, name, phone, LINE ID, note, URL, token, or PIN;
- Kiattisak completes reconciliation/reporting; the barber supplies only exception/value signals;
- if owner interaction exceeds three minutes median or missingness is high, simplify/sample rather than add fields;
- database-derived values are prefilled and record app-derived, operator-observed, and owner-reported provenance separately;
- repeated-question and owner-minute values must say whether they were operator-observed rather than implying owner entry;
- fixed fallback/exclusion/category dictionaries are versioned;
- deletion date comes from immutable cohort expiry unless a scoped approved hold applies.
- `denominator_confidence` is exactly `HIGH`, `MEDIUM`, or `LOW`;
- `missing_fields` is `NONE` or a semicolon-separated list from the template's fixed column names—never free text.

R1 fixed dictionaries:

- fallback category version `pilot-r1-v1`: `PAPER`, `LINE_LIST`, `PHONE_NOTE`, `MEMORY`, `APP_DOWN`, `OWNER_PREFERENCE`, `OTHER`;
- trustworthy exclusion: `CLOSED`, `RECONCILIATION_INCOMPLETE`, `SAFETY_INCIDENT`, `RELEASE_CHANGE`, `MISSING_REQUIRED_DATA`, `OTHER`;
- collection method: `SYSTEM_REPORT`, `OPERATOR_OBSERVATION`, `OWNER_REPORT`.

No Google Sheet, form provider, iCloud location, or other external tool is selected by implementation approval. Collection remains blocked until a separate pre-collection decision records account/data owner, allowed viewers, MFA/access controls, approved fields, PII prohibition, export/local-sync and backup behavior, deletion/hold procedure, incident response, and proof-of-deletion method in the runbook. No filled or synthetic-realistic record enters git.

### 10.3 Reconciliation and trustworthy-day procedure

For each shop-local operating date:

1. import the app aggregate count with app provenance;
2. record off-app fallback count and how many were later entered into the app;
3. calculate `off_app_only = off_app_fallback_count - fallback_later_entered_count`;
4. calculate `reconciled_real_queue_total = app_recorded_real_queue_count + off_app_only`;
5. if later-entry count cannot be established without customer identity, mark confidence/missingness, set `trustworthy_data_day=false`, and withhold adoption rate rather than guess;
6. exclude closed days from normalized comparisons but keep them visible;
7. keep incident/untrustworthy days visible with fixed reason;
8. report phase/release and split booking/walk-in populations where meaning differs;
9. retain collector, method, confidence, and missingness for every manual denominator;
10. a later count correction adds a dated correction row referencing `corrects_date`; it does not overwrite history.

Daily reconciliation closes at the next shop opening or `12:00` the following shop-local day, whichever comes first. Discoveries after that deadline are dated corrections to the original day.

The weekly owner/operator report combines app and observed sections without blending provenance. A complete synthetic reconciliation fixture and trustworthy/untrustworthy examples must pass before collection enablement.

## 11. Retention and privacy implementation

### 11.1 Prune behavior

Extend `privacy:prune` dry-run and execution:

- require `PILOT_RETENTION_DATABASE_URL` for the expanded production procedure, reject fallback/equality with `DATABASE_URL`, and call only reviewed retention functions;
- preserve current 180-day customer/queue/notification behavior;
- use each immutable `PilotCohort.evidenceExpiresAt`, not the current environment date, so multiple cohorts prune independently and idempotently;
- after cohort expiry, delete eligible `QueueMutationOperation` rows and cascade their `QueueEvent` rows unless the primary/affected queue has an active unexpired hold;
- reset linked queue pilot fields to `entrySource=UNKNOWN`, `pilotClassification=PRE_PILOT`, and null quote/cohort/release fields unless held;
- reset notification pilot fields (`audience`, `skipReason`, `businessEventKey`, `attemptNumber`, `pilotCohortId`, `operationId`) to null unless held; customer notification content continues under the existing 180-day rule;
- expire/release holds explicitly; after recording the bounded external audit receipt, delete released/expired hold rows before any otherwise-authorized queue deletion so the restrictive FK blocks only active holds;
- show counts by table/action in dry-run before execution;
- include post-execution assertions proving held records were preserved and unrelated eligible records were processed;
- define cutoff comparisons as UTC instants derived from end-of-day shop-local cohort expiry; repeated runs produce no additional unintended changes;
- test two cohorts with different expiries and new collection after the earlier cohort expires.

Filled external reconciliation data is deleted separately under its documented operator procedure; the app prune script cannot claim to delete it.

### 11.2 Customer access, correction, and deletion

The existing privacy contact remains the request entry point. The owner verifies the customer using the existing queue code + PIN flow; Kiattisak then uses a bounded operator procedure that accepts queue code after verification and never places name/phone/PIN in shell history.

- **Access:** the owner uses the authenticated existing queue/customer view; no pilot row export is created.
- **Correction:** customer-visible queue data uses the existing owner edit flow. Factual event evidence uses the append-only operator correction script; original events are never edited.
- **Deletion:** absent an active approved hold, anonymize customer/queue/notification PII, delete eligible customer linkage, delete only events/notification pilot metadata belonging to that queue, reset its pilot fields, and record a non-PII operator audit receipt outside git.
- **Shared operation safety:** an operation may contain events for the subject queue plus system events for other queues. Never cascade-delete that operation while unrelated events/notifications remain. Remove the subject queue's event rows, set its primary relation null when applicable, retain the PII-free shared operation for the unrelated evidence, and delete the operation only when no event/notification evidence remains.
- **Active hold:** disclose that deletion is narrowly deferred, record review/expiry, and process immediately on release/expiry where legally allowed.
- **External Daily Close:** it contains no queue/customer identifier and therefore cannot identify a subject record; if that assumption is violated, stop collection and treat it as an incident.

Add `pilot:subject-request` with dry-run/explicit execute and tests. It outputs queue code, action counts, hold state, and dates only—no PII, token, PIN, note, message preview, or internal ID.

### 11.3 Privacy copy

Update `/privacy` before enabling measurement to disclose, in Thai:

- fixed entry source;
- queue state/change timestamps and wait-estimate snapshots used to improve operations;
- notification attempt status as API-operation evidence;
- pilot evidence retention through pilot + 90 days, monthly processing, and narrowly scoped incident/dispute holds;
- no sale, advertising use, or model-training use of customer operational data;
- existing access/correction/deletion contact path.

Do not describe API acceptance as message delivery. Update the visible revision date and responsive privacy tests.

### 11.4 Backup expiry and restore

- Private R2 backup lifecycle remains `14 days`; documented manual pilot copies remain at most `7 days` unless a separately approved incident hold applies.
- After live deletion, old personal/pilot data may remain only inside protected backups for at most the applicable lifecycle; privacy/runbook wording must state this operational delay truthfully.
- An older backup is restored only into an isolated disposable environment. Before any operational use, run current migrations, retention/hold logic, and subject-deletion reconciliation so expired/deleted evidence cannot re-enter production silently.
- Validation proves live deletion, external-file deletion, R2/manual expiry configuration, and re-pruning after restore.

### 11.5 Operator database workflow

The app must not expose row-level pilot data over a new route. Provision reviewed SQL roles/functions through an admin-only one-off container on the private Compose network; operator secrets are injected only for that command and never added to the public web-service environment.

- report role: `EXECUTE` only on approved aggregate reporting functions/views; no raw PII table select;
- classification role: minimal `SELECT` on queue ID suffix/date/cohort/classification columns and column-level `UPDATE` only for classification;
- hold/correction/subject role: execute only reviewed security-definer procedures for hold insert/release, typed event correction, and verified subject deletion;
- retention role: execute only the reviewed dry-run/execute retention procedures;
- no reuse of the owner passcode/session;
- no secret echoed in docs, logs, reports, or commits;
- every script rejects missing credentials, fallback/equality with `DATABASE_URL`, unexpected `current_user/current_database`, or a production operation without explicit production confirmation;
- private-network execution is required; if execution leaves that network, TLS verification becomes mandatory;
- document role SQL, grants/default privileges, creation, rotation, revocation, emergency disablement, audit location, and output redaction in the runbook;
- grant-verification tests prove each role cannot read/write outside its contract.

If the deployment platform cannot enforce bounded database roles safely, stop and obtain a new human decision rather than falling back silently to the main app credential.

`pilot:hold` accepts queue code, fixed reason, and expiry no more than 30 days; it is dry-run by default, requires explicit execute/production confirmation, prints bounded non-PII output, records create/release audit externally, and cannot extend without fresh human approval. `pilot:correct` accepts an internal event ID plus typed corrected fields only, creates a correction operation/event, and never updates the original event.

Provisioning contract:

- login roles: `bqa_pilot_reporter`, `bqa_pilot_operator`, and `bqa_pilot_retention`;
- revoke default/public table/schema privileges first;
- reporter receives database connect/schema usage plus `EXECUTE` only on versioned aggregate functions;
- operator receives connect/usage, column-limited queue lookup/classification update, and `EXECUTE` only on versioned cohort/hold/correction/subject procedures;
- retention receives connect/usage and `EXECUTE` only on versioned retention dry-run/execute procedures;
- no role receives customer/notification free-text SELECT, arbitrary table INSERT/UPDATE/DELETE, role creation, or schema DDL;
- passwords are injected as `psql` variables during one-off provisioning and never appear in SQL files;
- default privileges for future tables/functions remain revoked until reviewed explicitly.

Concrete execution route: launch a short-lived one-off operations container/process attached to the private Compose network, inject exactly one role URL and production-confirmation flag, run one command, capture the bounded audit receipt outside git, destroy the process, and verify the credential is absent from the long-running web container. Rotation replaces the role password; revocation removes login/execute grants and terminates active sessions.

## 12. File-level implementation map

### New files

- `app/src/lib/pilot/config.ts`
- `app/src/lib/pilot/entry-source.ts`
- `app/src/lib/pilot/events.ts`
- `app/src/lib/pilot/operations.ts`
- `app/scripts/generate-pilot-report.mjs`
- `app/scripts/classify-pilot-queue.mjs`
- `app/scripts/manage-pilot-cohort.mjs`
- `app/scripts/manage-evidence-hold.mjs`
- `app/scripts/correct-pilot-event.mjs`
- `app/scripts/process-customer-data-request.mjs`
- `app/scripts/provision-pilot-roles.sql`
- `app/scripts/verify-pilot-role-grants.sql`
- `app/scripts/disable-pilot-roles.sql`
- `app/scripts/reconcile-pilot-function-owner.sql`
- `scripts/verify-pilot-backup-restore.sh`
- `scripts/mount-pilot-daily-close.sh`
- `scripts/unmount-pilot-daily-close.sh`
- `docs/operations/pilot-daily-close-storage-proposal-r1.md`
- `docs/evidence/pilot-precollection-operational-r1.md`
- `app/tests/integration/pilot-instrumentation.test.ts`
- `app/tests/integration/pilot-report.test.ts`
- `app/tests/integration/pilot-operator-grants.test.ts`
- `app/tests/integration/pilot-retention.test.ts`
- `docs/templates/pilot-daily-close-r1.csv`
- one new Prisma migration directory

### Existing files expected to change

- `app/prisma/schema.prisma`
- `app/src/lib/queue/repository.ts`
- `app/src/lib/notifications/queue-notifications.ts`
- `app/src/lib/notifications/line-client.ts` only if needed for bounded error/result typing; no message behavior change
- keep UUID validation in the pilot operation module; `app/src/lib/admin-auth.ts` is not expanded
- `app/src/app/book/page.tsx`
- `app/src/app/book/booking-form.tsx`
- `app/src/app/book/actions.ts`
- `app/src/app/walk-in/page.tsx`
- `app/src/app/walk-in/walk-in-form.tsx`
- `app/src/app/walk-in/actions.ts`
- `app/src/app/page.tsx`
- `app/src/app/line/page.tsx`
- `app/src/app/line/line-entry-client.tsx`
- `app/src/app/owner/actions.ts`
- owner queue/status/reorder/restore/edit/walk-in form components that need hidden operation IDs
- `app/src/app/api/health/route.ts`
- `app/src/app/privacy/page.tsx`
- `app/scripts/prune-customer-data.mjs`
- `app/package.json`
- `docker-compose.deploy.yml`
- `.env.production.example`
- `docs/data-model.md`
- `docs/line-oa-integration.md`
- `docs/line-oa-setup.md`
- `docs/deployment-checklist.md`
- `docs/deployment-haabiz.md`
- `docs/production-environment.md`
- `docs/pilot-readiness-plan.md`
- `docs/operations/pilot-operations-runbook.md`

Generated Prisma output follows the repository's existing generation/ignore policy and is not manually edited.

## 13. Implementation slices

Each slice requires focused tests before the next. Do not combine all changes into one unreviewable patch.

### Slice A — Backward-compatible schema and config

- Add enums, nullable/defaulted columns, `PilotCohort`, `QueueMutationOperation`, `QueueEvent`, restrictive `EvidenceHold`, nullable notification fields, checks/indexes, and migration.
- Backfill legacy values without guessing audience/source.
- Add config parser and health status.
- Review exact generated SQL, migration lock duration, defaults-before-non-null order, and nullable unique-index behavior.
- Generate Prisma client and run clean disposable migration deploy.

Gate: old queue code can run against the expanded schema while measurement remains disabled; old-image rollback after a deliberately failed new deploy is rehearsed without a down migration.

### Slice B — Creation evidence and source propagation

- Add validated operation IDs and source propagation.
- Reserve the global operation ledger before writes.
- Add the date-lock protocol, revalidate booking slots inside the transaction, and intentionally remove failed-booking orphan customer writes in enabled mode without changing accepted slot conditions.
- Replace the narrower enabled-mode walk-in lock with the common date lock while preserving the estimate algorithm.
- Capture immutable quote/cohort/release/classification.
- Return duplicate operations without duplicate queue/notification creation.

Gate: disabled behavior remains current; enabled accepted/rejected queue rules and redirects remain equivalent, while named concurrency/failure-side-effect corrections are proven explicitly.

### Slice C — Owner mutation events

- Refactor status/restore/reorder/edit reads into their mutation transactions with sorted date locks, sorted row locks, and post-lock revalidation.
- Record exact before/after typed evidence.
- Capture every system demotion returned from a prior in-progress update.
- Define and test same-status, boundary reorder, no-change edit, and PII-only edit operation outcomes.
- Preserve customer counters, timestamps, conflict checks, order rules, confirmations, and redirects.

Gate: existing owner queue integration/E2E suite passes plus event atomicity/idempotency tests.

### Slice D — Notification attempt truth

- Gate nullable audience/skip/business-event/attempt/cohort fields behind enabled measurement.
- Add atomic insert-winner at-most-once attempt lifecycle and honest aged-unknown reporting.
- Preserve non-blocking notification failure and current owner-notification eligibility.
- Prove only the attempt-insert winner owns network I/O; do not claim exactly-once delivery across crash windows.

Gate: fake LINE tests cover customer/owner `SENT`, `FAILED`, each `SKIPPED` reason, duplicate, and aged `PENDING` semantics.

### Slice E — Operator scripts, classification, retention, and privacy

- Add cohort, aggregate report, classification, hold, factual-correction, subject-request, and extended retention scripts/procedures.
- Provision and verify bounded report/classification/hold-correction-subject/retention roles through a protected one-off internal-network workflow.
- Add empty Daily Close template.
- Update privacy/env/Compose/deployment/runbook/readiness/data docs and preserve the monthly-first commercial boundary.
- Add explicit external-template security/location decision as a pre-collection blocker.
- Prove no HTTP reporting surface or secret output was introduced.

Gate: script dry runs, execute tests on disposable data, PII-negative output tests, retention hold tests, and privacy render tests pass.

### Slice F — Consolidated pilot readiness validation

- Run full technical suites and clean migration/restore rehearsal.
- Validate enabled, disabled, and misconfigured health/config modes.
- Produce one synthetic owner/operator aggregate report and one abstract synthetic reconciliation fixture containing no realistic person/queue data.
- Verify rollback to disabled collection while queue operations continue.
- Verify individual deletion, evidence correction, scoped holds, multi-cohort expiry, backup expiry, and re-pruning after isolated restore.
- Independent security/privacy and data-method review.

Gate: human reviews exact report/template/privacy evidence before any real data collection.

Readiness/runbook updates must add explicit checkboxes for:

- disabled-mode no-collection proof;
- published/reviewed Thai privacy copy and real privacy contact;
- operator-role grant/revoke verification;
- approved Daily Close storage location, MFA/access, deletion, hold, and proof-of-deletion procedure;
- denominator/reconciliation/trustworthy-day fixture validation;
- owner/operator-only report labelling and shared-summary complementary suppression review;
- prune, hold, factual-correction, customer-deletion, multi-cohort expiry, and backup-expiry proof;
- isolated restore followed by current re-pruning;
- explicit measurement enablement approval;
- separate owner agreement and pilot-execution approval.

## 14. Test contract

### Integration

- disabled mode produces no source, quote, cohort, release, operation, event, notification audience/attempt/skip/business-event collection and preserves current final-only behavior;
- enabled mode refuses incomplete cohort/release/delete-after config before writes;
- enabled mode requires one immutable matching cohort row and rejects collection at/after expiry;
- each creation path emits exactly one creation event with correct actor/source;
- concurrent duplicate booking, customer walk-in, and owner walk-in operation IDs create exactly one customer mutation, queue, operation, event set, and notification business event;
- event failure rolls back its business mutation;
- per-queue sequence is deterministic under concurrent writes;
- one owner edit can emit schedule, service, and PII-free details events with deterministic distinct ordinals;
- different-target concurrent booking/edit/status/reorder/restore/create tests prove sorted date/topology and row lock behavior;
- stale discovery-date tests force rollback/retry and prove no operation/event commits under repeated topology churn;
- starting a queue logs selected-owner plus every previous-system transition, and enabled date locking leaves at most one in-progress row for one date;
- restore/reorder/edit event truth matches existing business outcomes;
- no-op and PII-only action semantics match Section 6.4;
- same-status actions preserve and record exact lifecycle timestamp refresh truth;
- quote fields are immutable after edit/status/reorder;
- no PII exists in event columns or aggregate output;
- legacy/disabled notification pilot fields remain null; enabled audiences/reasons are explicit;
- API acceptance, failure, skipped, insert-winner duplicate, and aged unknown `PENDING` are separate; crash-window tests do not claim delivered/unsent certainty;
- REAL/PRE_PILOT/TEST_SMOKE classifications filter correctly;
- append-only factual correction supersedes report truth without editing the original event;
- hold prevents queue deletion and preserves only scoped records; expired/released holds do not block pruning;
- two cohorts with different expiries prune independently and idempotently;
- subject deletion processes live app evidence while respecting an active hold;
- subject deletion of one queue in a multi-queue operation preserves unrelated queue events and removes the shared operation only when empty;
- aggregate denominators, coverage, exclusions, percentiles, rare dimensions, complementary suppression, and owner/operator-only labelling use deterministic fixtures;
- operator grant tests prove report/classification/hold-correction-subject/retention roles cannot exceed approved operations.

### E2E

- `/?source=shop-qr` → booking/walk-in stores only the approved source;
- malformed source becomes `UNKNOWN`;
- `/line` still binds the correct identity purpose and records `LINE` after query-aware redirect changes;
- customer creation errors preserve form fields, source, LINE identity, and operation ID for safe retry;
- each actionable owner form has a distinct operation ID and a new render gets a new ID;
- owner status, confirmation, restore, reorder, edit, and owner walk-in flows remain unchanged visually and behaviorally;
- owner login/session boundaries remain unchanged;
- `/privacy` contains the approved disclosure at 360/390/768/1024/1440 with no clipping/overlap.

### Required commands

From `app/`:

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm typecheck
pnpm lint
pnpm test:integration
pnpm e2e
pnpm build
```

Also require:

- clean disposable deployment of all migrations;
- `privacy:prune` dry-run and execute on disposable held/unheld fixtures;
- `pilot:report` deterministic fixture comparison and PII-negative scan;
- operator-role provision/grant/revoke verification in disposable PostgreSQL;
- backup + restore rehearsal with events, operations, holds, notification fields, expired evidence, and immediate re-pruning;
- failed-new-deploy/old-image rollback against the expanded schema;
- `git diff --check`;
- proof that no dev/test server or watcher remains running.

## 15. Rollout and rollback

### Rollout

1. Deploy migration/code with `PILOT_MEASUREMENT_ENABLED=false` outside operating hours.
2. Prove disabled-mode no collection and run full production smoke, backup, restore, and old-image rollback rehearsal.
3. Provision/revoke-test separate operator roles and one-off internal-network workflow without committing, echoing, or injecting secrets into the web service.
4. Approve the private Daily Close storage location/security/deletion procedure and add it to the runbook.
5. Set real privacy contact and publish/visually verify the revised Thai privacy disclosure.
6. Create immutable cohort/expiry, configure release segment and controlled links, and verify health.
7. Validate the reconciliation/trustworthy-day fixture, owner/operator report, shared-summary small-cell review procedure, retention/hold/subject-deletion proof, and backup-expiry proof.
8. Obtain separate human authorization to enable measurement.
9. Enable, redeploy, verify health, create/classify one test smoke queue, and inspect the first aggregate boundary.
10. Begin customer recruitment only after a separate pilot-execution approval and owner agreement.

### Rollback

- Close online intake first if enabled instrumentation blocks or produces untrustworthy evidence.
- Set `PILOT_MEASUREMENT_ENABLED=false`, redeploy, and verify normal queue actions.
- Do not drop the migration or delete evidence during incident response.
- Added columns/tables remain backward-compatible with prior code.
- Preserve incident evidence and mark the affected release segment/day untrustworthy.
- Reopen intake only after health, queue smoke, notification behavior, and operator reconciliation pass.

## 16. Commercial boundary

Instrumentation collects no package choice, price response, payment, or commercial-behavior event. After operational evidence exists, a separate owner agreement and pricing-offer approval may test one monthly Pro anchor. An annual equivalent is discussed only if the owner expresses interest. There is no annual default, retroactive charge, coercion, payment flow, service degradation, or adverse treatment for declining. Any package-decision record remains outside this instrumentation implementation and requires a separate approved method.

## 17. Review gates

1. **Independent plan review:** PASS — technical architecture and privacy/data-method reviews have no remaining blocker.
2. **Human plan gate:** PASS — Kiattisak approved this implementation plan on 2026-07-22.
3. **Implementation authorization:** PASS — Kiattisak separately authorized Slices A–F on 2026-07-22; local implementation is complete with measurement disabled.
4. **Current gate — pre-collection:** human review of disabled-mode proof, migration, Thai privacy copy, operator grants, approved template storage/deletion procedure, reconciliation fixture, owner/operator report, shared-summary small-cell method, prune/hold/correction/subject-deletion evidence, backup expiry/restore proof, and rollback evidence.
5. **Enablement gate:** separate explicit authorization to set measurement enabled.
6. **Pilot-execution gate:** separate owner agreement and explicit approval before inviting customers.

No later gate may be inferred from approval of an earlier gate.
