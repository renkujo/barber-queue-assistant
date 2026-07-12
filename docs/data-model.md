# Product Data Model

This is a product-level model, not final database schema.

## Main concept

Use `QueueItem` as the central unit for both scheduled bookings and walk-ins.

This keeps the owner dashboard simple: everything for today appears in one queue.

## Entity: Customer

Fields:

- `id`
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

Per-date override for public customer intake. If no row exists for a date, the app uses `ShopSettings` defaults.

Fields:

- `id`
- `date` unique day value
- `bookingEnabled`
- `walkInEnabled`
- `reason` optional owner note
- `createdAt`
- `updatedAt`

Rules:

- `bookingEnabled=true` and `walkInEnabled=true`: customer booking and walk-in are both allowed for that date.
- `bookingEnabled=false` and `walkInEnabled=true`: walk-in only; booking slots for that date are unavailable.
- `bookingEnabled=false` and `walkInEnabled=false`: date is closed for public customer intake.

## Future-safe field: staffId

Even though MVP has one barber, schema can include a default `staffId` internally later if needed.

For MVP UI, do not expose multi-staff complexity.
