# Owner Services Image Reference R1

Status: `PASS` — human owner approved visual direction  
Lifecycle: approved Phase 4 implementation reference  
Source brief: `docs/owner-services-phase4-brief.md`

Generate exactly:

1. `docs/assets/concepts/owner-services-r1/desktop-services-r1.png` — 1440×1000.
2. `docs/assets/concepts/owner-services-r1/mobile-services-r1.png` — 390×844.

## Product Contract

- One owner/one barber; this route maintains the service menu customers can choose from.
- Preserve service truths only: name, duration minutes, optional price, sort order, active/inactive status, per-service edit/save, soft disable/restore, and create one new active service.
- Preserve approved Pastel Paper Queue Owner Shell: warm paper, cocoa text, peach primary, sage positive state, dusty-rose caution, restrained borders/shadows, Thai-first utility typography.
- Do not invent categories, staff, appointments, packages, discounts, revenue, analytics, POS, inventory, drag-and-drop, bulk save, hard delete, or unsupported business claims.
- Use generic fictional Thai service examples only; do not reproduce local test entries such as Vitest services.

## Desktop

- Raw 1440×1000 screen, no device frame.
- Persistent Back Office sidebar with `บริการ` active.
- Compact header `ตั้งค่าบริการ`, short explanation, and `กลับตั้งค่าร้าน`.
- Main area: one connected service-menu workbench/table with aligned rows for all services and visible columns for service, duration, price, order, status, and actions.
- Demonstrate one selected/expanded row or inline editor using the authoritative edit fields: `ชื่อบริการ`, `ระยะเวลา (นาที)`, `ราคา (บาท)`, `ลำดับ`, `สถานะ`, and `บันทึกบริการ`.
- Right rail: `เพิ่มบริการ` form only, with name, duration, optional price, sort order, and `เพิ่มบริการ`.
- Include a quiet note that `ปิดใช้` is soft disable, not deletion.

## Mobile

- Raw 390×844 app screen, no phone frame.
- Mobile top bar and bottom navigation with `เพิ่มเติม` active.
- Compact header; services visible early as compact rows/disclosures with service, duration/price/order, and status.
- `เพิ่มบริการ` must be reachable early as a focused panel/action, not buried below the whole list.
- Show one expanded service editor/action area with the same authoritative fields and `บันทึกบริการ`, plus soft `ปิดใช้บริการ` or restore action.
- No horizontal table, no bulk-save implication, no hard delete, and no card-inside-card repetition.

## Direct Codex and QA Contract

- Use one fresh Direct Codex lane: `gpt-5.6-sol` with high reasoning.
- The active lane must use Codex built-in image generation directly.
- Generate exactly one Desktop image and one Mobile image. No retries, variants, corrections, nested agents, nested CLIs, or implementation edits.
- Inspect this contract, the source brief, current route source/CSS, and current rendered Desktop 1440×1000 / Mobile 390×844 baselines before generating.
- Do not edit `app/`, tests, runtime assets, existing design-system files, or product implementation.
- Stage exact PNGs above and write `docs/assets/concepts/owner-services-r1/qa.md` with provenance, dimensions, hashes, product-fit checks, visible Thai-text defects, and honest deviations.
- Stop for human `PASS`, `REVISE`, or `STOP`; no implementation follows automatically.

## Human Decision

Kiattisak approved the paired Desktop and Mobile Services direction under `PASS` on 2026-07-17. Runtime must clearly distinguish inactive status from its restore action, preserve every existing service action/condition, and use source strings/components rather than generated pixels.
