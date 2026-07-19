# Owner Settings R1 QA / Provenance

Status: visual-reference preparation complete; human visual `PASS` recorded.

## Files

| File | Dimensions | Format | SHA-256 |
| --- | ---: | --- | --- |
| `docs/assets/concepts/owner-settings-r1/desktop-settings-r1.png` | 1440×1000 | PNG | `d4309b65a767a54d85aecf4ef453e01249391a6905434a7491803d7143214097` |
| `docs/assets/concepts/owner-settings-r1/mobile-settings-r1.png` | 390×844 | PNG | `fa473ea58d1965b302853398d1ff8af6fc531f69f0bd4f621f50164309ec600e` |

## Provenance

- Baseline render inspected before generation:
  - `/tmp/owner-settings-current-desktop.png` — current `/owner/settings` at 1440×1000.
  - `/tmp/owner-settings-current-mobile.png` — current `/owner/settings` at 390×844.
- Source/contract inspected before generation:
  - `app/AGENTS.md`
  - `docs/owner-settings-phase5-brief.md`
  - `docs/owner-settings-image-reference-r1.md`
  - `app/src/app/owner/settings/page.tsx`
  - `app/src/app/owner/actions.ts`
  - `app/src/app/owner/_components/owner-navigation.tsx`
  - `app/src/styles/owner.css`
- Generation lane: fresh Direct Codex tmux lane, Codex CLI `0.144.2`, model `gpt-5.6-sol`, high reasoning, built-in image generation.
- Source generated images:
  - Desktop source: `/Users/kiattisakmayong/.codex/generated_images/019f7094-efa4-7a71-b1e4-0684106c830f/exec-83e7bea9-fb40-4367-a1a0-ffe09e183355.png` — generated at 1504×1046.
  - Mobile source: `/Users/kiattisakmayong/.codex/generated_images/019f7094-efa4-7a71-b1e4-0684106c830f/exec-2e9ca769-a190-4e32-bee8-6da3c6745bf2.png` — generated at 853×1844.
- Canonical staged PNGs were resampled with `sips` to the exact requested dimensions. No second concept, variant, or corrective regeneration was requested.

## Product-fit checks

- Product identity: pass. Both concepts retain the approved warm Pastel Paper Queue owner shell, cocoa text, peach actions, restrained borders, and Thai-first utility tone.
- Desktop back office: pass. The desktop concept reads more like a connected shop-settings control desk than the current generic form-plus-rail page.
- Mobile app: pass with note. The mobile concept exposes LINE, availability, services, and settings controls early while keeping the bottom nav clear of the save action.
- Product truth: pass. Visible features stay within real `/owner/settings` fields/actions: shop name, open/close time, queue intake, advance booking, same-day online ticket, manual wait, single save, LINE owner connection, availability link, services link, and setting-effect guidance.
- Unsupported features: none observed. No staff, branches, POS/payments, analytics, revenue, reports, QR promotions, inventory, discounts, or extra notification channels appear.

## Visible Thai/text defects and deviations

- Generated text is non-authoritative. Implementation must use real HTML/source strings, not pixels from these images.
- Desktop Thai is mostly legible, but some small support-card copy is softened by image generation/resampling and should not be treated as final microcopy.
- Mobile Thai is mostly legible, but the small dusty-rose setting-effect note is soft and may be hard to read at real device size.
- The concepts use visual toggle-like controls for boolean settings. Runtime currently uses select controls; implementation may adapt the presentation only if the existing boolean names/values and save behavior remain unchanged.
- Native image generation returned non-contract source dimensions, then the final staged PNGs were resampled to the exact requested 1440×1000 and 390×844 sizes.

## Human Decision

Human visual `PASS` recorded for Phase 5. Runtime implementation should preserve exact source labels, form fields, validation, LINE link behavior, and one-save semantics.
