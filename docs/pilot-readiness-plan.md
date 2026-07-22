# Real-Shop Pilot Readiness Plan

Pilot boundary: **one real barber shop**, one owner/barber, and a small invited customer group. This repository is still single-shop; do not onboard a second shop without a tenant-isolation design and migration.

Measurement definitions, baseline, reporting cadence, and commercial-learning gates are specified in [`pilot-measurement-plan-r1.md`](./pilot-measurement-plan-r1.md). That document is a planning contract and does not by itself authorize instrumentation or schema changes.

Local Slices A–F validation evidence is recorded in [`evidence/pilot-instrumentation-r1-validation.md`](./evidence/pilot-instrumentation-r1-validation.md). It does not replace the unchecked production, external-storage, backup-lifecycle, human pre-collection, enablement, or pilot-execution gates below.

Synthetic operational validation—including portable restore ownership reconciliation and the bounded-role lifecycle—is recorded in [`evidence/pilot-precollection-operational-r1.md`](./evidence/pilot-precollection-operational-r1.md). Real production/R2/external-storage items remain unchecked.

## P0 — Must pass before inviting customers

- [ ] Deploy the latest migrations and confirm every `QueueItem` has a unique `publicToken`.
- [ ] Deploy outside operating hours with no real active queue. Pre-hardening `/queue/<database-id>` links are intentionally not accepted after deployment; clear smoke rows or reissue tracking links before reopening intake.
- [ ] Confirm `GET /api/queue/status` returns aggregate shop status only—no customer names, notes, phone numbers, queue IDs, or tracking tokens.
- [ ] Create a booking and walk-in; both tracking URLs must use UUID-like public tokens and show a masked customer name.
- [ ] Confirm queue-code lookup requires the four-digit access PIN, rejects phone digits as credentials, and rate-limits repeated attempts by both client IP and queue code.
- [ ] Create one phone-less customer queue and one phone-less owner queue; verify both can be recovered through PIN/link sharing.
- [ ] Confirm owner login, booking, and walk-in actions rate-limit repeated requests.
- [ ] Set `RATE_LIMIT_HASH_SECRET` to a random value different from the owner passcode/session secret.
- [ ] Set `NEXT_PUBLIC_PRIVACY_CONTACT` to the shop's real LINE URL, email, or phone contact.
- [ ] Open `/privacy` on mobile and verify the contact route works.
- [ ] Take a database backup and complete one isolated restore/current-migration/re-prune/subject-reconciliation rehearsal, then destroy the disposable project.
- [ ] Add an external uptime check for `https://<domain>/api/health`; it must alert on HTTP `503` as well as connection failure.
- [ ] Complete the production and LINE smoke checks in `docs/deployment-checklist.md`.
- [ ] Deploy instrumentation with `PILOT_MEASUREMENT_ENABLED=false` and prove source/quote/cohort/operation/event/notification pilot fields remain uncollected.
- [ ] Review and publish the revised Thai privacy disclosure before any enablement.
- [ ] Provision and revoke-test the exact bounded operator roles from a one-off private-network process; prove only CONNECT/USAGE/approved EXECUTE and preserve explicit application-role schema access. Operator credentials must not reach the web service or app `.env`.
- [x] Run the Daily Close schema validator, review its data dictionary, and approve the private empty-storage owner/viewer/access/deletion/hold/incident controls.
- [x] Approve and create the empty encrypted location in [`operations/pilot-daily-close-storage-proposal-r1.md`](./operations/pilot-daily-close-storage-proposal-r1.md); filled records remain blocked.
- [ ] Validate the reconciliation/trustworthy-day fixture and owner/operator-only aggregate report without PII.
- [ ] Complete prune, hold, correction, customer-deletion, multi-cohort expiry, backup-expiry, isolated-restore/re-prune, and old-image rollback proof.
- [ ] Obtain separate measurement enablement approval and separate owner agreement/pilot-execution approval.

## Pilot rollout

1. Start with 10–20 invited customers for 5–7 operating days.
2. Keep LINE/phone and a simple paper list available as the operational fallback.
3. Do not place the public QR/rich menu in broad channels until the first two operating days have no lost or duplicate queues.
4. At closing each day, record:
   - failed or duplicate booking/walk-in attempts;
   - difference between estimated and actual waiting time;
   - LINE `SENT`, `FAILED`, aged `PENDING`, and `SKIPPED` counts;
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
