# Owner UI Audit - 2026-06-29

## Scope

- Surface: `http://localhost:3000/owner`
- Flow: owner views today's queue and decides what to do next
- Evidence:
  - `01-owner-desktop-fullpage.png`
  - `02-owner-mobile-fullpage.png`

## Step List

1. Desktop owner dashboard: generally understandable, but action priority is split between summary cards and the list row.
2. Mobile owner dashboard: content remains available, but headline wrapping and dense repeated controls make the screen slower to scan.

## Strengths

- The screen already follows the product direction: warm paper palette, Thai-first typography, soft borders, and today-first queue focus.
- Primary owner jobs are present: pause shop, add walk-in, mark arrived, start cut, mark late, cancel, and edit.
- Current / next / list hierarchy is close to the documented owner mobile priority.

## UX Risks

- The same queue appears in both "คิวถัดไป" and "รายการวันนี้", with overlapping actions (`เริ่มตัด` vs `เริ่ม`). This creates decision friction.
- "ลูกค้าปัจจุบัน" empty state still shows disabled action buttons, which visually compete with the active next-customer card.
- "บริการ" and "ตั้งค่า" in the owner nav link back to `/owner`, so they look usable but do not lead to their named destinations.
- The "พัก 30 นาที" action is visually separated from other queue-control actions; it reads like a header utility rather than an operational state change.
- On mobile, long Thai headings wrap heavily. The owner must scan large vertical chunks before reaching the actionable next queue.
- Queue row actions are all equal width. The destructive action gets similar visual weight to the expected next action.

## Accessibility Risks

- Color carries a lot of state meaning. Badges and labels help, but warning/positive/current states should remain clear without relying on tint alone.
- Disabled buttons inside empty current state are focus-ineligible but still visually prominent; this can confuse keyboard and screen-reader users if the surrounding copy does not explain the available next action.
- Icon-only meaning is mostly paired with text, which is good. Continue keeping visible Thai labels on all owner actions.
- Screenshots cannot confirm keyboard order, focus trap behavior in confirmation dialogs, or screen-reader announcements after server actions.

## Recommended Design Direction

### 1. Make the "next action" unmistakable

For a barber between cuts, the first useful action should be visually obvious.

- If no current customer exists, promote "คิวถัดไป" to the primary card and make `เริ่มตัด` the dominant action.
- Hide or de-emphasize disabled `เสร็จ` / `รอเพิ่ม` buttons in the empty current card.
- Add a compact status line such as `พร้อมเริ่มคิวนี้` under the next customer's name.

### 2. Reduce duplicate action surfaces

The summary card should handle the next immediate action; the list row should handle secondary queue management.

- In "รายการวันนี้", keep `แก้ไข`, `สาย`, `ยกเลิก`.
- Show `เริ่ม` in the row only if the row is not already promoted as the next queue, or make it a smaller secondary action.
- Keep destructive actions visually quieter until confirmation.

### 3. Turn the owner nav into a compact mobile command bar

Mobile owner use is primary for this app.

- At small widths, show brand + active screen title at top, then a 2-column command grid for `คิววันนี้` and `เพิ่มคิว`.
- Hide or disable unfinished nav items (`บริการ`, `ตั้งค่า`) until their routes exist, or label them as unavailable.
- Move logout to a less prominent footer/settings area on mobile.

### 4. Add a shop-status strip

Make operational status visible near the top:

- `ร้านเปิดอยู่`
- `รับคิวถึง 18:20`
- `พักร้าน 30 นาที`
- optional count: `เหลือ 1 คิว`

This can replace some explanatory copy and make the header more scannable.

### 5. Tighten mobile typography and card layout

- Use `clamp(22px, 7vw, 30px)` only if needed for owner heading scale; otherwise set a mobile-specific owner h1 around 28px and person names around 22px.
- Let action groups stack to one column under 420px, but keep the primary action first and full width.
- For queue rows on mobile, use a vertical structure: time/status row, customer line, note, actions.

## Code Touch Points

- `app/src/app/owner/page.tsx`: adjust current/next card logic and row action duplication.
- `app/src/app/owner/owner-navigation.tsx`: remove or disable placeholder nav links.
- `app/src/app/globals.css`: add mobile-specific owner card, queue row, nav, and typography rules.
- `app/src/components/barber/app-ui.tsx`: optionally add owner-specific variants for promoted next-customer card and compact operational status.
