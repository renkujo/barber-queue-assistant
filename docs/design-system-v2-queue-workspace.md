# Global Design System V2 — Queue Workspace

Status: `APPROVED DIRECTION — R2 OPERATIONAL MONOCHROME` — settings pilot revision approved 2026-07-20  
Approved by: product owner, 2026-07-20  
Runtime promotion: Phase 1–5 complete and human verified, 2026-07-21  
Reference input: Miro marketing/design-system anatomy supplied by the product owner  
Scope: customer, owner-authentication entry, and authenticated-owner surfaces, migrated incrementally with owner surfaces first

## Authority and rollout

This document is the approved visual-system target for Barber Queue Assistant. It does not replace product or behavior contracts.

Authority order:

1. Product behavior, privacy, queue-ordering, validation, and server-action contracts: `product-brief.md`, `mvp-scope.md`, `data-model.md`, route server actions, and repository tests.
2. Approved route ownership briefs: `owner-responsive-shell-redesign-brief.md` for the owner shell and its `1024px+` desktop ownership; the Phase 2–6 owner briefs for their named routes.
3. `design-system-owner-queue-board-v2.md` for owner queue priority, information anatomy, and route behavior not superseded by a newer approved route brief.
4. This document for migrated global visual tokens and component anatomy.
5. Design System V1 only for the intentionally unpromoted global non-queue 404 and historical references.

When documents disagree inside the same scope, the newer explicitly human-approved route brief wins. In particular, `owner-responsive-shell-redesign-brief.md` supersedes the older `1180px` owner-shell breakpoint guidance in the queue-board document.

Migration is component-by-component. A surface remains on the current runtime system until its implementation, tests, responsive evidence, and human visual review pass. Do not switch legacy aliases globally to the new palette.

## Current reality

- The product is a daily queue assistant for one owner-barber, not a collaborative whiteboard, salon suite, or analytics dashboard.
- Mobile is used while working and must keep common actions within one or two taps. Desktop is a small-business back office for the same owner.
- The daily queue, current customer, next customer, availability, and truthful intake state are the primary work objects.
- Promoted owner, owner-login, and customer routes use Queue Workspace V2 Operational Monochrome. The global non-queue 404 and historical assets remain legacy.
- LINE Seed Sans TH is the established Thai-first font and remains the production typeface.
- Existing source-owned React primitives and Radix-backed Select/Dialog/AlertDialog behavior remain implementation foundations.
- Current CSS has visual tokens but no complete semantic spacing, radius, typography, or elevation contract. Breakpoint and font-weight usage has drifted across page-specific styles.

## Brand Read and Taste Thesis

### Repo-proven brand reality

- Calm, local, approachable, and precise enough for queue control.
- Thai-first copy and scanability.
- Warm human character without becoming childish.
- Today-first, action-first, and intentionally smaller than enterprise software.
- LINE is optional infrastructure, not the product identity.

### Approved direction

Adopt the strongest reusable logic from the supplied Miro system through an operational monochrome translation:

- clean white canvas;
- confident dark primary actions with controlled rectangular corners;
- flat surfaces and restrained hairlines;
- black, white, and neutral gray as roughly ninety percent of the visible system;
- semantic color only when a real product state requires it;
- disciplined four-pixel spacing;
- clear responsive collapse;
- connected workspaces instead of repeated nested cards.

### Taste thesis

Barber Queue Assistant should feel like a clear, serious, and dependable daily operating desk so one owner-barber can understand the shop and perform the next correct action within seconds, without becoming a playful collaboration canvas, an overly soft consumer booking page, or an enterprise salon dashboard.

### Signature expression

**White work surface → disciplined black hierarchy → color only when state truth requires it.**

The signature must clarify the queue rather than decorate it:

1. The work surface stays predominantly white and quiet.
2. Neutral gray grouping separates work areas without decorative color.
3. One dark rectangular action communicates the next expected action.
4. Semantic success, warning, destructive, error, and LINE states remain restrained, text-backed, and distinct.

### Restraint boundary

- No sticky-note imitation, infinite canvas, floating creative toolbar, collaborator cursors, comments, presence, zoom, or pan metaphors.
- No Miro wordmark, Roobert PRO, copied component silhouettes, marketing mockups, or signature motion.
- No pricing-grid, marketing-hero, customer-logo wall, or massive-footer anatomy inside the product app.
- No new analytics, staff, branch, POS, inventory, or collaboration features.

## Reference Decisions

Reference fit: **Near miss, useful as a system reference**.

### Keep

- White canvas and flat visual hierarchy.
- Dark primary CTA with restrained corners.
- Restrained one-pixel borders and strategic depth.
- Four-pixel base spacing.
- Pastel surfaces used as recognizable signals.
- Connected workspace anatomy and progressive disclosure.
- Explicit pressed, disabled, focus, loading, success, and error states.

### Adapt

- Roobert PRO discipline becomes a Thai-first LINE Seed Sans TH type ladder.
- Marketing-scale typography becomes an app-scale hierarchy led by queue codes, time, and page tasks.
- Canary yellow becomes an exceptional attention signal, not navigation decoration or a universal CTA.
- Miro pastels are reduced to low-saturation semantic state surfaces only.
- Rectangular controls with `8–12px` corners carry the formal operating tone; full pills are reserved for compact status badges where the shape improves scanning.
- Dense desktop comparison becomes a calm owner workbench while mobile remains task-first.

### Reject

- Exact Miro palette, wordmark, proprietary font, sticky-note trade dress, whiteboard imagery, and collaborative-canvas interaction.
- Decorative mixing of several pastel colors without product meaning.
- Full-pill treatment on every action or navigation item.
- Marketing page components that do not serve queue operations.
- Any reference-driven change to routes, labels, form names, data ownership, validation, or business behavior.

### Durable reference snapshot

The product owner supplied a Miro system summary on 2026-07-20. The material reference anatomy used by this contract is:

- stark white canvas;
- canary yellow reserved for brand and bounded emphasis;
- dark full-pill primary CTAs;
- white and pastel yellow/coral/rose/teal feature surfaces;
- flat hairline cards with strategic elevation;
- a four-pixel spacing foundation;
- rounded geometric typography led by Roobert PRO;
- responsive single-column, two-column, and desktop grid transitions;
- marketing-specific hero, product mockup, pricing comparison, and dark footer components.

The white canvas, dark action hierarchy, flat hairlines, spacing discipline, and responsive logic are adapted into the product app. Full-pill actions and colorful feature surfaces were tested in R1, then rejected as too playful for the owner workspace. Roobert PRO and the marketing-specific components remain reference evidence only.

## Token Architecture

The V2 runtime should separate brand, action, semantic, and surface roles. Values below are **candidate R2 Operational Monochrome values**; final promotion requires contrast and visual review.

### Color — foundation

| Token | Candidate R1 | Role |
| --- | --- | --- |
| `color.canvas` | `#FFFFFF` | App canvas and primary card surface |
| `color.surface` | `#F7F7F5` | Quiet section and control background |
| `color.surface-soft` | `#F1F0EC` | Secondary grouping and disabled surface |
| `color.ink-deep` | `#17120F` | Primary action and strongest text |
| `color.ink` | `#2B2521` | Main body and heading text |
| `color.text-secondary` | `#625B55` | Supporting copy and metadata |
| `color.text-muted` | `#736C66` | Readable placeholder and tertiary labels |
| `color.border` | `#E5E1DC` | Default one-pixel hairline |
| `color.border-soft` | `#F0EDE9` | Quiet row divider |
| `color.border-strong` | `#918981` | Input and active outline; `3.44:1` on white |
| `color.on-dark` | `#FFFFFF` | Text/icons on dark action surfaces |

### Color — brand and signals

| Token | Candidate R1 | Role |
| --- | --- | --- |
| `color.brand-yellow` | `#FFD84D` | Brand mark and bounded attention signal |
| `color.brand-yellow-deep` | `#E7B928` | Pressed yellow or stronger attention edge |
| `color.yellow-soft` | `#FFF4B8` | Current/attention tag background |
| `color.brand-coral` | `#F29B82` | Warm supporting accent only |
| `color.coral-soft` | `#FFE2D8` | Warm informational surface |
| `color.brand-blue` | `#3D5FCC` | Inline link and focus accent only |
| `color.blue-pressed` | `#2947A4` | Pressed link/focus-related action |

### Color — semantic and action

| Token | Candidate R1 | Role |
| --- | --- | --- |
| `color.action-primary` | `color.ink-deep` | Expected next action |
| `color.action-primary-pressed` | `color.ink` | Pressed primary action |
| `color.action-primary-text` | `color.on-dark` | Primary action foreground |
| `color.action-secondary` | `color.canvas` | Safe secondary action |
| `color.positive` | `#2F746B` | Open/ready/arrived/success foreground or edge |
| `color.positive-soft` | `#EDF5F3` | Restrained open/ready/arrived/success background |
| `color.warning` | `#8A5A00` | Late/no-show risk foreground; never color-only |
| `color.warning-soft` | `#F6F2E8` | Restrained warning background |
| `color.danger` | `#A24038` | Destructive foreground or edge |
| `color.danger-soft` | `#F7ECEB` | Restrained destructive background |
| `color.error` | `#8C2F3D` | Validation/system error foreground or edge |
| `color.error-soft` | `#F7ECEF` | Restrained validation/system error background |

### Color usage rules

- Dark ink is the dominant CTA color. Brand yellow is not the default CTA.
- Black, white, and neutral gray own layout and hierarchy. Accent colors never decorate ordinary cards or icons.
- Yellow identifies bounded attention or brand context; it does not mean success or destructive risk.
- Positive teal means open, ready, arrived, or successful.
- Warning amber means late/no-show risk before a destructive decision.
- Danger red means a destructive action such as cancel or no-show confirmation.
- Error wine means validation or system failure; it is not an operational queue status.
- Blue is limited to links and focus where it improves affordance. It must not turn the product into a blue admin template.
- Every semantic color must have a text label, icon, or structural cue.
- Large surfaces stay white or neutral. Pastels should not cover every card in the same viewport.

### State-to-token ownership

| Product state | Token owner | Must not use |
| --- | --- | --- |
| Current/next attention | `ink-deep` / `surface-soft` | Routine decorative yellow |
| Open/ready/arrived/completed | `positive` / `positive-soft` | Brand yellow as success |
| Late/no-show risk before confirmation | `warning` / `warning-soft` | Destructive red as the only cue |
| Cancel/no-show/delete confirmation | `danger` / `danger-soft` | Positive or decorative coral |
| Invalid input/system failure | `error` / `error-soft` | Operational warning |
| Warm non-semantic support | Not used by default in operational UI | Status meaning or routine decoration |

Candidate R2 contrast checks on their intended light backgrounds: readable muted text `4.82:1` or better, positive `4.95:1`, warning `5.30:1`, danger `5.46:1`, error `7.03:1`, brand-blue focus/link `5.66:1`, and the default strong control border `3.44:1` on white. Re-run automated and rendered contrast checks before promotion because font size, weight, and composited backgrounds can change effective results.

## Typography

### Font family

```css
font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
```

Use only production-backed weights:

- `400` — body and supporting copy;
- `700` — labels, buttons, section titles, and important values;
- `800` — page titles and critical queue/time emphasis.

Do not use synthesized weights such as `500`, `600`, `620`, `650`, or `850` unless a matching production font file is deliberately added and validated first.

### App type ladder

| Token | Mobile / Desktop | Weight | Line height | Use |
| --- | --- | --- | --- | --- |
| `type.screen-title` | `30px / 34px` | 800 | `1.12` | One page-level title |
| `type.section-title` | `20px / 22px` | 700 | `1.25` | Main section heading |
| `type.subsection-title` | `17px / 18px` | 700 | `1.3` | Card/workbench heading |
| `type.body` | `16px` | 400 | `1.55` | Primary Thai reading text |
| `type.body-strong` | `16px` | 700 | `1.5` | Emphasis and primary row labels |
| `type.body-sm` | `14px` | 400 | `1.5` | Secondary copy and table cells |
| `type.label` | `14px` | 700 | `1.4` | Form labels and controls |
| `type.caption` | `13px` | 400 | `1.45` | Helper text and metadata |
| `type.micro` | `12px` | 700 | `1.4` | Non-critical short tags only |
| `type.button` | `14px` | 700 | `1.3` | Button labels |
| `type.queue-code` | `32px / 36px` | 800 | `1.1` | Queue identity |
| `type.stat` | `48px / 56px` | 800 | `1.05` | Position or wait-time callout |

Typography rules:

- Use tabular figures for queue counts, time, duration, and codes where alignment helps scanning.
- Do not use negative tracking on Thai text.
- Do not shrink critical Thai copy below 14px to fit a layout.
- Use `text-wrap: balance` for short headings and `text-wrap: pretty` for explanatory copy when supported.
- Verify Thai diacritics, mixed Thai/English baselines, and long realistic labels at every promoted breakpoint.

## Spacing

Base unit: `4px`.

| Token | Value | Role |
| --- | --- | --- |
| `space.1` | `4px` | Micro gap |
| `space.2` | `8px` | Icon/label and compact control gap |
| `space.3` | `12px` | Compact row padding |
| `space.4` | `16px` | Default component padding |
| `space.5` | `20px` | Comfortable card padding |
| `space.6` | `24px` | Panel padding and section gap |
| `space.8` | `32px` | Major workspace gap |
| `space.10` | `40px` | Wide desktop gutter |
| `space.12` | `48px` | Large section separation |
| `space.16` | `64px` | Rare top-level separation |

Operational density rules:

- Mobile prioritizes touch reach and reading; never tighten below 44px controls to mimic desktop density.
- Desktop gains comparison breadth, not smaller Thai text.
- Connected rows use dividers and shared outer boundaries instead of individual card margins.

## Shapes

| Token | Value | Use |
| --- | --- | --- |
| `radius.xs` | `4px` | Micro marker |
| `radius.sm` | `6px` | Compact status or inner control |
| `radius.md` | `10px` | Button, input, select, and utility control |
| `radius.lg` | `12px` | Standard card and dialog inner panel |
| `radius.xl` | `16px` | Main panel and mobile ticket |
| `radius.feature` | `20px` | Rare semantic feature/current-state surface |
| `radius.full` | `9999px` | Buttons, tabs, filters, badges, circular icon controls |

Shape rules:

- Primary, secondary, positive, destructive, ghost, and filter buttons use `radius.md` by default.
- `radius.full` is reserved for compact state badges and deliberate binary/filter pills.
- Inputs use `radius.md`; they must not be mistaken for pill buttons.
- Queue rows remain connected inside one board. Do not turn every row into a floating 28px card.
- Reserve `radius.feature` for a rare state-owning surface, not ordinary settings cards.

## Elevation and Motion

| Token | Treatment | Use |
| --- | --- | --- |
| `elevation.0` | none | Default surfaces and rows |
| `elevation.1` | `0 1px 2px rgba(23, 18, 15, 0.05)` | Subtle raised control |
| `elevation.2` | `0 6px 18px rgba(23, 18, 15, 0.08)` | Dropdown or selected floating panel |
| `elevation.3` | `0 16px 44px rgba(23, 18, 15, 0.14)` | Dialog only |

- Default transition: `150–200ms ease` for background, border, color, opacity, and transform.
- Pressed actions may use `translateY(1px)` or `scale(0.99)`.
- Do not animate layout dimensions for decorative effect.
- Respect `prefers-reduced-motion` and keep operational actions immediate.

## Component Contracts

### Button

| Variant | Target treatment | Product role |
| --- | --- | --- |
| `primary` | Dark rectangle, white text, 44–48px, `radius.md` | Expected next action |
| `secondary` | White rectangle, strong hairline, ink text | Safe alternative |
| `positive` | Restrained positive-soft rectangle, positive edge/text | Positive route-owned action |
| `destructive` | Restrained danger-soft rectangle, danger edge/text | Cancel, no-show, delete |
| `ghost` | Transparent, `radius.md`, quiet text | Low-priority row utility |
| `link` | Brand-blue text, no container | Inline navigation/action |
| `icon` | Circular visual container inside a `44×44px` minimum hit area | Labelled utility control |

Rules:

- Preserve one dominant primary action per task area.
- This document assigns visual priority only. The route/behavior contract owns which action exists and which action is expected next.
- Mobile owner actions are at least 48px when they change queue state.
- Destructive controls never share the primary visual category.
- Keep visible focus, pressed, pending, disabled, and error feedback.
- Icon-only actions require accessible names and must not carry critical meaning through icon shape alone.

### Card and workspace surfaces

- `card-base`: white, `radius.lg`, one-pixel soft border, `space.5` padding.
- `panel-main`: white, `radius.xl`, one-pixel border, `space.6` padding.
- `panel-feature`: neutral by default; a restrained semantic tint is allowed only when the entire panel owns a real state.
- `workspace-connected`: one outer boundary with internal dividers for queue, service, availability, or settings rows.
- `side-rail`: visually quiet; must never compete with the main work object.

Avoid nested border + background + radius at every level. A form section may own the surface while its fields remain flat, or the panel may stay flat while fields own their boundaries—not both without a clear hierarchy reason.

### Inputs and forms

- Inputs/selects: white, 44px minimum height, `radius.md`, strong hairline.
- Mobile task inputs may use 48px height.
- Focus: two-pixel brand-blue ring plus sufficient offset or equivalent high-contrast treatment.
- Labels remain above controls.
- Description and error text must be connected through `aria-describedby`; invalid controls expose `aria-invalid`.
- Placeholder never replaces the label.
- Save ownership must remain truthful: no autosave appearance when a page has one explicit submit action.

### Badges and status

- Badges use `radius.full`, short text, and 24–28px minimum height.
- Use yellow for attention, teal/green for positive truth, and rose/red for risk.
- Avoid badge walls. Current, next, warning, and exceptional state earn emphasis; normal rows stay quiet.

### Queue board and tables

- The queue is one connected chronological board, not a grid of floating sticky notes.
- Queue code/time is the strongest row anchor.
- One route-authorized contextual primary action is visible. Introducing a new disclosure mechanism or hiding an existing secondary/destructive action requires route-level approval and must preserve tap count expectations, keyboard access, discoverability, and confirmation behavior.
- Desktop may expose comparison columns; mobile stacks the same data/action contract.
- Dense tables use horizontal scrolling only when column comparison is essential. Queue actions must not require horizontal scrolling on mobile.

### Navigation

- Preserve the approved desktop owner sidebar and mobile bottom navigation ownership.
- Active navigation uses ink, a stronger neutral border, or a neutral surface. Do not use yellow as routine navigation decoration.
- Customer routes remain task-first and do not inherit back-office navigation.
- The approved Operational Monochrome desktop expression is a floating dark command rail: white brand lockup, restrained inactive links, one white active destination, and a contained LINE/logout footer. Route definitions, active matching, and mobile navigation remain unchanged.

## Responsive Contract

Canonical target ranges for new or migrated components:

| Range | Width | Behavior |
| --- | --- | --- |
| Small mobile | `<480px` | One column, 44–48px controls, compact copy, safe-area clearance |
| Large mobile | `480–767px` | One column with wider action rows; two columns only for short equal controls |
| Tablet | `768–1023px` | Two-column support layouts when reading order remains clear |
| Desktop | `1024–1279px` | Owner back-office shell and comparison-oriented workbench |
| Wide desktop | `≥1280px` | Full workspace breadth with restrained side rail |

Migration rule: existing `420`, `560`, `760`, `1024`, and `1180` behavior may remain until the owning component is migrated. Do not mass-rewrite media queries. New components use the canonical ranges and old breakpoints are retired by ownership slice. An ownership slice is the shared shell plus every component whose layout mode depends on that shell breakpoint; a child component must not switch to a desktop anatomy before its owning route shell does.

The approved owner shell already uses `1024px+` desktop ownership through `owner-responsive-shell-redesign-brief.md`. Other routes keep their current approved shell ranges until an equally explicit route migration promotes them.

The `/owner/settings` pilot uses the desktop sidebar from `1024px`, but delays its secondary right rail until `1180px` so the authoritative form keeps a usable minimum width. At `1024–1179px`, the same rail destinations appear in the three-column settings hub. This is a route-owned content threshold, not a second shell breakpoint.

The `/owner` daily queue workspace keeps the desktop shell from `1024px`, uses compact action-owning queue rows through `1179px`, introduces the comparison table at `1180px`, and delays the secondary operational rail until `1360px`. This prevents the queue action column and closed-history controls from clipping while preserving one shared action owner.

The customer home `/` remains a task-first shell with no owner navigation. It uses one column through `859px`, then separates status/actions from services/queue lookup at `860px+`. The shared V2 root may carry tokens, but the `1024px` owner command-rail grid applies only to `.bqa-owner-board-shell`.

Customer status and actions must represent the full intake matrix rather than using walk-in availability as a proxy for all online intake. Booking and walk-in each own their active/disabled CTA. A repository-read failure is fail-closed and read-only: no positive-open claim, no new-intake action, no numeric queue estimate presented as current truth, and no fallback service list presented as database fact.

Customer booking `/book` keeps service/date/time as the first decision. It is one column through `759px`, then uses a primary form plus a 220px factual guide rail from `760px+`. Long portaled Select options wrap inside trigger-width content. Repository-read fallbacks must never create apparently available booking slots.

Booking capability is global while slot truth is date-specific: a closed today must not disable a bookable tomorrow. When the selected date has no available slot, time remains empty and submit remains disabled. Recoverable action errors stay on the form and preserve all entered fields. LINE identity is derived only after server-side ID-token verification with LINE, then carried through a signed, short-lived, HttpOnly cookie until successful creation; customer identity and form PII must not appear in redirect URLs.

Customer walk-in `/walk-in` shares the booking form grammar but owns live same-day truth. It is one column through `759px`, then uses a primary form plus a 220px status rail from `760px+`. Outside-hours, intake-off, in-store-only, missing-service, and repository-failure states disable online creation without hiding the reason. Aggregate queue values must become unknown dashes—not fabricated zeroes—when their source is unavailable.

Outside-hours truth takes precedence over in-store-only guidance; the interface must never invite a customer to visit a closed shop. Customer submissions require an active database service, and concurrent walk-in estimates are serialized before insertion. LINE entry identity is purpose-bound so owner binding, booking, and walk-in cookies cannot be consumed across flows.

Public tracking `/queue/[publicToken]` is a bearer-token status surface: the queue code and masked identity are primary, PIN recovery is secondary, and service/time details move to a 220px right rail at `760px+`. Every queue status owns explicit Thai guidance. The rendered surface must never expose database ID, phone, LINE ID, customer/owner notes, or the public token itself, and unknown tokens resolve only to the scoped customer 404.

Public token lookup validates UUID shape before database access and never falls back to queue ID. Masking is grapheme-aware and must hide at least one grapheme even for very short Thai names. Arrived/in-progress/done own positive; late owns warning; cancelled/no-show own danger. The tracking 404 belongs to the route segment and must not opt unrelated LINE, privacy, or owner errors into customer V2.

Responsive promotion must measure intentional space between sibling sections/cards in addition to page overflow. Stacked cards may not touch at any breakpoint; action groups retain visible gaps. Long Thai content must wrap inside its owning card, increase card height naturally, and pass both horizontal and vertical clipping checks at the rendered viewport.

LINE entry `/line` and owner completion `/line/owner` remain narrow single-task surfaces. LINE green is permitted only on the genuine connection affordance; setup warning, connection error, owner success, and invalid result use their bounded semantic owners. Owner completion display state must be signed and short-lived rather than trusted from a plain query value.

Owner connection bearer links are nonce-backed and atomically one-use. Malformed LIFF state must fall back safely rather than return a server error, and owner fallback actions outside LINE must return to authenticated owner routes rather than pretending the connection can complete without verified LINE identity.

Privacy `/privacy` remains a readable single-column disclosure surface. Legal sections retain explicit card separation and allow long Thai text, contact values, and technical cookie wording to grow vertically without clipping. Visual migration must not weaken actual retention, customer-rights, optional-phone, LINE identity, public-tracking, or contact-configuration truth.

Required principles:

- No horizontal page overflow.
- Bottom navigation never covers actions or content.
- Desktop density must not reduce Thai copy below the semantic type ladder.
- Content order and action ownership remain equivalent across breakpoints.
- Real Thai strings, long shop/service/customer names, empty/error/loading states, and connected/unconnected LINE states must be tested.

## Legacy-to-V2 Migration Map

Introduce V2 tokens alongside legacy tokens. Do not redefine all legacy aliases at once because current `color-mix()` usage binds peach primary to several unrelated surfaces.

| Current runtime token/pattern | V2 owner | Migration decision |
| --- | --- | --- |
| `--paper` | `color.canvas` | Migrate per surface; remove decorative page gradients |
| `--surface` | `color.canvas` / `color.surface` | Split primary card from quiet grouping |
| `--surface-warm` | `color.surface-soft` / role pastel | Replace by explicit surface role |
| `--surface-board` gradient | `workspace-connected` | Remove gradient when owning board migrates |
| `--ink` | `color.ink` | Direct semantic replacement |
| `--muted` | `color.text-secondary` / `color.text-muted` | Split readable secondary from tertiary text |
| `--line` | `color.border` / `color.border-soft` | Split card border from row divider |
| `--line-strong` | `color.border-strong` | Direct semantic replacement |
| `--primary` peach | `color.action-primary` or role pastel | Decide by component; never global alias swap |
| `--primary-strong` | `color.action-primary-pressed` | Action-only after migration |
| `--primary-soft` | `color.surface-soft` by default | Use a semantic tint only when the component owns that state |
| `--butter` | `color.warning-soft` or retire | Warning/availability only; never routine decoration |
| `--sage` / `--mint` | `color.positive` / `color.positive-soft` | Preserve positive meaning |
| `--rose` / `--rose-soft` | `color.warning`, `color.danger`, or `color.error` pair | Choose one owner from the state matrix; never alias globally |
| Fractional weights `620/650/850` | `400/700/800` | Normalize when owning selector migrates |
| Repeated nested cards | `workspace-connected` | Flatten by page/workflow, preserving ownership |
| `default/primary` aliases | `primary` | Consolidate after call-site inventory |
| `outline/secondary` aliases | `secondary` | Consolidate after call-site inventory |
| `danger/destructive` aliases | `destructive` | Consolidate after call-site inventory |

## Preservation Boundary

The visual migration must preserve:

- all routes and navigation destinations;
- authentication and privacy behavior;
- queue ordering, owner override, status transitions, and confirmation rules;
- field names, validation, server actions, redirects, and toast/query feedback;
- availability precedence and service enable/disable semantics;
- LINE connection truth and optional LINE identity;
- customer tracking/privacy boundaries;
- Thai copy meaning and accessible control names;
- source-owned primitives and Radix interaction behavior;
- mobile safe-area and minimum touch-target behavior.
- existing action visibility, interaction count, keyboard path, and destructive confirmation unless a route-specific approval explicitly changes them.

This contract does not authorize new fields, routes, analytics, staff roles, branches, payment, POS, inventory, collaboration, or marketing claims.

## Implementation Sequence

### Phase 0 — Contract

- This document.
- Current-to-target token map.
- No runtime visual changes.

### Phase 1 — Primitives

- Add V2 semantic tokens alongside legacy tokens.
- Migrate Button, Card/Panel, Badge, Input/Textarea, Select, Dialog/Alert, and focus/error states without changing their public behavior.
- Add component-level visual tests or stable geometry assertions where practical.

### Phase 2 — Pilot: `/owner/settings`

- Validate white canvas, dark rectangular CTA, monochrome hierarchy, restrained semantic states, connected sections, typography, forms, side rail, and mobile collapse.
- Preserve the current server action, field set, boolean semantics, manual wait bounds, LINE truth, and support links.
- Require human visual approval before wider promotion.

### Phase 3 — Owner workspace

1. `/owner`
2. `/owner/walk-in`
3. `/owner/settings/availability`
4. `/owner/settings/services`
5. `/owner/queue/[id]/edit`

### Phase 4 — Customer surfaces

- `/`
- `/book`
- `/walk-in`
- `/queue/[id]`
- LINE entry surfaces where applicable

### Phase 5 — Consolidation

- Retire migrated legacy aliases and duplicate component variants.
- Normalize owned breakpoint slices.
- Update Design System V1 and Owner Queue Board V2 references after runtime promotion.

Completion note (2026-07-21): promoted customer route structure is now owned by scoped V2 selectors and its route-specific `app-ui.css` blocks are retired. Shared primitives and the owner structural substrate remain because they still own runtime interaction/layout behavior rather than duplicate visual variants. One proven owner duplicate was removed. A final review identified `/owner/login` as a missed owner-experience surface; its scoped V2 correction subsequently passed technical and human review and is now promoted. Design System V1 is limited to the global non-queue 404 and historical references. Final evidence is recorded in `audit/queue-workspace-v2-phase5/README.md` and `audit/queue-workspace-v2-owner-login/README.md`.

## Verification and Promotion Gates

Required viewports:

- `360×800`
- `390×844`
- `768×1024`
- `1024×768`
- `1440×1000`

Required evidence per migrated slice:

- TypeScript and ESLint.
- Relevant integration and Playwright tests.
- Production build at meaningful milestones.
- No horizontal overflow or bottom-navigation overlap.
- Visible focus and keyboard path on desktop.
- Real Thai wrapping and mixed Thai/English baseline inspection.
- Long content, empty, loading/pending, success, error, disabled, destructive-confirmation, and fallback/read-only states where applicable.
- Contrast checks for text, controls, focus, and semantic states.
- Matched mobile/desktop screenshots and human visual decision.

Promotion rule: technical QA does not equal visual approval. A component or route becomes V2 authority only after explicit human `PASS`.

## Phase 0 Decision Ledger

| Evidence | Conflict | Decision | Rejected alternative | Status |
| --- | --- | --- | --- | --- |
| Product owner supplied Miro system and approved its adaptation | Exact transplant would conflict with Thai-first queue work | Translate system logic into Queue Workspace V2 | Miro clone or token-only skin | Approved |
| Existing Pastel Paper Queue is already implemented and human-approved | Whole-project replacement would create broad regressions | Incremental visual overhaul with per-slice promotion | One-shot global palette swap | Approved |
| LINE Seed Sans TH is local and proven for Thai | Roobert PRO is proprietary and not Thai production evidence | Keep LINE Seed Sans TH; adopt type-role discipline only | Import or imitate Roobert PRO | Approved |
| Queue state colors already carry product truth | Decorative pastel mixing could blur semantics | Assign every pastel a bounded product role | Random multi-color cards | Approved |
| Existing CSS uses legacy tokens through many `color-mix()` rules | Redefining `--primary` globally would change unrelated behavior | Add V2 semantic tokens beside legacy tokens | Alias flip at `:root` | Approved |
| Owner and customer use different operating contexts | One layout density would fail one audience | Shared tokens with route-appropriate composition | Separate business logic or apps | Approved |
| Product owner requested a more black-and-white, serious, formal read after reviewing the R1 pilot | R1 yellow/coral/teal decoration and full pills remained too playful | Adopt Operational Monochrome R2; keep color only for semantic truth and LINE | Continue colorful feature-card treatment | Approved 2026-07-20 |
| Product owner approved the R2 settings direction but found the desktop sidebar too ordinary | A light flat sidebar did not carry enough product identity or back-office authority | Use a floating dark command rail with one white active item and restrained footer | Generic light admin sidebar | Approved for bounded redesign 2026-07-20 |

## Open Question / Blocker

No product blocker for Phase 0. Accessibility validation of composited token usage remains a Phase 1/pilot promotion gate. Exact candidate colors remain reversible until the `/owner/settings` rendered pilot passes contrast checks and receives human visual approval.
