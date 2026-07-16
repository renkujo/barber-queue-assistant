# Real-Shop Pilot Readiness Plan

Pilot boundary: **one real barber shop**, one owner/barber, and a small invited customer group. This repository is still single-shop; do not onboard a second shop without a tenant-isolation design and migration.

## P0 — Must pass before inviting customers

- [ ] Deploy the latest migrations and confirm every `QueueItem` has a unique `publicToken`.
- [ ] Deploy outside operating hours with no real active queue. Pre-hardening `/queue/<database-id>` links are intentionally not accepted after deployment; clear smoke rows or reissue tracking links before reopening intake.
- [ ] Confirm `GET /api/queue/status` returns aggregate shop status only—no customer names, notes, phone numbers, queue IDs, or tracking tokens.
- [ ] Create a booking and walk-in; both tracking URLs must use UUID-like public tokens and show a masked customer name.
- [ ] Confirm queue-code lookup requires the last four phone digits and rate-limits repeated attempts.
- [ ] Confirm owner login, booking, and walk-in actions rate-limit repeated requests.
- [ ] Set `RATE_LIMIT_HASH_SECRET` to a random value different from the owner passcode/session secret.
- [ ] Set `NEXT_PUBLIC_PRIVACY_CONTACT` to the shop's real LINE URL, email, or phone contact.
- [ ] Open `/privacy` on mobile and verify the contact route works.
- [ ] Take a database backup and complete one restore rehearsal in a disposable/staging Compose project.
- [ ] Add an external uptime check for `https://<domain>/api/health`; it must alert on HTTP `503` as well as connection failure.
- [ ] Complete the production and LINE smoke checks in `docs/deployment-checklist.md`.

## Pilot rollout

1. Start with 10–20 invited customers for 5–7 operating days.
2. Keep LINE/phone and a simple paper list available as the operational fallback.
3. Do not place the public QR/rich menu in broad channels until the first two operating days have no lost or duplicate queues.
4. At closing each day, record:
   - failed or duplicate booking/walk-in attempts;
   - difference between estimated and actual waiting time;
   - LINE `SENT`, `FAILED`, and `SKIPPED` counts;
   - owner corrections, reorders, cancellations, and fallback events;
   - customer confusion or support questions.
5. Stop online intake immediately if customer identity is exposed, a booking disappears, duplicate fixed slots are accepted, or the owner cannot recover the day's queue.

## Pilot success gate

- No customer PII exposed through public pages or APIs.
- No lost booking and no accepted double-booked fixed slot.
- Backup exists and restore rehearsal is documented.
- Owner can operate the active queue from a phone without a second system for normal cases.
- Every failed LINE notification remains visible in `NotificationLog` and has a manual-contact fallback.
- Median wait-estimate error is understood and acceptable to the shop; target ≤ 20 minutes for the first pilot.
- The shop explicitly chooses `continue`, `revise`, or `stop` after the pilot review.

## Explicitly out of scope

- Multiple shops/tenants, multiple staff, payments/deposits, loyalty, inventory, marketplace, and broad analytics.
- Automatic LINE retry workers. During pilot, failed notification logs require owner review/manual contact.
