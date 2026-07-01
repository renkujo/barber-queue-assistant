# LINE OA Setup Guide

This guide is for connecting the current Barber Queue Assistant notification foundation to a real LINE Official Account.

The app still works without LINE. If LINE config or `lineUserId` is missing, queue actions continue normally and notification attempts are recorded as skipped in `NotificationLog`.

## Current implementation status

Implemented:

- LINE webhook route: `app/src/app/api/line/webhook/route.ts`
- Signature verification with `LINE_CHANNEL_SECRET`
- Basic user binding from webhook `follow` / `message` events via `source.userId`
- Optional `lineUserId` query support on `/book` and `/walk-in`
- Queue notification boundary and `NotificationLog` recording
- LINE push wrapper for text messages
- Tests for notification logs, user binding, and webhook signatures

Not implemented yet:

- LIFF SDK profile login
- LINE rich menu creation automation
- Deep-link tracking from rich menu into a specific user session
- Owner-facing notification settings UI
- Production retry queue for failed LINE pushes

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
```

Do not commit real values.

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
2. A customer opens `/book?lineUserId=...` or `/walk-in?lineUserId=...` and submits the form.

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
- LINE push succeeds → `channel=LINE`, `status=SENT`
- LINE push fails → `channel=LINE`, `status=FAILED`

Notification failure must not block booking, walk-in, or owner status actions.

## Real-send smoke checklist

Use this only after credentials and webhook are configured.

1. Start the app with LINE env vars loaded.
2. Follow or message the LINE OA from a test LINE account.
3. Confirm webhook response is `200` and `boundUserCount` increments.
4. Create a booking or walk-in using a URL that includes the test `lineUserId`, or implement the LIFF/rich-menu entry slice first.
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

Add a real LINE entry strategy:

1. Decide whether MVP uses LIFF SDK or signed rich-menu links first.
2. If LIFF: add profile retrieval and inject `lineUserId` into `/book` / `/walk-in` entry state.
3. If rich-menu link first: document the limitation that LINE user id is not automatically available from a normal web link.
4. Add a visible customer hint that LINE notifications are enabled only after LINE identity is connected.
