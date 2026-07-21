# Design System V1 — Pastel Paper Queue

> Runtime status: retired for every promoted Queue Workspace V2 route. This document remains authoritative only for the intentionally unpromoted global non-queue 404 plus historical V1 asset/reference records. Current owner, owner-login, and customer route authority is [Global Design System V2 — Queue Workspace](./design-system-v2-queue-workspace.md).

## Direction

Pastel Paper Queue is the historical baseline direction for Barber Queue Assistant. Do not reintroduce its visual tokens into a promoted V2 route.

The product should feel soft, calm, local, and easy for a one-owner barber shop. It should not feel like enterprise salon software. Customer screens should reduce repeated questions. Owner screens should make queue decisions fast while the barber has little attention.

Reference image:

`docs/assets/concepts/pastel-paper-flow-board.png`

## Design principles

1. **Today first** — owner UI starts from the daily queue, not calendar analytics.
2. **One-tap clarity** — common owner actions should be large and obvious.
3. **Soft, not childish** — pastel colors are calm and warm, not candy-like.
4. **Readable Thai first** — Thai labels and queue numbers must scan quickly.
5. **Ticket identity** — subtle queue-ticket shapes and warm borders give character without decoration overload.
6. **LINE optional** — LINE notification status can appear, but the UI must work without LINE identity.

## Color tokens

| Token | Hex | Usage |
| --- | --- | --- |
| `paper` | `#FFF8EE` | App background, outer page |
| `surface` | `#FFFDF8` | Main card/form surface |
| `surface-warm` | `#FFF4E7` | Soft highlighted panels |
| `ink` | `#3A2D25` | Main text |
| `muted` | `#7A6A5D` | Secondary text |
| `line` | `#EADCCB` | Borders and dividers |
| `line-strong` | `#DCC7B4` | Active/important border |
| `primary` | `#E7A77C` | Primary CTA, selected slot |
| `primary-strong` | `#D88D62` | CTA hover/pressed |
| `primary-soft` | `#FCE2CD` | Primary soft background |
| `apricot` | `#F4C7A1` | Secondary warm accent |
| `butter` | `#F7E3A1` | Available slot / gentle highlight |
| `sage` | `#A8C7A1` | Open, ready, arrived, positive state |
| `mint` | `#DDEEDB` | Positive soft background |
| `rose` | `#E8A9A1` | Late/no-show warning |
| `rose-soft` | `#F9DEDA` | Warning soft background |
| `white` | `#FFFFFF` | Input inner surface only when needed |

### Color rules

- Primary buttons use `primary` with `ink`, not white text by default, unless contrast fails in implementation.
- Use `ink` instead of pure black.
- Warning uses dusty rose, not harsh red.
- Green states should stay sage/mint, not neon.
- Avoid adding blue unless it is explicitly for LINE branding and kept small.

## Typography

Selected Thai-first font: **LINE Seed Sans TH** from `https://seed.line.me/index_th.html`.

Local WOFF2 files are stored in:

- `docs/assets/fonts/line-seed-sans-th/` for docs/prototype use
- `app/public/fonts/line-seed-sans-th/` for the Next.js app

Recommended stack:

```css
font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
```

Type scale:

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| App title / screen h1 | 28-32px | 700 | Mobile screen title |
| Section title | 18-22px | 700 | Queue and form sections |
| Body | 15-16px | 400-500 | Main readable copy |
| Label | 13-14px | 600 | Form labels, small headings |
| Queue number | 44-64px | 750 | Position, queue code, wait time |
| Time/status number | 22-32px | 700 | Wait estimate, current service timer |

Typography rules:

- Use numbers as hierarchy for queue/time.
- Keep Thai labels short and direct.
- Do not use decorative script fonts.
- Do not use tiny text to fit more dashboard content.

## Radius, borders, shadows

| Surface | Radius | Border | Shadow |
| --- | --- | --- | --- |
| Main mobile card | 18-22px | 1px `line` | none or very soft |
| Queue ticket panel | 14-18px | 1px `line-strong` | optional subtle |
| Button/input | 10-12px | 1px when outlined | none |
| Small chip | 8-10px | 1px optional | none |
| Phone/prototype shell | 28-32px | mockup only | prototype only |

Shadow rule:

Use shadows rarely. Prefer borders and background contrast. If used, keep it warm and low opacity:

```css
box-shadow: 0 14px 36px -28px rgba(58, 45, 37, 0.32);
```

## Buttons

### Primary button

Use for main customer/owner action:

- `จองเวลา`
- `รับคิววันนี้`
- `ยืนยันคิว`
- `เสร็จแล้ว`

Style:

- background `primary`
- text `ink`
- radius 12px
- min height 48px customer, 52-56px owner critical action
- pressed state: `primary-strong`

### Secondary button

Use for safe alternatives:

- `ยกเลิก`
- `รอเพิ่ม`
- `ดูทั้งหมด`

Style:

- background `surface`
- border `line-strong`
- text `ink`

### Positive button

Use for arrival/confirmed states:

- `มาถึงแล้ว`
- `กำลังมา`

Style:

- background `mint`
- border `sage`
- text dark sage/cocoa

### Warning button

Use for no-show/late decision:

- `ไม่มา`
- `ยกเลิกคิว`

Style:

- background `rose-soft`
- border `rose`
- text `ink` or deeper rose-brown

## Form fields

- Label always above input.
- Placeholder can guide but cannot replace label.
- Input height: 44-48px.
- Border: 1px `line`.
- Focus: 2px soft primary outline or border `primary-strong`.
- Errors appear below input with rose text/background.

## Core components

### Shop status panel

Purpose: answer “ร้านเปิดไหม / คิวยาวไหม” before the customer messages owner.

Required content:

- shop open/paused/full state;
- current queue count;
- estimated wait;
- primary actions.

### Time slot button

States:

- available: surface + line;
- selected: apricot/primary-soft + primary border;
- blocked/full: muted surface + disabled text;
- owner-blocked: rose-soft if relevant.

### Queue ticket

Purpose: tracking screen identity.

Content:

- queue code;
- current position;
- estimated time;
- status note;
- coming/cancel actions.

Visual:

- ticket-like border or small clipped corner motif;
- large queue code/position;
- avoid dense text.

### Queue row

Owner daily queue list row.

Content:

- queue code or time;
- customer name;
- service;
- status/action;
- warning if late.

Rules:

- Do not badge every row heavily.
- Use background tint only for current, next, or warning rows.
- Time and status must scan quickly.

### Late/no-show warning

Use dusty rose. Show clear owner choices:

- wait more;
- move to waiting;
- mark no-show.

Do not auto-cancel without owner confirmation in MVP.

## Owner mobile layout

Priority order:

1. Current customer
2. Next customer
3. Late/no-show decision if any
4. Waiting/booked list
5. Add walk-in / pause / block time

Layout rules:

- Common actions at thumb-friendly lower area when possible.
- Large row height, not dense table.
- Owner action buttons should be at least 48px tall.
- Admin copy should be short: `กำลังตัด`, `คิวถัดไป`, `มาสาย`, `เสร็จแล้ว`.

## Customer mobile layout

Priority order:

1. Shop status
2. Queue/wait estimate
3. Book time / get today's queue
4. Available slots
5. Existing queue tracking

Layout rules:

- Public page should not require LINE.
- LINE notification note stays secondary.
- Main CTAs must be visible without scrolling on common phones if practical.

## Asset language

Use assets as supportive cues, not decoration everywhere.

Asset style:

- cocoa line art;
- soft pastel fills;
- barber pole, chair, scissors, queue ticket motifs;
- no emoji;
- no photo-real barber stock images for core UI;
- icons should be consistent stroke and simple enough for small screens.

Current generated asset pack:

`docs/assets/generated-v1/`

The older `docs/assets/ui/` SVG pack is draft/reference only and should not be used as the final asset direction. See `docs/assets/asset-manifest-v1.md`.
