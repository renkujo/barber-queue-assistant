# Owner Responsive Shell Image Reference R1

Status: `PASS` — human owner approved visual direction  
Lifecycle: approved implementation reference  
Implementation permission: Phase 1 owner shell and `/owner` only  
Source brief: `docs/owner-responsive-shell-redesign-brief.md`

## Job

Generate two standalone high-fidelity UI concept images for human owner review before implementation:

1. `docs/assets/concepts/owner-responsive-shell-r1/desktop-backoffice-r1.png`
2. `docs/assets/concepts/owner-responsive-shell-r1/mobile-app-r1.png`

These images are references, not production assets and not proof of runtime behavior.

## Product Truth

- One owner is also the only barber.
- Desktop is a small-business back office used to arrange and manage the shop.
- Mobile is a daily-work app used one-handed between haircuts.
- The daily queue is the primary product object.
- Existing capabilities only: today queue, add walk-in, edit queue, current/next, open/close online intake, pause 30 minutes, adjust wait, availability, services, shop settings, closed queue disclosure, and LINE notification activity.
- Do not invent staff management, roles, branches, POS, inventory, revenue, analytics, charts, loyalty, or unsupported product claims.

## Shared Visual Direction

- Preserve Pastel Paper Queue identity.
- LINE Seed Sans TH-style Thai-first typography.
- Warm paper background, cocoa text, peach primary action, sage positive state, dusty-rose warning state.
- Restrained 1px borders, minimal shadows, flat operational surfaces.
- Soft and local, but not childish.
- No generic blue SaaS dashboard, glassmorphism, gradients, KPI card grid, excessive pills, nested card grid, or marketing hero.
- Use realistic Thai UI labels from the source brief. Do not include logos, balances, promotions, fake revenue, or live-business claims.
- Use generic fictional queue/customer examples only where needed to demonstrate hierarchy; do not reproduce names or notification entries from the current local screenshots.

## Desktop Concept

- Target visual viewport: 1440×1000 landscape.
- Persistent restrained left sidebar with:
  - `คิววันนี้`
  - `เพิ่มคิว`
  - `ตารางรับลูกค้า`
  - `บริการ`
  - `ตั้งค่าร้าน`
- Main workspace header: `คิววันนี้`, Thai date/context, live intake state, and one `เพิ่มคิว` action.
- Compact current/next operational strip.
- Dominant queue table with time, queue/customer, service/note, status, and contextual management action.
- Secondary right rail for wait adjustment, pause/intake controls, today summary, and recent LINE activity.
- Dense enough to feel like a real back office, but calm and readable for one owner.
- No chart, no analytics hero, and no enterprise admin metaphors.

## Mobile Concept

- Target visual viewport: 390×844 portrait, shown as the screen itself rather than a phone marketing mockup.
- Compact top app bar and live shop state.
- Current customer or next customer is the first meaningful operational object.
- Today queue becomes visible without management controls consuming the full first screen.
- One contextual primary action per queue item, thumb-friendly and at least visually equivalent to 48px height.
- Secondary actions use disclosure/sheet affordance rather than a permanent button grid.
- Persistent safe-area-aware bottom navigation:
  - `วันนี้`
  - `เพิ่มคิว`
  - `ตาราง`
  - `เพิ่มเติม`
- Must read as a mobile work app, not a desktop dashboard stacked vertically.

## Generation Contract

- Use Direct Codex `gpt-5.6-sol` with high reasoning.
- The active lane must use its built-in image-generation tool directly.
- Do not launch another CLI, tmux session, agent, or nested Codex process.
- Inspect the source brief and current implementation before generating.
- Current rendered screenshots may be used only as baseline evidence; redesign rather than trace them.
- Generate exactly one desktop concept and one mobile concept. No implicit variants or retries.
- Do not edit `app/`, runtime assets, existing design-system files, or product code.
- Write only the two staged PNGs above and a short QA receipt at:
  - `docs/assets/concepts/owner-responsive-shell-r1/qa.md`

## QA and Human Gate

Before reporting completion, inspect the actual PNG files and record:

- dimensions and file type;
- whether desktop and mobile visibly share one product identity;
- whether desktop reads as a small-business back office without enterprise bloat;
- whether mobile reads as an app and exposes the queue early;
- whether any unsupported product feature or misleading claim appears;
- known generated-text imperfections.

The human owner must decide `PASS`, `REVISE`, or `STOP`. No implementation follows automatically.

## Human Decision

Kiattisak approved the paired Desktop Back Office and Mobile App direction on 2026-07-17. Generated typography and icons remain non-authoritative; implementation must use real HTML text, source-owned icons, and the behavior-preservation boundary from the redesign brief.
