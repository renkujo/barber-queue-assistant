# Owner Services R1 — QA and Provenance

## Provenance

- Lane: Direct Codex `gpt-5.6-sol`, high reasoning effort.
- Generation path: Codex built-in image generation tool.
- Generation count: exactly one Desktop image generation and exactly one Mobile image generation.
- Variants/retries/corrections: none.
- The one-shot generated outputs were resampled once to the contract dimensions; no visual correction or additional generation was performed.
- These files are visual references only. Generated text and icons are non-authoritative.

## Files

| File | Dimensions | File type | SHA-256 |
| --- | ---: | --- | --- |
| `desktop-services-r1.png` | 1440×1000 | PNG (`image/png`) | `e41e0eef53046b3751d145e18658dae4d2c7c1046aab5ef733a64fe83140668c` |
| `mobile-services-r1.png` | 390×844 | PNG (`image/png`) | `90d8496b07c1344d6cfb2f812709d9844334b2be41ec82b527151fbd8a23a3e3` |

## Product-fit checks

- **Shared identity — PASS:** both concepts use the warm paper field, cocoa text, peach primary/active treatments, sage active states, dusty-rose inactive/caution treatment, restrained borders, and minimal shadow.
- **Desktop service workbench — PASS:** `บริการ` is active in the Back Office sidebar; the main area is one connected aligned service list with one expanded per-service editor; the `เพิ่มบริการ` form is isolated in the right rail.
- **Mobile service app — PASS:** the screen uses a compact top bar and bottom navigation with `เพิ่มเติม` active; services and `เพิ่มบริการ` appear early; one service editor is expanded without a horizontal table or repeated full-card editor anatomy.
- **Supported-feature boundary — PASS:** visible product content is limited to service name, duration, optional price, sort order, status, per-service save/disable or restore, and create-service access. No categories, staff, appointments, packages, discounts, revenue, analytics, POS, inventory, drag-and-drop, or bulk save are shown.
- **Soft-delete boundary — PASS with caveat:** both concepts say that `ปิดใช้` is temporary and does not delete data; neither shows a trash icon, delete action, or hard-delete wording. On Mobile, the inactive `โกนหนวด` row places the `ปิดใช้` status next to an `เปิดใช้` restore affordance without a strong visual separator, so the status/action distinction is slightly ambiguous.

## Visible generated-text and icon defects

- No obvious broken Thai glyphs were found in the principal title, field labels, service examples, or primary actions during visual inspection.
- Mobile renders `ปิดใช้` and `เปิดใช้` adjacent on the inactive service row; both strings are valid, but their roles are not labelled explicitly.
- Some generated icons are illustrative rather than source-owned, including the product/service pictograms and generic ellipsis/disclosure controls.
- Thai font metrics, letter spacing, line wrapping, icon geometry, and all rendered strings must be replaced by source strings, source-owned icons, and real UI components during any later implementation.

## Human gate

The human owner must choose **PASS**, **REVISE**, or **STOP**. No implementation follows automatically.

Human owner decision: **PASS** on 2026-07-17. Approved as Phase 4 implementation direction, not production UI pixels.
