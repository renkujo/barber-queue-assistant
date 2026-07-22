# LINE OA Setup Guide

This guide is for connecting the current Barber Queue Assistant notification foundation to a real LINE Official Account.

For a Thai step-by-step tutorial with screenshots-oriented field guidance, local tunnel testing, LIFF setup, and troubleshooting, see [`line-oa-tutorial-th.md`](./line-oa-tutorial-th.md).

The app still works without LINE. If LINE config or `lineUserId` is missing, queue actions continue normally and notification attempts are recorded as skipped in `NotificationLog`.

## Current implementation status

Implemented:

- LINE webhook route: `app/src/app/api/line/webhook/route.ts`
- Signature verification with `LINE_CHANNEL_SECRET`
- Basic user binding from webhook `follow` / `message` events via `source.userId`
- Server-verified LIFF ID-token handoff through a signed, short-lived HttpOnly cookie
- Queue notification boundary and `NotificationLog` recording
- LINE push wrapper for text messages
- Tests for notification logs, user binding, and webhook signatures

Not implemented yet:

- LINE rich menu creation automation
- Owner-facing notification settings UI
- Production retry queue for failed LINE pushes

Implemented after the foundation:

- LIFF entry route at `/line`
- `/line?target=book` verifies the LIFF ID token server-side, sets the identity cookie, then redirects to clean `/book`
- `/line?target=walk-in` verifies the LIFF ID token server-side, sets the identity cookie, then redirects to clean `/walk-in`

## LINE side setup

### 1. Create or select a LINE Official Account

Use LINE Official Account Manager and create/select the shop account.

### 2. Enable Messaging API

In LINE Official Account Manager:

1. Open the shop OA.
2. Go to Messaging API settings.
3. Enable Messaging API.
4. Create or connect a LINE Developers provider/channel.

### 3. Get channel credentials

In LINE Developers, open the Messaging API channel and copy:

- Channel secret
- Channel access token

Add them to `app/.env`:

```env
LINE_CHANNEL_SECRET=replace-with-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=replace-with-channel-access-token
OWNER_LINE_USER_ID=replace-with-owner-line-user-id
```

Do not commit real values.


### Owner LINE alerts

The owner should connect LINE from `/owner/settings` by pressing `เชื่อม LINE เจ้าของร้าน`. The app opens LIFF, reads the owner LINE user id, and stores it in `ShopSettings.ownerLineUserId`.

`OWNER_LINE_USER_ID` remains available as an environment fallback for emergency/manual setup, but it should not be the normal owner setup path.

Current owner-alert events:

- customer booking confirmed (`BOOKING_CONFIRMED`)
- customer walk-in created (`QUEUE_CREATED`)

Owner-created walk-ins are intentionally not pushed back to the owner to avoid self-notification spam. If no owner LINE id is connected/configured, the app records a skipped `NotificationLog` row and queue creation still succeeds.

## LIFF setup

Create a LIFF app in the same LINE Login channel if you want rich-menu links to associate verified LINE identity with booking/walk-in forms without exposing identity in URLs.

Recommended LIFF settings:

- LIFF app name: `Barber Queue Assistant`
- Size: `Full`
- Endpoint URL:

```text
https://your-domain.example/line
```

For local tunnel testing:

```text
https://your-tunnel-url/line
```

After creating the LIFF app, copy the LIFF ID into `app/.env`:

```env
NEXT_PUBLIC_LINE_LIFF_ID=replace-with-liff-id
```

Restart the Next.js dev server after changing `NEXT_PUBLIC_*` env values.

Use these entry URLs for LINE rich menu buttons:

```text
https://your-domain.example/line?target=book
https://your-domain.example/line?target=walk-in
```

If `NEXT_PUBLIC_LINE_LIFF_ID` is missing or LIFF fails to initialize, `/line` shows fallback buttons to the normal public web forms instead of breaking the app.

## Webhook setup

Webhook endpoint path:

```text
/api/line/webhook
```

Production example:

```text
https://your-domain.example/api/line/webhook
```

Local development needs a public tunnel, for example:

```bash
ngrok http 3000
```

or:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then set the LINE webhook URL to:

```text
https://your-tunnel-url/api/line/webhook
```

In LINE Developers:

1. Enable `Use webhook`.
2. Set the webhook URL.
3. Click webhook verification.

Expected behavior:

- valid signature returns `200`
- invalid signature returns `401`
- malformed JSON returns `400`

## User binding behavior

Current binding is intentionally minimal.

The app creates/updates `Customer.lineUserId` when:

1. LINE sends a webhook `follow` or `message` event with `source.userId`.
2. A customer opens `/line?target=book` or `/line?target=walk-in`; LIFF supplies an ID token, the server verifies it with LINE, and the verified subject is stored in a signed HttpOnly cookie for the destination action.

Direct `lineUserId` query parameters and hidden form values are intentionally ignored.

If the webhook creates a placeholder customer first, the later form submission updates that customer with the real customer name and phone.

Queue items store `lineUserIdSnapshot` at creation time so notification sending does not depend only on a mutable customer row.

## Notification behavior

The current notification events are:

- booking confirmed → `BOOKING_CONFIRMED`
- customer walk-in created → `QUEUE_CREATED`
- owner walk-in created → `QUEUE_CREATED`
- owner starts service → `QUEUE_NEAR`
- owner marks late → `LATE`
- owner cancels queue → `CANCELLED`
- owner marks no-show → `NO_SHOW`

Logging rules:

- no LINE identity → `channel=NONE`, `status=SKIPPED`
- LINE identity exists but no access token → `channel=LINE`, `status=SKIPPED`
- LINE push succeeds → `channel=LINE`, `status=SENT` (LINE API accepted; not confirmed delivery)
- LINE push fails → `channel=LINE`, `status=FAILED`

Notification failure must not block booking, walk-in, or owner status actions.

## Real-send smoke checklist

Use this only after credentials and webhook are configured.

1. Start the app with LINE env vars loaded.
2. Follow or message the LINE OA from a test LINE account.
3. Confirm webhook response is `200` and `boundUserCount` increments.
4. Create a booking or walk-in from `/line?target=book` or `/line?target=walk-in`.
5. Trigger a notification event such as owner start service.
6. Check:
   - the LINE account receives a message;
   - `NotificationLog` row is `channel=LINE`, `status=SENT`;
   - queue action still succeeds even if LINE fails.

## Local verification commands

Run from `app/`:

```bash
pnpm test:integration
pnpm e2e
pnpm typecheck
pnpm lint
pnpm prisma:validate
pnpm build
```

Webhook behavior is covered by:

```text
tests/integration/line-webhook-route.test.ts
```

Notification behavior is covered by:

```text
tests/integration/notification-service.test.ts
```

## Recommended next implementation slice

Add rich menu and customer notification polish:

1. Create rich menu buttons that point to `/line?target=book` and `/line?target=walk-in`.
2. Add customer-facing copy that confirms LINE notifications are connected.
3. Add a real-send smoke script or owner/dev-only test action if manual LINE testing becomes repetitive.
