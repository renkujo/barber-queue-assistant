# MVP Scope

## MVP goals

1. Reduce repeated customer messages.
2. Give the owner one clear daily queue screen.
3. Support both scheduled bookings and walk-in queue tickets.
4. Prevent obvious queue/time collisions for a one-barber shop.
5. Handle late/no-show customers without losing the whole day.
6. Send useful customer notifications through LINE OA when available.

## Non-goals for MVP

- Multi-branch salon management.
- Complex staff scheduling.
- Full POS/payment system.
- Deposit/payment enforcement.
- Loyalty/membership system.
- Inventory management.
- Full chatbot automation.
- Marketplace/discovery platform.

## MVP modules

### Customer public experience

- View today shop status.
- View approximate queue/wait status.
- Book a time slot.
- Get a walk-in queue ticket.
- Track queue/booking by link or code.
- Confirm coming.
- Cancel booking/queue.

### Owner/admin experience

- Today-first daily queue dashboard.
- Add queue manually from phone/chat/walk-in.
- Mark customer arrived.
- Start service.
- Complete service.
- Mark late/no-show.
- Cancel queue.
- Pause/block time.
- Temporarily close queue intake.
- Set a recurring Monday–Sunday customer availability schedule: online intake, in-store walk-in only, or shop closed.
- Override the recurring schedule for special dates such as holidays or barber leave.
- See late/no-show risk warnings.

### LINE OA integration

- Rich menu or link to public web app.
- Optional LINE user binding when customer enters through LINE/LIFF context.
- Send booking confirmation when `lineUserId` is available.
- Send reminders and queue-near notifications when possible.
- Fall back to tracking link/code when LINE identity is unavailable.

## Acceptance principles

- Owner actions should be possible in 1-2 taps for common queue work.
- The daily queue screen is more important than calendar views.
- The owner must always be able to override queue order/status.
- Walk-in wait time is an estimate, not a guaranteed appointment time.
- No-show handling should warn and assist, not auto-punish too aggressively.
