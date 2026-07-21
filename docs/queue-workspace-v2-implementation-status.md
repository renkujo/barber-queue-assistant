# Queue Workspace V2 — Implementation Status

Goal: migrate Barber Queue Assistant to the approved Global Design System V2 without changing routes, business behavior, validation, privacy, or responsive ownership.

## Status

- Goal Mode: active
- Current phase: Phase 1–5 complete and human verified, including owner login correction
- Human visual status: all owner, owner-login, and customer V2 slices approved
- Technical status: all route slices including `/owner/login` and post-consolidation validation passed
- Commit/push: not requested

## Done

- [x] Phase 0 global design contract and migration map
- [x] Miro reference Keep / Adapt / Reject decision
- [x] Candidate color contrast corrections and state ownership matrix
- [x] Scoped-pilot strategy selected; legacy routes do not inherit V2 automatically

## Current

- [x] Add semantic runtime tokens alongside legacy aliases
- [x] Add scoped V2 primitive treatment
- [x] Activate the V2 scope on `/owner/settings`
- [x] Preserve existing settings actions, fields, links, and responsive ownership
- [x] Keep boolean status indicators synchronized with unsaved Select values
- [x] Connect FormField descriptions/errors to matching controls
- [x] Scope the V2 Select portal explicitly
- [x] Record product-owner approval for Operational Monochrome R2
- [x] Replace decorative color and full-pill geometry in the settings pilot
- [x] Refresh technical and rendered QA for R2
- [x] Record human approval of the R2 settings direction
- [x] Redesign the desktop sidebar as an Operational Monochrome command rail
- [x] Capture sidebar evidence at 1024px and 1440px
- [x] Human approval of the dark command rail
- [x] Run technical and rendered QA
- [x] Activate V2 scope on `/owner`
- [x] Migrate status, current/next summary, queue board, action states, closed queue, side rail, and confirmations
- [x] Preserve action priority, hidden form contracts, confirmations, queue privacy, and responsive shell ownership
- [x] Delay table anatomy until 1180px and the secondary rail until 1360px so action controls never clip
- [x] Add `/owner` V2 responsive regression coverage
- [x] Capture empty, operational, long-Thai, late-warning, closed-queue, and confirmation states
- [x] Bound long customer names and notes to two readable lines while preserving full accessible text
- [x] Human approval of `/owner` V2 with long-text follow-up completed
- [x] Activate V2 scope on `/owner/walk-in`
- [x] Migrate walk-in header, form, service summary, support panels, mobile submit bar, and Select portal
- [x] Preserve owner walk-in form/action/validation/redirect behavior
- [x] Capture five walk-in viewports with long Thai form content
- [x] Aggregate owner workflow Playwright: 23/23 pass
- [x] Human approval of `/owner/walk-in` V2
- [x] Activate V2 scope on `/owner/settings/availability`
- [x] Preserve seven weekly forms, preset, mode semantics, date overrides, validation, and precedence
- [x] Keep disclosure ownership through 1399px and connected table ownership from 1400px
- [x] Capture five schedule viewports and expanded special-date states
- [x] Aggregate owner workflow Playwright: 25/25 pass
- [x] Human approval of availability V2
- [x] Activate V2 scope on `/owner/settings/services`
- [x] Preserve create, edit, order, price, duration, active status, soft-disable/restore, and validation behavior
- [x] Use compact service cards through 1439px and connected comparison + create rail from 1440px
- [x] Capture five service viewports plus the mobile create state
- [x] Aggregate owner workflow Playwright: 27/27 pass
- [x] Human approval of services V2
- [x] Close independent-review services boundary risk with exact 1399/1400/1439/1440 geometry and action containment
- [x] Activate V2 scope on `/owner/queue/[id]/edit`
- [x] Preserve seven editable fields, no-lock encoding, conflict/outside-hours validation, private-note truth, and single-save behavior
- [x] Stack factual rules through 1399px and use the right rail from 1400px
- [x] Capture five edit viewports and conflict states
- [x] Aggregate owner workflow Playwright: 27/27 pass
- [x] Verify customer routes do not inherit owner V2 scope
- [x] Verify `/line` and `/line/owner` do not inherit owner V2 scope
- [x] Full Playwright suite: 36/36 pass
- [x] Human approval of queue-edit V2 and owner-phase closure
- [x] Add explicit customer visual-version ownership to `ScreenShell`
- [x] Activate V2 scope on customer home `/`
- [x] Preserve shop/intake status, queue aggregates, customer actions, services, lookup privacy/rate limits, and redirects
- [x] Record explicit approval and correct pre-existing CTA/intake-fallback truth contradictions
- [x] Make booking availability date-aware and repository fallbacks fail-closed/read-only
- [x] Add deterministic booking-only, walk-in-only, intake-off, long-Thai, keyboard-focus, and live-region tests
- [x] Capture open, intake-disabled, lookup-error, long-content, and exact breakpoint evidence
- [x] Full Playwright suite: 41/41 pass
- [x] Human approval of customer home V2
- [x] Activate V2 scope on customer booking `/book`
- [x] Preserve service/date/time synchronization, slot disabling, contact fields, LINE identity, privacy, validation, server revalidation, and redirect
- [x] Scope all three booking Select portals and constrain long options to viewport width
- [x] Make safe slot fallback fail-closed rather than inventing available times
- [x] Record explicit approval and separate global booking capability from selected-date availability
- [x] Replace error redirects with state-preserving action results so fields and LINE identity survive retry
- [x] Keep time empty and submit disabled when the selected date has no available slot
- [x] Distinguish database services from fallback services on customer routes
- [x] Add mixed-date, disabled-slot, error-retry, LINE identity, optional-phone, and complete keyboard tests
- [x] Record explicit approval and replace LINE identity query parameters with a signed 10-minute HttpOnly cookie
- [x] Verify LIFF ID tokens with LINE server-side and derive identity only from the verified subject
- [x] Make booking, walk-in, and owner LINE binding read verified cookie identity and clear it after success
- [x] Capture canonical, no-slot, booking-closed, no-services, long-select, and error evidence
- [x] Full Playwright suite: 47/47 pass
- [x] Human approval of customer booking V2
- [x] Activate V2 scope on customer walk-in `/walk-in`
- [x] Preserve open-hours, global/daily intake, in-store-only, queue estimate, service/contact/privacy, server estimate, rate limit, notification, and redirect ownership
- [x] Make walk-in action errors state-preserving and retain verified LINE identity for retry
- [x] Fail closed on aggregate/intake/service repository uncertainty
- [x] Purpose-bind LINE entry cookies and clear owner identity after completion/failure
- [x] Reject inactive/unknown customer services server-side
- [x] Give outside-hours truth precedence over in-store-only guidance
- [x] Serialize walk-in estimate assignment and cover concurrent creation
- [x] Use one inline authoritative error announcement on walk-in
- [x] Capture open, closed, outside-hours, in-store-only, no-services, error, long-option, and exact breakpoint evidence
- [x] Full Playwright suite: 53/53 pass
- [x] Human approval of customer walk-in V2
- [x] Activate V2 scope on public tracking `/queue/[publicToken]` and scoped not-found
- [x] Preserve UUID bearer lookup, masked identity, queue code/PIN, noindex metadata, status truth, and customer-safe mapping
- [x] Add explicit Thai guidance for every queue status
- [x] Verify private phone/LINE/note/database ID/token fields never render visibly
- [x] Make customer-name masking Thai grapheme-aware and fully mask one-grapheme names
- [x] Reject malformed public tokens before lookup and reject database IDs as public routes
- [x] Keep the V2 tracking 404 route-local and verify unrelated 404s remain legacy
- [x] Align arrived/done, late, and cancelled/no-show badges with positive/warning/danger semantics
- [x] Capture waiting desktop/mobile, every terminal/active status, 404, and exact breakpoint geometry
- [x] Full Playwright suite: 57/57 pass
- [x] Human approval of public tracking V2
- [x] Strengthen responsive gate with measurable section/card/action gaps and long-text horizontal/vertical clipping checks
- [x] Activate V2 scope on `/line`, `/line/owner`, and `/privacy`
- [x] Preserve LIFF target, ID-token verification, purpose-cookie, owner completion, disclosure, retention, rights, and contact truth
- [x] Sign owner completion presentation results and reject direct connected-status claims
- [x] Make owner connection tokens nonce-backed, persisted, and atomically one-use
- [x] Issue owner tokens only from the authenticated click route; owner settings renders create no unused token rows
- [x] Handle malformed LIFF state without a 500 and keep owner fallback actions truthful outside LINE
- [x] Align privacy retention copy with the actual monthly prune cadence
- [x] Record missing real privacy contact as an explicit deferred pilot blocker
- [x] Verify LINE/owner/privacy section gaps and long Thai text bounds across exact breakpoints
- [x] Capture setup-missing plus connected/missing/invalid owner states across required responsive breakpoints
- [x] Align LINE live regions: polite status for progress/success/information and assertive alert for failures
- [x] Capture LINE setup/error/connecting, owner connected/missing/invalid, privacy, and missing-contact evidence
- [x] LINE/privacy milestone full Playwright suite: 62/62 pass
- [x] Human approval of LINE entry and privacy V2
- [x] Move customer home/book/walk-in/tracking/LINE/privacy structural ownership into scoped V2
- [x] Remove promoted customer route-specific legacy blocks and proven owner duplicate selector
- [x] Keep shared primitives, owner structural substrate, and global non-queue 404 legacy ownership intact
- [x] Update Design System V1 and Owner Queue Board references after runtime promotion
- [x] Complete post-consolidation validation and evidence packet
- [x] Correct missed `/owner/login` scope and preserve auth/rate-limit/session behavior
- [x] Capture owner-login default/invalid/rate-limited/setup states and five canonical viewports
- [x] Full Playwright suite: 65/65 pass
- [x] Human approval of owner-login V2 correction

## Final next step

Kiattisak approved the owner-login correction. Pilot launch remains separately blocked on a real privacy contact.

## Required pilot evidence

- TypeScript and ESLint
- Settings integration and Playwright tests
- Production build
- `360×800`, `390×844`, `768×1024`, `1024×768`, `1440×1000`
- No horizontal overflow or bottom-navigation overlap
- Thai wrapping and long-content inspection
- Keyboard focus and Select portal styling
- Connected/unconnected LINE truth
- Human comparison against the Phase 0 contract

Evidence packet: `audit/queue-workspace-v2-settings-pilot/README.md`

Owner dashboard evidence: `audit/queue-workspace-v2-owner/README.md`

Validation at the gate:

- TypeScript: pass
- ESLint: pass
- Integration: 54/54 pass
- Settings Playwright: 10/10 pass
- Owner workflow Playwright: 27/27 pass
- Full Playwright: 65/65 pass after owner-login correction
- Production build: pass
- Five required production viewports plus long-content stress renders captured

Final consolidation packet: `audit/queue-workspace-v2-phase5/README.md`

Final post-consolidation evidence:

- Prisma schema validate and clean 8-migration deploy: pass
- Integration: 54/54 pass
- Customer post-retirement responsive suite: 18/18 pass
- Full Playwright: 65/65 pass after owner-login correction
- Required semantic contrast cases: all pass
- Production build and `git diff --check`: pass

## Preservation boundary

- No unapproved route, field, server-action, validation, queue, availability, service, LINE, privacy, or auth changes. Security/privacy corrections recorded in the approved route packets are explicit exceptions to the original visual-only boundary.
- No global legacy token flip.
- Customer-route expansion remains gated by owner-route completion and owner-wide review.
