# Owner Walk-in Image Reference R1

Status: `PASS` — human owner approved visual direction  
Lifecycle: approved Phase 2 implementation reference  
Implementation permission: `/owner/walk-in` only  
Source brief: `docs/owner-walk-in-phase2-brief.md`

## Job

Generate exactly two standalone high-fidelity UI concept images for human owner review:

1. `docs/assets/concepts/owner-walk-in-r1/desktop-workbench-r1.png`
2. `docs/assets/concepts/owner-walk-in-r1/mobile-task-r1.png`

## Shared Product and Brand Contract

- One owner is also the only barber.
- This route manually adds one customer into today’s queue.
- Visible form truth only: required service, required customer name, optional phone, optional note, and submit `เพิ่มเข้าคิววันนี้`.
- Preserve the approved Owner Shell and Pastel Paper Queue language: warm paper, cocoa text, peach primary, restrained borders, minimal shadow, Thai-first utility typography.
- No staff, appointment time, payment, POS, loyalty, analytics, customer history, priority, unsupported automation, marketing claims, or invented operational data.
- Use generic fictional form content only. Do not reproduce local database customer names or test service entries.

## Desktop Concept

- Visual viewport: 1440×1000 landscape, screen only.
- Preserve approved persistent sidebar and mark `เพิ่มคิว` active.
- Compact workspace header with `เพิ่มคิว`, short explanation, and `กลับคิววันนี้`.
- One dominant connected form surface; service full-width, customer name required, phone optional, note optional.
- Selected example service may be `ตัดผมชาย · 30 นาที · 250 บาท`.
- Quiet side rail: selected-service summary and concise `หลังเพิ่มคิว` explanation only.
- Full-width peach submit belongs to the form.
- Must read as a compact small-business workbench, not a CRM dashboard.

## Mobile Concept

- Visual viewport: 390×844 portrait, raw app screen only; no phone mockup.
- Preserve shared mobile top bar and bottom navigation with `เพิ่มคิว` active.
- Compact inline task header rather than a large separate card.
- Show all four authoritative fields with realistic Thai labels and restrained required/optional cues.
- Form uses one flat task surface rather than cards inside cards.
- Sticky `เพิ่มเข้าคิววันนี้` action sits above bottom navigation and does not cover fields.
- Must feel like a focused one-handed mobile task, not a desktop form stacked vertically.

## Direct CLI Contract

- Use Direct Codex `gpt-5.6-sol` high and its built-in image-generation tool directly.
- The active lane must not launch another CLI, tmux session, Codex process, subagent, or nested agent.
- Inspect the source brief, current route implementation, owner-shell components/CSS, and attached Mobile/Desktop baseline screenshots.
- Generate exactly one Desktop and one Mobile image. No variants, retries, corrections, implementation, or promotion.
- Do not edit `app/`, source code, runtime assets, existing design-system docs, or the two source brief/contract files.
- Copy generated PNGs to the exact staged paths above and write factual QA to `docs/assets/concepts/owner-walk-in-r1/qa.md`.

## Human Gate

Record dimensions, file type, shared identity, task hierarchy, supported-feature check, Thai generated-text caveats, and any visible composition deviations. Stop for human `PASS`, `REVISE`, or `STOP`; no implementation follows automatically.

## Human Decision

Kiattisak approved the paired Desktop Workbench and Mobile Task direction under `PASS` on 2026-07-17. Generated typography/icons remain non-authoritative; runtime implementation must use source strings/components and prove sticky action, keyboard, safe-area, and 360px behavior.
