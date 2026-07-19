# Design System V2 - Owner Queue Board

## Direction

Owner Queue Board is the refined owner-side direction for Barber Queue Assistant. It keeps the Pastel Paper Queue foundation, but makes the owner dashboard more operational, list-first, and faster to scan on both mobile and desktop.

The owner screen should feel like a calm daily work board for a one-owner barber shop. It should not look like a generic SaaS admin dashboard.

Primary reference:

- Selected mobile mockup from Image Gen: queue-board layout with status strip, current/next summary, and today queue list.
- Desktop adaptation: wide queue board with a restrained side rail for quick actions and summary.

## Product Principles

1. **Queue board first** - the daily queue is the main object. Do not bury it under analytics, cards, or navigation.
2. **Next action clarity** - the most likely next owner action must be obvious within 1 second.
3. **Mobile is primary** - owner may use the app between haircuts, with one hand and limited attention.
4. **Desktop is a small-business back office** - desktop adds persistent navigation, comparison density, and management breadth for the same owner, without enterprise analytics, staff roles, or salon-suite complexity.
5. **Soft operational tone** - warm, local, approachable, but still precise enough for queue control.
6. **Thai first** - Thai labels, queue codes, times, and status chips must be readable before decorative polish.
7. **Destructive actions stay quiet** - cancel/no-show actions are visible but never compete with the expected next action.

## Visual Tokens

Use the existing V1 tokens as the base. V2 tightens usage for the owner queue board.

### Color

| Token | Hex | V2 Usage |
| --- | --- | --- |
| `paper` | `#FFF8EE` | Full app background |
| `surface` | `#FFFDF8` | Main board surface, table/list rows |
| `surface-warm` | `#FFF4E7` | Status strip, quiet highlight areas |
| `ink` | `#3A2D25` | Main text |
| `muted` | `#7A6A5D` | Secondary text, inactive icons |
| `line` | `#EADCCB` | Row dividers, subtle borders |
| `line-strong` | `#DCC7B4` | Board border, active outlines |
| `primary` | `#E7A77C` | Main CTA background, active left rail |
| `primary-strong` | `#D88D62` | CTA hover/pressed, active time text |
| `primary-soft` | `#FCE2CD` | Confirmed chip, light active state |
| `sage` | `#A8C7A1` | Open/positive indicator border |
| `mint` | `#DDEEDB` | Positive status chip background |
| `rose` | `#E8A9A1` | Destructive/warning border |
| `rose-soft` | `#F9DEDA` | Destructive/warning chip background |
| `white` | `#FFFFFF` | Only for inner controls when needed |

### Color Rules

- `primary` is reserved for the next expected action, especially `เริ่มตัด`.
- `primary-soft` can mark confirmed/active context, but do not turn every row peach.
- `mint`/`sage` means available, open, arrived, or currently serving.
- `rose`/`rose-soft` only means risk or destructive action: late, cancel, no-show.
- Do not introduce blue, purple, neon green, dark dashboard navy, or heavy gradients.

## Typography

Font stack:

```css
font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
```

### Type Scale

| Role | Mobile | Desktop | Weight | Notes |
| --- | --- | --- | --- | --- |
| Brand title | 26-30px | 24-28px | 800 | `Barber Queue` |
| Page title | 34-40px | 34-44px | 800 | `รายการวันนี้` |
| Section title | 18-22px | 20-24px | 800 | Board/sidebar titles |
| Queue code | 26-34px | 24-32px | 800 | Must scan faster than customer notes |
| Time | 22-28px | 20-26px | 800 | Use tabular numeric style |
| Body | 16-18px | 15-17px | 500-600 | Thai labels and notes |
| Label/chip | 14-16px | 13-15px | 700 | Short status labels |
| Table header | 14-16px | 14-16px | 600 | Muted, not dominant |

### Typography Rules

- Queue code and time are the strongest row anchors.
- Keep Thai labels short: `คิววันนี้`, `ตอนนี้ว่าง`, `ถัดไป`, `กำลังตัด`, `รอคิว`.
- Avoid tiny table text just to fit more columns.
- Do not use negative letter spacing.

## Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | 4px | Icon/text micro gap |
| `space-2` | 8px | Chip/button inner gap |
| `space-3` | 12px | Row cell gap |
| `space-4` | 16px | Default section padding |
| `space-5` | 20px | Board row vertical rhythm |
| `space-6` | 24px | Section gap |
| `space-8` | 32px | Desktop major gap |
| `space-10` | 40px | Desktop page gutters |

### Layout Widths

- Mobile viewport target: `390px`.
- Tablet breakpoint: `760px`.
- Desktop breakpoint: `1180px`.
- Desktop max content width: `1280-1360px`.
- Right side rail width: `280-340px`.

## Radius, Borders, Elevation

| Element | Radius | Border | Shadow |
| --- | --- | --- | --- |
| Page status strip | 22-24px | 1px `line-strong` | none |
| Summary strip | 18-20px | 1px `line-strong` | none |
| Queue board | 18-22px | 1px `line-strong` | none |
| Queue row | 0 inside board | divider only | none |
| Active row rail | 0 radius or 999px end caps | none | none |
| Button | 12-16px | 1px optional | very subtle only |
| Chip | 10-12px | 1px optional | none |
| Icon button | 16px | 1px `line-strong` | none |

Rule: prefer row dividers and spacing over nested cards. The queue list is one board, not many cards.

## Core Components

### Owner App Header

Purpose: orient the owner without stealing attention from the queue.

Content:

- App icon/avatar.
- `Barber Queue`.
- `Owner mode`.
- Settings/menu icon buttons on the right.

Rules:

- Header height should stay compact.
- Do not add a large sidebar on mobile.
- Desktop can keep header top-aligned instead of a heavy permanent sidebar.

### Shop Status Strip

Purpose: show whether the shop is accepting queue activity now.

Required content:

- Green dot.
- `ร้านเปิดอยู่`.
- `รับคิวถึง 18:20`.
- Action: `พัก 30 นาที`.

States:

- Open: green dot, mint/sage accent.
- Paused: butter or warm state, text `พักร้านอยู่`.
- Closed/full: rose-soft only when action is blocked.

Rules:

- This strip is operational, not marketing copy.
- Keep it one row on desktop.
- On mobile, split into two balanced halves if needed.

### Current / Next Summary

Purpose: answer "what is happening now?" and "who is next?"

Default empty-current content:

- `ตอนนี้ว่าง`.
- `รอลูกค้าคนถัดไป`.
- No dominant disabled buttons.

Next content:

- Label `ถัดไป`.
- Queue code, e.g. `A01PZ AA`.
- Optional customer/service note.
- Optional customer icon.

Rules:

- Current and next can share one summary strip.
- If no current customer exists, next queue should visually guide the owner to start from the queue board.
- Avoid duplicating the same primary action in both summary and list unless one is clearly secondary.

### Queue Board

Purpose: main owner work surface.

Required content:

- Title `รายการวันนี้`.
- Count: `8 คิวในระบบวันนี้`.
- Action: `เพิ่ม walk-in`.
- Columns or row fields: time, queue, service/note, status, manage.

Desktop structure:

- Table-like board.
- Header row visible.
- Rows separated by thin dividers.
- First/active row can expand vertically for secondary actions.

Mobile structure:

- Still one board, but rows become stacked:
  - time + status line;
  - queue code + edit;
  - note/service;
  - actions.

Rules:

- The board is the hero.
- Do not place each queue row in its own outer card.
- Use one active row rail for the currently actionable row.
- Do not badge every row heavily.

### Queue Row

Row fields:

- Time: `10:30`.
- Queue code: `A01PZ AA`.
- Note/service: `something!!` or service name.
- Optional edit action.
- Status chip.
- Contextual action.

States:

| State | Visual Treatment | Primary Action |
| --- | --- | --- |
| Confirmed/next | subtle peach rail, `primary-soft` chip | `เริ่มตัด` |
| Current/in progress | mint status chip, active rail | `เสร็จ` or `เริ่มตัด` depending workflow |
| Waiting | neutral row, warm chip | `รอคิว` or no dominant action |
| Late | rose-soft cue | `สาย`, `ไม่มา`, `รอเพิ่ม` |
| Done/cancelled | remove from active board or de-emphasize in history |

Rules:

- First actionable row may be taller.
- Destructive buttons sit second row or quiet right area.
- `ยกเลิก` should not share primary color.
- `แก้ไข` is a small inline affordance, not a main button.

### Buttons

#### Primary Owner Action

Use for:

- `เริ่มตัด`.
- `เสร็จ` when a customer is actively being served.

Style:

- Background `primary` or `primary-strong`.
- Text `ink`.
- Border slightly darker than background.
- Min height: 52px mobile, 48px desktop.
- Width: full row action on mobile, fit-content on desktop.

#### Secondary Action

Use for:

- `รอคิว`.
- `มาถึงแล้ว`.
- `พัก 30 นาที`.
- `รีเฟรช`.

Style:

- Surface or surface-warm background.
- `line-strong` border.
- Text `ink`.

#### Warning / Destructive Action

Use for:

- `สาย`.
- `ยกเลิก`.
- `ไม่มา`.

Style:

- `ยกเลิก`: white/surface background, `rose` text or icon, `line-strong` border.
- `สาย`: neutral/warm outline with warning icon.
- Use confirm dialog before destructive updates.

### Status Chips

Examples:

- `ร้านเปิดอยู่`
- `ยืนยันแล้ว`
- `กำลังตัด`
- `รอคิว`
- `มาสาย`

Rules:

- Chips should be short and readable.
- Avoid all-caps styling.
- Do not rely on color alone; the label text must carry the state.

### Right Side Rail - Desktop Only

Purpose: expose helpful owner controls without competing with the queue board.

Suggested panels:

- `การทำงานเร็ว`: `เพิ่มคิว`, `พักร้าน`, `รีเฟรช`.
- `สรุปวันนี้`: `คิวทั้งหมด 8`, `กำลังตัด 1`, `รอคิว 7`.

Rules:

- Side rail is secondary.
- Keep panels flat and quiet.
- No chart cards.
- Do not add analytics until the workflow needs them.

### Footer Status

Purpose: reassure owner that queue state is fresh.

Content:

- `อัปเดตล่าสุด 10:12`.
- `รีเฟรช`.

Rules:

- Mobile footer can be sticky or fixed near bottom if it does not cover actions.
- Desktop footer can sit below the board.

## Responsive Rules

### Mobile: 320-559px

Order:

1. Header.
2. Shop status strip.
3. Current/next summary.
4. Queue board title + add walk-in.
5. Queue rows.
6. Footer status.

Rules:

- Hide unfinished nav items.
- Avoid a permanent sidebar.
- Stack queue row cells.
- Make the active row action full width.
- Keep destructive actions below the primary action.

### Tablet: 560-1179px

Rules:

- Keep top structure similar to mobile.
- Queue board may show partial table columns.
- Add walk-in remains near the board title.
- Avoid right rail unless there is enough space.

### Desktop: 1180px+

Layout:

```text
Header
Status strip
Current/next summary
Main grid: queue board 1fr + side rail 300px
Footer status
```

Rules:

- Queue board gets the most width.
- Side rail is useful but visually quiet.
- Table header appears.
- More rows can fit without shrinking typography.

## Interaction Rules

- Owner should be able to start the next cut in 1-2 taps.
- Never show disabled primary buttons as the strongest visual element.
- Do not duplicate `เริ่มตัด` with equal weight in multiple places.
- If a row is promoted as active/current/next, other instances of the same action should be secondary or hidden.
- Use confirmation dialogs for `ยกเลิก`, `ไม่มา`, and status changes that remove a queue from the board.
- After status update, show toast and refresh the board state.

## Accessibility Rules

- Minimum touch target: 44px, preferred 48-52px for owner actions.
- Text contrast must work on pastel backgrounds.
- Status must be expressed in text, not color alone.
- Focus outlines use `primary-strong`.
- Dialogs must trap focus and return focus to the triggering button.
- Table/list reading order should match visual order: time, queue, note, status, actions.
- Icons are decorative unless they add unique information; pair them with visible labels.

## Implementation Mapping

Likely code touch points:

- `app/src/app/owner/page.tsx`
  - Restructure owner page into status strip, summary strip, queue board, and optional desktop rail.
  - Reduce duplicated row/card actions.
- `app/src/app/owner/owner-navigation.tsx`
  - Remove or disable unfinished `บริการ` / `ตั้งค่า` links until routes exist.
  - Prefer compact header commands for owner mobile.
- `app/src/components/barber/app-ui.tsx`
  - Add owner board primitives: `OwnerStatusStrip`, `OwnerSummaryStrip`, `OwnerQueueBoard`, `OwnerQueueRow`, `OwnerSideRail`.
- `app/src/app/globals.css`
  - Add owner V2 responsive layout and component classes.
  - Keep V1 tokens; add only V2 aliases when they clarify usage.

Suggested class family:

```css
.bqa-owner-v2-shell {}
.bqa-owner-topbar {}
.bqa-owner-status-strip {}
.bqa-owner-summary-strip {}
.bqa-owner-board-grid {}
.bqa-owner-queue-board {}
.bqa-owner-queue-row {}
.bqa-owner-queue-row--active {}
.bqa-owner-side-rail {}
```

## CSS Token Starter

```css
:root {
  --owner-board-max: 1360px;
  --owner-rail-width: 320px;
  --owner-active-rail: var(--primary-strong);
  --owner-row-height: 88px;
  --owner-row-active-min: 148px;
  --owner-radius-board: 22px;
  --owner-radius-strip: 24px;
}
```

## Do / Don't

Do:

- Make `รายการวันนี้` the strongest object on the page.
- Keep the active row visually special.
- Use `เพิ่ม walk-in` as a compact but easy-to-find command.
- Let desktop show more rows and a light side rail.
- Keep mobile one-hand friendly.

Don't:

- Build a KPI dashboard.
- Put every row in a separate floating card.
- Use equal visual weight for start, late, and cancel.
- Keep placeholder nav links that route to the same page.
- Add color systems outside the warm paper palette.
- Shrink Thai text below comfortable reading size.
