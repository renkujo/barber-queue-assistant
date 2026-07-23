# LINE OA Integration

Setup handoff for real LINE configuration: see [`line-oa-setup.md`](./line-oa-setup.md).

## Principle

LINE OA should support the product, not define the whole product.

The queue app must work through normal web links and QR codes. LINE is used when it is convenient for entry and notifications.

## Entry paths

Possible entry paths:

- LINE OA rich menu opens queue web app.
- Customer scans QR at shop.
- Owner sends booking/tracking link in chat.
- Customer opens link from Facebook/Instagram/Google profile.

If the customer enters through LINE/LIFF and consent/identity is available, store `lineUserId`.

If not, continue with phone/name and tracking code.

Current binding foundation:

- LIFF sends its ID token to a server action; the server verifies it with LINE and derives `lineUserId` from the verified `sub` claim.
- The verified identity is carried in a signed, purpose-bound, 10-minute, HttpOnly cookie. Booking, walk-in, and owner binding use separate signed purposes/cookie names and cannot consume each other. `/book`, `/walk-in`, and `/line/owner` do not accept LINE identity from query strings or hidden fields.
- Booking/walk-in actions read the verified cookie, pass the identity into queue creation, and clear it after success while preserving it across recoverable retries.
- Customer lookup first prefers `lineUserId`, then phone fallback; if a LINE placeholder customer exists, the real form submission updates its name/phone.
- Queue items snapshot `lineUserIdSnapshot`, so later notification sends do not depend only on the mutable customer row.
- Initial booking/queue-created customer pushes include the queue code and deterministic four-digit access PIN. Later status pushes omit the PIN, and `NotificationLog.messagePreview` redacts it as `••••`.
- `/api/line/webhook` binds `follow` and `message` events with `source.userId` into placeholder customers named `LINE user ...` until the user submits a real form.
- LIFF entry and rich-menu deep-link targets are implemented through `/line?target=...`.
- Authenticated `/owner/settings/line-connect` issues an owner connection link only when clicked. It carries a signed random nonce recorded in `OwnerLineConnectToken`; completion atomically consumes it once before updating the owner destination.

## MVP LINE features

### Rich menu

Suggested buttons:

- จองคิว
- เช็คคิวของฉัน
- เวลาว่างวันนี้
- แผนที่ร้าน / ติดต่อร้าน

### Notifications

Send when `lineUserId` is available:

- booking confirmed;
- queue ticket created;
- appointment reminder;
- confirm-coming request;
- queue is near;
- booking changed/cancelled;
- no-show/cancelled due to late arrival.

Current implementation foundation:

- `app/src/lib/notifications/line-client.ts` wraps LINE push message API.
- `app/src/lib/notifications/templates.ts` owns Thai queue notification copy.
- `app/src/lib/notifications/queue-notifications.ts` records every attempted queue notification in `NotificationLog`.
- If no LINE identity exists, the notification is logged as `channel=NONE`, `status=SKIPPED`.
- If LINE identity exists but `LINE_CHANNEL_ACCESS_TOKEN` is missing, it is logged as `channel=LINE`, `status=SKIPPED`.
- If LINE push fails, it is logged as `status=FAILED` and must not block booking/queue actions.
- While approved pilot measurement is enabled, customer/owner audience and skip reasons are explicit. Eligible calls use an at-most-once application-send attempt: `PENDING` older than 10 minutes means outcome unknown, and `SENT` means LINE API accepted—not confirmed customer delivery. Pilot fields remain null while measurement is disabled.
- Wired events: booking confirmed, walk-in/owner walk-in created, queue near when owner starts service, late, cancelled, and no-show.
- Integration tests use a fake LINE client; tests must not hit the real LINE API.

### Owner notifications

Optional MVP+:

- notify owner when new online booking arrives;
- notify owner when customer confirms/cancels;
- notify owner when a customer is late.

## Fallback behavior

If LINE identity is not available:

- show tracking link/code on screen;
- allow customer to reopen status page with code;
- owner can still manage queue manually;
- notification log records `skipped` or `none` channel.

## Do not build in MVP

- Full natural-language chatbot.
- Complex chat-based booking conversation.
- Mandatory LIFF-only customer journey.
- Payment/deposit through LINE.

These can come later if validated.
