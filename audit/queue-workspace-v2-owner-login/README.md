# Queue Workspace V2 — Owner Login Correction Review

Status: technical QA passed; human-approved and promoted to V2 authority.

## Scope and preserved behavior

- `/owner/login` now opts into scoped Queue Workspace V2 through `data-customer-visual="v2"` and `bqa-owner-login-v2`; it remains an unauthenticated focused card rather than inheriting the authenticated owner shell.
- `loginOwner` preserves PostgreSQL rate limiting, passcode verification, session creation, `/owner` redirect, and logout destination. It now fails closed to `?error=setup` before rate limiting when owner login is genuinely unconfigured.
- The password input keeps `type="password"`, `required`, and `autoComplete="current-password"`.
- Invalid and rate-limited states remain field-owned through `aria-invalid`, `aria-describedby`, and `aria-errormessage`; setup remains a visible alert.
- A genuinely unconfigured isolated server was run with blank passcode/session-secret environment values. It rendered one setup notice, submission redirected to `?error=setup`, and the redirected page still rendered exactly one notice rather than duplicate setup messages.
- `BARBER_ADMIN_SESSION_SECRET` remains a documented separate production recommendation while the existing passcode fallback behavior stays intact; the UI no longer falsely claims both variables are required for local login.

## Review files

- `login-360x800.png`
- `login-390x844.png`
- `login-768x1024.png`
- `login-1024x768.png`
- `login-1440x1000.png`
- `login-invalid-390x844.png`
- `login-rate-limited-390x844.png`
- `login-setup-390x844.png` — configured-server defensive query-state render
- `login-unconfigured-real-390x844.png`
- `login-unconfigured-real-768x1024.png`
- `login-unconfigured-submit-390x844.png`
- `geometry.json`

## Responsive ownership

- The authentication card remains a single centered task up to 440px wide.
- Header, explanatory copy, optional notice, and form keep at least 12px separation.
- Input is at least 48px high and submit is at least 50px high.
- Long Thai rate-limit copy and mixed Thai/environment-variable setup copy wrap within card bounds without clipping.
- Automated coverage includes `360 / 390 / 559 / 560 / 759 / 760 / 768 / 1024 / 1440`; no horizontal overflow exists.
- Keyboard order is password then submit, with the V2 focus ring visible on the password field.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Owner auth configuration integration: 2/2 passed
- Integration aggregate: 54/54 passed
- Owner login V2 responsive/state/focus: 3/3 passed
- Owner settings/login contract aggregate: 13/13 passed
- Full Playwright: 65/65 passed

## Human decision recorded

Kiattisak approved the owner-login V2 correction after reviewing the default and error-state evidence.
