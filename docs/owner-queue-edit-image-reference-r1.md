# Owner Queue Edit Image Reference R1

Status: `DRAFT` — awaiting human visual decision  
Lifecycle: Phase 6 visual reference preparation only  
Source brief: `docs/owner-queue-edit-phase6-brief.md`

Generate exactly:

1. `docs/assets/concepts/owner-queue-edit-r1/desktop-queue-edit-r1.png` — 1440×1000.
2. `docs/assets/concepts/owner-queue-edit-r1/mobile-queue-edit-r1.png` — 390×844.

## Product Contract

- One owner/one barber; this route edits one existing queue item from the owner queue.
- Preserve only the real editable fields/actions:
  - `ชื่อลูกค้า` / customer name;
  - `เบอร์โทร` optional;
  - `บริการ` active service select showing service, duration, price;
  - `วัน` select from current/today/tomorrow options;
  - `เวลา` select with locked times and `ไม่ล็อกเวลา / walk-in`;
  - `หมายเหตุลูกค้า` customer-facing note;
  - `โน้ตเจ้าของร้าน` private owner-only note;
  - one `บันทึกการแก้ไข` form action.
- Preserve support truths only: error notice/toast for invalid/conflict/outside-hours/database, `กลับคิววันนี้`, and factual save-rule guidance.
- Preserve conflict/business rules: locked time is checked against other active locked queue items and shop breaks/time blocks; outside business hours is rejected unless keeping existing locked time; walk-in can be left unlocked.
- Preserve privacy: owner note is internal and must never look like a LINE/customer message.
- Preserve approved Pastel Paper Queue Owner Shell: warm paper, cocoa text, peach primary, sage positive state, dusty-rose caution, restrained borders/shadows, Thai-first utility typography.
- Do not invent status changes, LINE send/resend controls, payment/POS, customer CRM, staff/barber assignment, analytics, promotions, delete/cancel controls, bulk editing, unsupported warnings, or extra fields.
- Use generic fictional Thai values only; do not reproduce private local data beyond the safe Phase 6 test labels.

## Desktop

- Raw 1440×1000 screen, no device frame.
- Persistent Back Office sidebar with `คิววันนี้` active.
- Compact header `แก้ไขคิว QE_EDIT`, customer/status summary, and `กลับคิววันนี้`.
- Main area: one connected edit workbench grouped into customer identity, schedule lock, and notes.
- Show all seven authoritative fields and the single `บันทึกการแก้ไข` action.
- Make service/date/time prominent and understandable; include the no-lock/walk-in option as a normal owner override path.
- Right rail: compact factual cards for conflict check, business-hours rule, walk-in no-lock, and private owner note.
- Show one visible conflict warning state without implying the conflict has been automatically fixed.
- No charts, metrics, customer history, status action buttons, LINE send action, or delete/cancel controls.

## Mobile

- Raw 390×844 app screen, no phone frame.
- Mobile top bar and bottom navigation with `วันนี้` active.
- Compact ticket header; editable controls visible early.
- Show the same real fields with mobile-friendly grouping; prioritize service/date/time and note privacy before save.
- One save action only; no autosave, no separate schedule save, no sticky button covering bottom nav.
- Touch targets must read as thumb-friendly; bottom navigation must not cover actionable content.

## Direct Codex and QA Contract

- Use one fresh Direct Codex lane: `gpt-5.6-sol` with high reasoning.
- The active lane must use Codex built-in image generation directly.
- Generate exactly one Desktop image and one Mobile image. No retries, variants, corrections, nested agents, nested CLIs, or implementation edits.
- Inspect this contract, the source brief, current route source/CSS, and current rendered Desktop 1440×1000 / Mobile 390×844 baselines before generating.
- Do not edit `app/`, tests, runtime assets, existing design-system files, or product implementation.
- Stage exact PNGs above and write `docs/assets/concepts/owner-queue-edit-r1/qa.md` with provenance, dimensions, hashes, product-fit checks, visible Thai-text defects, and honest deviations.
- Stop for human `PASS`, `REVISE`, or `STOP`; no implementation follows automatically.

## Human Decision

`PASS` — approved for authenticated Phase 6 implementation.
