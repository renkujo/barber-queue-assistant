# Queue Workspace V2 — Customer Booking Review

Status: technical QA passed; human-approved after booking truth and LINE privacy corrections.

## Scope

- `/book` opts into `data-customer-visual="v2"`.
- Service/date/time synchronization, preferred available date/slot selection, disabled occupied/past/time-blocked slots, customer fields, optional phone, LINE association, privacy acknowledgement, rate limit, server slot revalidation, notification, and successful tracking redirect remain unchanged.
- Service/date/time Select portals use the explicit V2 portal class.
- Repository-read slot fallback is fail-closed; it no longer invents available booking times.
- An intake repository fallback hides fallback services and presents a disabled read-only booking state.

## Authorized booking truth correction

Independent review found three pre-existing booking contradictions. Kiattisak explicitly approved the recommended correction:

- Global booking capability is separate from today’s availability, so today may be closed while a valid tomorrow booking remains enabled.
- Action errors now return inline state instead of redirecting away; service/date/time and customer fields remain intact while signed LINE identity stays in an HttpOnly cookie for retry.
- A date with no available slot holds an empty time value and disables submit instead of selecting an unavailable time.
- Service reads expose database/fallback source truth; partial service failure cannot present fallback services as current shop data.

## Authorized LINE privacy correction

The final review identified the legacy `lineUserId` query parameter as identity data in browser history/logs. Kiattisak explicitly approved migration to a signed transport:

- LIFF now sends its ID token to the server; the server verifies it with LINE, derives identity from the verified subject, then stores it in a domain-separated HMAC-signed, 10-minute, HttpOnly, `SameSite=Lax` cookie before navigating.
- `/book`, `/walk-in`, and `/line/owner` no longer accept LINE identity from query strings or hidden fields.
- Booking/walk-in server actions read their purpose-specific verified cookies and clear them after successful creation; recoverable errors leave the matching cookie available for retry. Owner binding uses a separate purpose-specific cookie and a route handler clears it after either successful or failed completion.
- Owner binding keeps only its separate signed 10-minute owner token in the URL; the token carries a random persisted nonce and is atomically consumed once.
- Name, phone, note, and LINE user ID are never copied into booking error URLs.

## Review files

Canonical form:

- `book-360x800.png`
- `book-390x844.png`
- `book-560x900.png`
- `book-760x900.png`
- `book-768x1024.png`
- `book-1024x768.png`
- `book-1440x1000.png`

States:

- `no-slot-today-390x844.png`
- `today-closed-tomorrow-open-390x844.png`
- `booking-closed-390x844.png`
- `no-services-390x844.png`
- `long-service-select-390x844.png`
- `long-service-select-viewport-390x844.png`
- `slot-error-390x844.png` — server-rendered progressive fallback with JavaScript disabled
- `action-error-preserved-390x844.png`

Geometry:

- `geometry.json`

All state captures restored the exact original `ShopSettings` and `Service` values in `finally`.

## Responsive ownership

- `360–759px`: summary guide appears before the single-column booking task.
- `>=760px`: booking form remains primary and the 220px summary guide becomes a sticky right rail.
- Exact geometry covers `360 / 390 / 559 / 560 / 759 / 760 / 1024 / 1440`.
- Inputs and Select triggers measure at least 48px; submit measures 52px.
- Portaled long service labels wrap inside the trigger-width menu without page or viewport overflow.
- Disabled slot options remain inspectable in the menu, but no disabled option becomes the submitted value.
- No horizontal overflow exists at any measured width.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 42/42 passed, including 5/5 LINE ID-token verification cases
- Booking V2 responsive/state/portal/keyboard/mixed-date/retry: 6/6 passed
- Full Playwright: 47/47 passed
- Existing customer booking → tracking → code/PIN lookup flow: passed
- Signed-cookie error retry → successful LINE-associated booking with optional phone omitted: passed

## Human decision recorded

Kiattisak approved customer booking and authorized customer walk-in migration.
