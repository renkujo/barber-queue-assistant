# Barber Queue Assistant — Lean Pilot Pack R1

Status: **prepared for human review; does not authorize pilot execution or filled records**

## One question

Can this app solve the real queue problem for one barber shop well enough that the owner wants to keep using it?

This is an idea-validation trial, not a launch of the final commercial product. Do not add multi-shop architecture, billing, enterprise operations, or new features unless a real pilot problem requires them.

## Trial shape

- One shop and one owner/barber.
- First controlled run: `5–7` operating days.
- Start with roughly `10–20` invited customers.
- Keep the shop's normal LINE/phone/paper fallback available.
- Keep pilot measurement instrumentation disabled for this first lean run.
- Kiattisak observes and summarizes; the barber should not become a data-entry operator.

## Before day 1

1. Walk through the [owner quick card](./operations/barber-owner-pilot-quick-card-r1.md) in about 15 minutes.
2. Confirm owner login, opening hours, services, booking/walk-in switches, and the public customer link.
3. Agree on one fallback: paper or the shop's existing LINE list.
4. Confirm the owner knows the stop conditions and whom to contact.
5. Do not broadly publish the QR/rich menu yet.

## Daily loop

### Opening — about 2 minutes

- Open `/owner` and confirm the queue page loads.
- Confirm today's opening hours/services and whether online booking/walk-in should be open.
- If the app is unavailable, use the agreed fallback; do not repeatedly submit the same queue.

### During service

- Let invited customers create or track their own queue when practical.
- The owner adds a queue manually when a customer comes through phone/chat/in person.
- Keep statuses truthful: `รออยู่` → `มาถึงแล้ว` → `กำลังตัด` → `เสร็จแล้ว`; use `มาสาย`, `ยกเลิก`, or `ไม่มา` only when true.
- Do not run both the app and a second normal queue list unless fallback is needed.
- If fallback is used, note only the count and reason—never customer details.

### Closing — no more than 3 minutes

After separate Pilot Execution and filled-record approval, Kiattisak records only:

1. How many real queues were handled outside the app?
2. Was there any lost, duplicate, conflicting, or wrong-customer queue?
3. Did customers repeatedly need help or ask where their queue was?
4. Roughly how much owner time was spent managing/answering queues?
5. Owner confidence today: `1–5`, plus one most important problem without customer details.

Do not fill the encrypted Daily Close CSV until Pilot Execution and filled-record collection are separately approved.

## What counts as evidence that the idea works

- No lost queue, accepted duplicate fixed slot, wrong-customer update, or public customer-data leak.
- The owner can run normal queue work from a phone without keeping a second list.
- Customers can create/track queues with less owner assistance.
- Paper/LINE/memory fallback becomes occasional rather than normal.
- The owner reports less repeated answering, less confusion, or less queue-management time.
- After the controlled run, the owner chooses to continue using it rather than being persuaded to continue.

The first run does not need statistically perfect metrics. It needs enough real evidence to choose a direction honestly.

## Stop immediately when

- a queue disappears or a fixed booking is accepted twice;
- the owner updates the wrong customer;
- customer information is exposed to another customer;
- the owner cannot recover the day's active queue;
- the app creates more confusion than the fallback process.

Switch to the agreed fallback, preserve the time and symptom without customer details, and stop broad use until the problem is understood.

## Decision after 5–7 operating days

Choose exactly one:

- **Continue** — the core workflow is useful; run a longer validation and then test commercial value.
- **Revise** — the problem is real but one or two workflow failures block adoption; fix only those.
- **Stop** — the app does not materially improve the shop's queue work.

If the result is positive, the next project phase is productization: reliable onboarding, multi-shop/tenant design, commercial packaging, pricing, billing, stronger production operations, and scalable support. Do not build those before the shop evidence supports them.

## Authorization boundary

This pack authorizes no customer invitation, owner agreement, filled Daily Close record, measurement enablement, LINE/R2 change, pricing offer, or pilot execution. Those remain separate human gates.
