# Late and No-show Flow

## Why this matters

For a one-barber shop, a no-show wastes a real earning slot. But auto-cancelling too aggressively can also create customer conflict because real shops have delays, rain, traffic, and personal relationships.

The system should help the owner make a quick decision, not fully replace judgment.

## Statuses involved

Suggested statuses:

- `confirmed` — booking is accepted.
- `arrived` — customer is at shop.
- `waiting` — customer is waiting in queue.
- `late` — appointment time has passed and customer has not arrived.
- `in_progress` — service is happening.
- `done` — service completed.
- `cancelled` — booking/queue cancelled.
- `no_show` — customer did not arrive after grace period or owner decision.

## Before appointment

Reminder behavior:

1. Send reminder 1-2 hours before appointment.
2. Send reminder 15-30 minutes before appointment.
3. Include actions if possible:
   - confirm coming;
   - cancel;
   - request reschedule/contact shop.

If customer confirms coming, admin should show a positive signal.

If customer does not confirm, do not auto-cancel. Show as risk only.

## At appointment time

1. If customer has not been marked `arrived`, system highlights item.
2. Grace period starts, for example 10-15 minutes.
3. Admin sees large actions:
   - wait 10 more minutes;
   - call/message customer;
   - mark no-show;
   - move to waiting queue;
   - cancel.

## After grace period

If customer still has not arrived:

1. Admin warning becomes stronger.
2. Owner can mark `no_show`.
3. Slot becomes available for next queue/walk-in.
4. Customer receives cancellation/no-show message if notification channel exists.
5. Customer history records the no-show.

## Reliability history

Store simple signals:

- total bookings;
- completed visits;
- no-show count;
- late count;
- cancelled count.

MVP admin warning examples:

- `เคยไม่มา 2 ครั้ง`
- `ยังไม่กดยืนยันว่าจะมา`
- `เลยเวลานัด 12 นาที`

## Policy options for later

If no-show becomes a serious problem, later versions may add:

- deposit requirement;
- no peak-time bookings for repeat no-show customers;
- manual approval for risky customers;
- booking limit per phone number;
- stricter cancellation window.

Do not force deposit in MVP unless the owner confirms it is needed.
