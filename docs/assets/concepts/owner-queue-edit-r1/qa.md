# Owner Queue Edit R1 — Image QA

Date: 2026-07-17 (Asia/Bangkok)  
Scope: Phase 6 visual reference only; no implementation changes.

## Provenance

- Generated directly with Codex built-in image generation in two calls: one Desktop call and one Mobile call.
- No retries, variants, correction generations, nested agents, or nested image CLIs were used.
- The built-in tool did not expose an underlying image-model version, so none is asserted here.
- Grounding sources: `docs/owner-queue-edit-image-reference-r1.md`, `docs/owner-queue-edit-phase6-brief.md`, `app/AGENTS.md`, the queue-edit page and schedule component, the queue-edit action and repository functions, the current owner/app UI CSS and tokens, and the supplied Desktop/Mobile rendered baselines.
- Desktop prompt direction: preserve the Pastel Paper Queue desktop shell; reorganize the truthful route into one connected correction workbench; make service/day/time the decision center; retain the seven fields, explicit walk-in no-lock path, one unresolved conflict notice, factual four-item rule rail, back-to-today, and one save action only.
- Mobile prompt direction: preserve the approved mobile top and bottom navigation; use the same connected-workbench language; put schedule controls first; retain all seven fields, compact conflict/business-hours guidance, private-note meaning, back-to-today, and one save action above the bottom navigation.
- Desktop native generation: `1505x1045`, SHA-256 `0d7981704fa0565beccbea9b668ecffeba339164a7c2006326f01b61be72fc2a`.
- Mobile native generation: `853x1844`, SHA-256 `33c02d88e2aaba3622ded2d1a30ef8b8184e88d5e9badc18af80124415e1fdd6`.
- Final PNGs were resized once with ImageMagick to the contract dimensions and stripped of metadata. No crop, repaint, compositing, or text correction was applied. Native and target aspect ratios were already effectively matched.

## Final artifacts

| Artifact | Dimensions | SHA-256 |
| --- | ---: | --- |
| `desktop-queue-edit-r1.png` | 1440x1000 | `779d6ddd61316658a380af528a2e7632986ef86f87ecf3507d1fac265f1d3206` |
| `mobile-queue-edit-r1.png` | 390x844 | `8c5ed8531494b581ba63925c04fcfb5a56b8d6b493c4b5b661cfc284b6069603` |

## Product-fit checks

- PASS — Authenticated owner queue-item edit context is clear on both screens.
- PASS — Pastel Paper Queue palette, cocoa utility type, fine borders, restrained shadows, mascot/brand placement, desktop sidebar, mobile top bar, and mobile bottom navigation are preserved in concept form.
- PASS — Customer name, optional phone, service, day, locked time, explicit `ไม่ล็อกเวลา / walk-in`, customer note, and private owner note are visible.
- PASS — Service/day/time form the visual decision center, while identity and notes remain subordinate.
- PASS — One unresolved conflict notice is visible; neither concept suggests that the conflict was automatically fixed.
- PASS — Conflict checking, business-hours limits, no-lock walk-in behavior, and private-note meaning are stated factually.
- PASS — Exactly one `บันทึกการแก้ไข` action appears per screen.
- PASS — `กลับคิววันนี้` is present on both screens.
- PASS — The private owner note is visually separated from customer-facing copy and explicitly says it is not sent to the customer.
- PASS — Mobile save is above the bottom navigation; the navigation does not cover a field or action.
- PASS — No status controls, LINE send/resend, payment/POS, CRM/customer history, staff assignment, analytics, destructive delete/cancel, charts, autosave, or extra editable fields are shown.

## Visible Thai-text defects

- Desktop service value appears as `ตัดผมซาย · 45 นาที · ฿350`; this likely intends `ตัดผมชาย`, so the generated Thai service text has a visible typo.
- Mobile no-lock helper copy appears malformed around `ใช้ไม่...`; it should be treated as generated placeholder text, not source copy.
- Small helper copy in the Desktop rule rail and the Mobile schedule/privacy rows is visibly softer than deterministic browser-rendered text. It remains readable but should be treated as visual-reference copy, not a pixel-accurate typography specimen.
- The generated mascot lettering/details are raster interpretations of the baseline asset rather than exact reproduction; this does not alter Thai product copy.

## Honest deviations

- The Desktop sidebar renders slightly wider than the brief's approximate 220px reference, reducing the workspace width modestly.
- The Desktop rule rail uses icon-led factual cards instead of the baseline's numbered cards.
- The Desktop workbench uses section dividers inside one large paper surface; it is intentionally less card-heavy than the current implementation.
- Mobile condenses the four Desktop rules into one schedule guidance row plus the private-note helper, rather than repeating four separate rule cards.
- Mobile places schedule before identity to satisfy the brief's early-decision priority; this differs from the current source order but does not change fields or behavior.
- The Mobile owner-note sample is shortened to `แพ้เจลจัดแต่งทรง`; the adjacent privacy copy still preserves the required internal-only meaning.
- The final files were resampled from the tool's native dimensions. The aspect-ratio change is negligible but the pixels are not native 1:1 model output.

## Gate

Human decision recorded: `PASS` — approved for authenticated Phase 6 implementation.
