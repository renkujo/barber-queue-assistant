# Owner Walk-in Phase 2 Brief

Status: `PASS` — Phase 2 implementation human-approved with spacing refinement  
Parent direction: `docs/owner-responsive-shell-redesign-brief.md`  
Primary route: `/owner/walk-in`

## Current Reality

- This route is the fastest owner-created queue path for a customer who arrives in person or contacts the barber outside the public app.
- Existing fields and behavior are authoritative:
  - service — required;
  - customer name — required;
  - phone — optional;
  - note — optional;
  - submit through `createOwnerWalkInAction` into today’s queue.
- Current Mobile is responsive and functional, but the large page header/back panel and nested field surfaces make a short task feel longer than it is. The primary submit sits below the first viewport.
- Current Desktop already forms a useful workbench, but the right rail lists many services and repeats more information than the owner needs while entering one customer.
- Shared Owner Shell, navigation, server action, form names, validation, privacy rules, route feedback, and queue behavior must remain unchanged.

## Taste Thesis and Design Read

- **Taste thesis:** adding a walk-in should feel like writing one clear line into today’s queue—fast, calm, and confident—without becoming either a generic CRM form or an under-explained shortcut.
- **Mobile job:** complete the minimum task one-handed with the primary action always easy to reach.
- **Desktop job:** enter the same data in a compact workbench with selected-service context and clear post-submit consequence.
- **Brand direction:** preserve the approved Pastel Paper Queue / Owner Shell identity; change task hierarchy and density, not tokens.

## Mode and Preservation Boundary

- **Mode:** preserve behavior and brand.
- **Composition strategy:** targeted recomposition of `/owner/walk-in` only.
- **Must preserve:** route, fields, required/optional rules, service values, server action, disabled state when no services exist, error toast/notice, Thai product copy meaning, navigation shell, and redirect back to `/owner` after creation.
- **Approved to change after visual review:** page-header anatomy, mobile form surface, sticky action placement, desktop form/rail proportions, selected-service summary, spacing, and responsive sequencing.
- **Not approved:** quick-create defaults that bypass required data, new customer fields, appointment-time selection, payment, staff assignment, queue-priority controls, public flow changes, or business-condition changes.

## Structure

### Mobile task flow — 390×844

1. Shared Owner Mobile App top bar.
2. Compact task header: back affordance, `เพิ่มคิว`, one-line explanation.
3. Service selector with selected duration/price visible.
4. Customer name.
5. Optional phone.
6. Optional note.
7. Primary `เพิ่มเข้าคิววันนี้` action in a sticky task footer above the safe-area/bottom navigation.
8. Bottom navigation remains visible with `เพิ่มคิว` active.

Mobile rules:

- Do not wrap the entire form in multiple nested cards.
- Labels remain visible; placeholders never replace labels.
- Required versus optional state is explicit but quiet.
- The form may scroll, but the submit action must not be hidden behind bottom navigation.
- Error copy remains near its owner field and through existing route feedback.

### Desktop workbench — 1440×1000

1. Shared persistent Back Office sidebar with `เพิ่มคิว` active.
2. Compact workspace header: `เพิ่มคิว`, one-line description, `กลับคิววันนี้`.
3. Main form workbench using one connected surface.
4. Quiet side rail with:
   - selected service summary;
   - concise `หลังเพิ่มคิว` consequence;
   - no long service catalog or dashboard metrics.
5. Full-width primary submit within the form owner.

## Visual and Interaction System

- LINE Seed Sans TH and existing semantic tokens remain authoritative.
- Use one strong task title and one strong submit; avoid competing section-card headings.
- Desktop can use denser two-column fields only where reading order remains obvious. Service remains full-width.
- Mobile fields retain at least 44px controls and the primary action remains at least 48px.
- Focus, disabled, pending, error, and keyboard behavior must survive implementation.
- No new imagery is required.

## Verification After Implementation

- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×1000.
- States: default, long Thai customer name, optional fields empty, validation error, no services, pending submit, successful redirect.
- Run TypeScript, ESLint, integration tests, full Playwright suite, production build, and rendered overflow/string-fit checks.

## Open Question / Blocker

None for Phase 2.

## Phase 2 Human Decision

Kiattisak approved the implemented `/owner/walk-in` direction under `PASS` on 2026-07-17 and explicitly requested a final section-spacing check.

The refinement confirmed and adjusted:

- 10px Mobile top-bar → task-header gap;
- effective task-header → first-field rhythm through the 4px grid gap plus field padding;
- 14px header → workbench gap at Tablet/Desktop;
- consistent field section padding/dividers;
- fixed Mobile submit bar directly above bottom navigation with 0px overlap/gap;
- no horizontal overflow at 360/390/768/1024/1440px.

Final validation: TypeScript, ESLint, 37 integration tests, 12 full Playwright tests, targeted owner-flow geometry test, and production build.
