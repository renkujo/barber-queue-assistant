# Barber Queue — All-Route Card Gap Audit R1

Status: **UI geometry PASS after two scoped fixes; human review optional**

Date: 2026-07-23 (Asia/Bangkok)

## Scope

Read-only production-browser geometry covered every visual page route at `360`, `390`, `768`, `1024`, and `1440` CSS pixels:

| Area | Routes |
| --- | --- |
| Customer | `/`, `/book`, `/walk-in`, real `/queue/[publicToken]`, `/line`, `/privacy` |
| LINE owner entry | `/line/owner` |
| Owner | `/owner/login`, `/owner`, `/owner/walk-in`, `/owner/settings`, `/owner/settings/availability`, `/owner/settings/services`, real `/owner/queue/[id]/edit` |
| Error state | scoped 404 route |

Dynamic tracking/edit identifiers were selected read-only from existing queue data. Owner pages used a locally computed existing-session cookie. No form was submitted and the audit did not create, edit, reorder, or delete queue/shop data.

Coverage total: **15 routes × 5 viewports = 75 production renders**.

## Gap contract

- Normal sibling cards/sections: at least `12px`.
- Major route/layout boundaries: at least `16px`.
- Compact action/stat grids: `8px` is intentional.
- Connected operational lists/tables: `0px` is intentional when one outer surface plus dividers owns the rows.
- No card overlap, page-level horizontal overflow, clipped Thai text, or uncontained long technical token.

Intentional connected exceptions:

- customer service rows;
- owner queue rows and card header/content boundaries;
- owner weekly schedule disclosures/rows;
- owner service disclosures/table rows.

## Defects found and fixed

### 1. `/owner/settings` hub-to-form cards

The last shortcut card (`บริการ`) and first settings group (`ข้อมูลร้านและเวลา`) touched at `0px` on mobile. A generic compact-panel child rule had enough specificity to reset the hub's intended bottom margin.

Fix:

```css
.bqa-queue-workspace-v2 .bqa-owner-form-content--compact .bqa-owner-settings-form-panel > .bqa-owner-settings-hub {
  margin-bottom: var(--qw-space-4);
}
```

Verified result:

- `360px`: `16px`
- `390px`: `16px`
- `768px`: `16px`
- `1024px`: `16px`
- `1440px`: shortcut hub intentionally hidden; desktop rail owns support cards

Evidence: `owner-settings-390.png`.

### 2. `/privacy` warning-card long token

At `360px`, `NEXT_PUBLIC_PRIVACY_CONTACT` exceeded the warning copy width and was clipped by the alert surface.

Fix:

```css
.bqa-notice-copy {
  overflow-wrap: anywhere;
}
```

Verified result:

- `360px`: copy `clientWidth === scrollWidth === 194px`
- `390px`: copy `clientWidth === scrollWidth === 224px`
- no page overflow; complete token remains visible

Evidence: `privacy-360.png`.

## Final geometry result

From `geometry.json` after both fixes:

- page horizontal-overflow failures: `0`;
- true card-gap failures: `0`;
- true clipping failures: `0`;
- card overlaps: `0`;
- accepted intentional compact/connected findings: `26`.

The automated diagnostic still observes expected values that are not defects:

- `8px` between nested stat tiles in walk-in/tracking;
- `0px` inside connected queue/service rows and between a card's header/content;
- `12px` between owner-services mobile create/list cards;
- tracking ticket reports a small internal `scrollWidth` delta at `360px`, but every child bound remains inside the visible ticket and the complete queue code is visible.

The earlier request to remove `วันพิเศษ 14 วันข้างหน้า` was also verified at all five widths: the text and `.bqa-owner-availability-exceptions` selector are absent; weekly schedule/legend separation remains `16px` on stacked mobile and desktop rail layouts.

## Validation

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS.
- Full Playwright: **65/65 PASS** across customer, owner, responsive, workflow, portal, metadata, and dynamic-route specs.
- Focused availability Playwright after section removal: **4/4 PASS**.
- Server cleanup: PASS; port `3000` closed.

Integration note:

- Immediately after the availability-section removal at 23:42, integration was **81/81 PASS**.
- After local date rollover, two repeated runs were **79/81**: only the unchanged `pilot-report.test.ts` report-window assertions returned zero samples (`queue.total=0`, `bookingScheduledStart.samples=0`).
- Only CSS/audit files changed between the earlier green run and these failures. This is recorded as an unrelated time-window test blocker, not a card-gap or business-logic regression.

## Evidence files

- `geometry.json` — all 75 render records, categorized compact/connected exceptions, and final zero-failure summary.
- `owner-settings-390.png` — corrected `16px` hub/form boundary.
- `privacy-360.png` — complete wrapped environment-token warning.

No commit, push, or deploy was performed for this audit/fix set.
