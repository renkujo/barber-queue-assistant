# Product Data Model

This is a product-level model, not final database schema.

## Main concept

Use `QueueItem` as the central unit for both scheduled bookings and walk-ins.

This keeps the owner dashboard simple: everything for today appears in one queue.

## Entity: Customer

Fields:

- `id`
- `publicToken` unique UUID used only for customer tracking links
- `name`
- `phone`
- `lineUserId` optional
- `note` optional
- `totalBookings`
- `completedCount`
- `lateCount`
- `noShowCount`
- `cancelledCount`
- `createdAt`
- `updatedAt`

Notes:

- Phone can be the fallback identity when LINE identity is absent.
- `lineUserId` should be optional because customer entry is not forced through LINE.

## Entity: Service

Fields:

- `id`
- `name`
- `durationMinutes`
- `price` optional
- `isActive`
- `sortOrder`

Examples:

- ตัดผมชาย — 30 minutes
- ตัด + สระ — 45 minutes
- โกนหนวด — 15 minutes

## Entity: QueueItem

Fields:

- `id`
- `type`: `booking` | `walk_in` | `manual`
- `status`: `confirmed` | `arrived` | `waiting` | `late` | `in_progress` | `done` | `cancelled` | `no_show`
- `customerId`
- `customerNameSnapshot`
- `phoneSnapshot`
- `lineUserIdSnapshot` optional
- `serviceId`
- `serviceNameSnapshot`
- `serviceDurationMinutes`
- `date`
- `startAt` optional for scheduled booking
- `estimatedAt` optional for walk-in estimate
- `arrivedAt` optional
- `startedAt` optional
- `completedAt` optional
- `cancelledAt` optional
- `noShowAt` optional
- `confirmedComingAt` optional
- `note` optional
- `ownerNote` optional
- `sortOrder` optional for owner override
- `createdBy`: `customer` | `owner`
- `createdAt`
- `updatedAt`

Notes:

- `customerNameSnapshot` protects queue history if customer profile changes later.
- `sortOrder` supports manual override without destroying original booking time.
- Public tracking never accepts the database `id`; it resolves `publicToken` and masks the customer name.
- The human-readable `Q` + six-character queue code is derived from the immutable queue ID, so it stays stable after reorder and matches LINE notification copy.
- Manual lookup uses the queue code plus a deterministic four-digit PIN derived from the UUID `publicToken`. The PIN is not stored as a database column, can be reproduced for owner sharing, and remains protected by per-IP and per-queue-code lookup rate limits. Phone digits are not accepted as a lookup credential.
- Phone is optional. A phone-less queue can still be tracked through its UUID link or queue code + PIN.

## Entity: TimeBlock

Fields:

- `id`
- `date`
- `startAt`
- `endAt`
- `reason`
- `type`: `break` | `closed` | `manual_block`
- `createdAt`
- `updatedAt`

Use cases:

- lunch break;
- owner errands;
- temporary pause;
- closed early;
- personal appointment.

## Entity: NotificationLog

Fields:

- `id`
- `queueItemId` optional
- `customerId` optional
- `channel`: `line` | `sms` | `manual` | `none`
- `type`: `booking_confirmed` | `reminder` | `queue_near` | `late` | `cancelled` | `no_show`
- `status`: `pending` | `sent` | `failed` | `skipped`
- `recipient` optional
- `messagePreview`
- `sentAt` optional
- `error` optional
- `createdAt`

## Entity: ShopSettings

Fields:

- `id`
- `shopName`
- `timezone`
- `openDays`
- `businessHours`
- `defaultGracePeriodMinutes`
- `defaultReminderMinutesBefore`
- `queueIntakeEnabled`
- `bookingEnabled`
- `walkInEnabled`
- `lineOaEnabled`
- `ownerLineUserId` optional owner LINE notification target


## Entity: ShopDateAvailability

Per-date exception for public customer intake. If no row exists for a date, the app uses `ShopWeeklyAvailability`, then `ShopSettings` defaults.

Fields:

- `id`
- `date` unique day value
- `bookingEnabled`
- `walkInEnabled`
- `inStoreOnly`
- `reason` optional owner note
- `createdAt`
- `updatedAt`

Rules:

- `bookingEnabled=true`, `walkInEnabled=true`, `inStoreOnly=false`: online booking and online queue tickets are available.
- `bookingEnabled=false`, `walkInEnabled=false`, `inStoreOnly=true`: the shop is open for physical walk-ins, but customer booking and queue tickets are disabled online.
- `bookingEnabled=false`, `walkInEnabled=false`, `inStoreOnly=false`: the shop is closed for both online and in-store intake.

## Entity: ShopWeeklyAvailability

Recurring Monday–Sunday availability used automatically every week.

Fields:

- `id`
- `dayOfWeek` unique ISO weekday (`1` Monday through `7` Sunday)
- `bookingEnabled`
- `walkInEnabled`
- `inStoreOnly`
- `reason` optional owner note
- `createdAt`
- `updatedAt`

Resolution order:

1. matching `ShopDateAvailability` special-date exception;
2. matching `ShopWeeklyAvailability` weekday rule;
3. global `ShopSettings` defaults.

## Future-safe field: staffId

Even though MVP has one barber, schema can include a default `staffId` internally later if needed.

For MVP UI, do not expose multi-staff complexity.

## Entity: RateLimitBucket

Short-lived abuse-control state for owner login, public booking/walk-in creation, and queue lookup.

Fields:

- `key` hashed request fingerprint scoped by action
- `count`
- `windowStartedAt`
- `blockedUntil` optional
- `updatedAt`

Raw IP addresses are not stored in this table. Buckets older than 30 days are removed by the retention job.
