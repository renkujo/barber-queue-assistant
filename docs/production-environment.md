# Production Environment Variables

Use these names in Haabiz/Dokploy. Do not commit real values.

```env
POSTGRES_DB=barber_queue_assistant
POSTGRES_USER=barber_queue
POSTGRES_PASSWORD=<strong-alphanumeric-database-password>
DATABASE_URL=postgresql://barber_queue:<POSTGRES_PASSWORD>@postgres:5432/barber_queue_assistant?schema=public

BARBER_ADMIN_PASSCODE=<owner-login-passcode>
BARBER_ADMIN_SESSION_SECRET=<long-random-secret>
RATE_LIMIT_HASH_SECRET=<different-long-random-secret>

NEXT_PUBLIC_PRIVACY_CONTACT=<shop-LINE-URL-email-or-phone>
CUSTOMER_DATA_RETENTION_DAYS=180

LINE_CHANNEL_SECRET=<LINE-Messaging-API-channel-secret>
LINE_CHANNEL_ACCESS_TOKEN=<LINE-Messaging-API-access-token>
NEXT_PUBLIC_LINE_LIFF_ID=<LIFF-ID>
```

Optional owner LINE fallback:

```env
OWNER_LINE_USER_ID=
```

Normally the owner should connect LINE through `/owner/settings`; the fallback variable is not required for the pilot.

Generate independent secrets with:

```bash
openssl rand -hex 32
```

`BARBER_ADMIN_SESSION_SECRET` and `RATE_LIMIT_HASH_SECRET` must not share a value. Keep `POSTGRES_PASSWORD` synchronized with the password embedded in `DATABASE_URL`.
