# UI Concept V1 — Barber Queue Assistant

## Direction

The UI should feel like a calm daily work tool for a one-owner barber shop, not a salon SaaS dashboard.

Primary qualities:

- today-first;
- readable on mobile;
- low decoration;
- fast owner actions;
- clear queue states;
- customer self-check before messaging the owner.

## Visual language

Palette direction:

- warm paper background;
- charcoal text;
- muted amber/copper action color;
- soft green for open/ready states;
- restrained red only for late/no-show risk.

Avoid:

- blue SaaS dashboard feeling;
- generic KPI card grid;
- heavy gradients;
- glass panels;
- oversized rounded pill styling;
- decorative badges without function.

## Main screens in prototype

Prototype path: `prototypes/ui-v1/index.html`

### Customer screen

Designed for public link, QR, LINE OA rich menu, or social bio link.

Sections:

1. Shop status today
2. Current wait estimate
3. Primary actions
   - book a time
   - get today queue
4. Next available slots
5. Existing queue tracking

### Owner screen

Designed for the barber using a phone or tablet between haircuts.

Sections:

1. Current customer
2. Next customer
3. Fast actions
4. Waiting and booked queue
5. Late/no-show warning
6. Pause/block controls

## Interaction principle

Common owner work should take 1-2 taps:

- start service;
- mark done;
- mark arrived;
- wait more;
- no-show;
- pause queue;
- add walk-in.

## Notes for future implementation

- Owner mobile version should be treated as the primary admin experience.
- Desktop admin can exist, but should not become complex back-office software.
- Customer UI must work without LINE identity.
- If `lineUserId` exists, show LINE notification status quietly; do not make LINE feel mandatory.

## Update — Pastel Paper Queue alignment

The prototype has been updated to match the selected Pastel Paper Queue direction.

Changes applied:

- replaced hard copper/charcoal tokens with peach, apricot, sage, mint, dusty rose, and cocoa brown;
- used `docs/assets/generated-v1/app-icon-pastel.png` as the main brand/illustration cue;
- added a generated-asset strip referencing the current asset direction;
- softened customer action cards into ticket-like pastel buttons;
- softened owner current/next/late panels while preserving fast action hierarchy.

Caveat: generated raster assets currently do not have real alpha channels. The prototype uses them as visual/source direction rather than final transparent production cutouts.
