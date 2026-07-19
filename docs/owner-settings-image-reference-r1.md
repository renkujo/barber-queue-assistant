# Owner Settings Image Reference R1

Status: `APPROVED` — human visual `PASS` recorded  
Lifecycle: Phase 5 visual reference approved for implementation  
Source brief: `docs/owner-settings-phase5-brief.md`

Generate exactly:

1. `docs/assets/concepts/owner-settings-r1/desktop-settings-r1.png` — 1440×1000.
2. `docs/assets/concepts/owner-settings-r1/mobile-settings-r1.png` — 390×844.

## Product Contract

- One owner/one barber; this route controls shop settings and owner channel links.
- Preserve only the real settings fields/actions:
  - `ชื่อร้าน` / shop name;
  - `เวลาเปิด` and `เวลาปิด`;
  - `ระบบรับคิวออนไลน์` open/closed;
  - `จองล่วงหน้าออนไลน์` open/closed;
  - `บัตรคิวออนไลน์วันนี้` open/closed;
  - `เวลารอที่ตั้งเอง` optional `0–240`, blank = calculated queue wait;
  - one `บันทึกตั้งค่า` form action.
- Preserve support/channel truths only: setting-effect guidance, owner LINE connection status/action, link to `ตั้งค่าวันรับคิว`, and link to `จัดการบริการ`.
- Preserve approved Pastel Paper Queue Owner Shell: warm paper, cocoa text, peach primary, sage positive state, dusty-rose caution, restrained borders/shadows, Thai-first utility typography.
- Do not invent staff, branches, payment/POS, analytics, revenue, reports, QR promotions, extra notification channels, customer marketing automation, inventory, reviews, discounts, or unsupported business claims.
- Use generic fictional Thai shop values only; do not reproduce private local data beyond generic labels visible in source.

## Desktop

- Raw 1440×1000 screen, no device frame.
- Persistent Back Office sidebar with `ตั้งค่าร้าน` active.
- Compact header `ตั้งค่าร้าน`, short description, and `กลับคิววันนี้`.
- Main area: connected settings workbench with aligned groups for shop identity/hours, online intake controls, and wait-time override.
- Show all six authoritative fields and the single `บันทึกตั้งค่า` action.
- Right rail: compact factual cards for `ผลของการตั้งค่า`, `LINE เจ้าของร้าน`, `วันรับจอง / หน้าร้าน`, and `บริการ`.
- LINE card must show connected or unconnected status and a reconnect/connect action without claiming messages were sent.
- No chart, no metric card, no enterprise admin metaphors, no fake integrations.

## Mobile

- Raw 390×844 app screen, no phone frame.
- Mobile top bar and bottom navigation with `เพิ่มเติม` active.
- Compact task header; settings controls visible early.
- Show the same real fields with mobile-friendly grouping; one save action only.
- Surface LINE, availability, and services as compact rows/panels reachable early enough to read as a settings hub, not buried after all content.
- No horizontal table, no autosave implication, no separate route invention, no card-inside-card repetition.
- Save and channel actions must read as thumb-friendly; bottom navigation must not cover actionable content.

## Direct Codex and QA Contract

- Use one fresh Direct Codex lane: `gpt-5.6-sol` with high reasoning.
- The active lane must use Codex built-in image generation directly.
- Generate exactly one Desktop image and one Mobile image. No retries, variants, corrections, nested agents, nested CLIs, or implementation edits.
- Inspect this contract, the source brief, current route source/CSS, and current rendered Desktop 1440×1000 / Mobile 390×844 baselines before generating.
- Do not edit `app/`, tests, runtime assets, existing design-system files, or product implementation.
- Stage exact PNGs above and write `docs/assets/concepts/owner-settings-r1/qa.md` with provenance, dimensions, hashes, product-fit checks, visible Thai-text defects, and honest deviations.
- Stop for human `PASS`, `REVISE`, or `STOP`; no implementation follows automatically.

## Human Decision

Human visual `PASS` recorded. Use the references as approved direction for the `/owner/settings` implementation, with source HTML strings and product behavior remaining authoritative.
