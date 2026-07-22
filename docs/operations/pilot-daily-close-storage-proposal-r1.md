# Pilot Daily Close Storage Proposal R1

Status: **human-approved; empty encrypted container created and unmounted — 2026-07-22; zero data rows**

## Recommendation

Use one local operator-owned encrypted container on Kiattisak's Mac, outside the repository, cloud-synced folders, shared drives, and browser forms.

Recommended properties:

- dedicated APFS-encrypted disk image/container;
- encryption password stored only in macOS Keychain;
- container path outside Desktop/Documents/iCloud Drive and outside every project repository;
- explicit Time Machine exclusion before the first filled record;
- mounted only during reconciliation/reporting;
- access limited to Kiattisak's macOS account protected by FileVault and device login;
- filled CSV validated with `pnpm pilot:daily-close:validate -- <path>`;
- no queue/customer identifier, name, phone, LINE ID, token, PIN, note, URL, IP, or raw event row;
- deletion at immutable cohort expiry unless a scoped approved hold applies;
- deletion proof records container path/hash label, cohort, deletion time, absence check, Time Machine exclusion state, and operator—never file contents;
- incident response: unmount immediately, stop collection, rotate the container password if exposure is suspected, preserve only an explicitly approved held copy.

## Why this is recommended

- avoids giving a third-party spreadsheet account row-level pilot access;
- gives one clear owner/viewer boundary;
- keeps data outside git and project backups;
- supports a concrete deletion and proof procedure;
- the Daily Close contract is aggregate/non-PII, so live collaboration is unnecessary for the first shop.

## Trade-off

This is intentionally single-operator and not convenient for simultaneous mobile collaboration. If collaboration becomes necessary, choose and review a different provider before moving any filled record; do not silently upload the container or CSV.

## Approval boundary

Approval of this proposal would authorize only creation and validation of the empty encrypted storage location plus its access/deletion controls. It would not authorize filling records, enabling measurement, inviting customers, or starting the pilot.

## Empty-storage receipt

- Container: `~/.local/share/barber-queue-pilot/daily-close-r1.sparsebundle`
- Format: APFS sparsebundle, AES-256 encrypted
- Parent/container permissions: owner-only (`0700`)
- Key: stored in macOS Keychain service `barber-queue-pilot-daily-close-r1`; password was not written to repo/docs/chat
- Time Machine: explicitly excluded
- Cloud-sync/repository location: none
- Contents: README, R1 data dictionary, and header-only `pilot-daily-close-r1.csv`
- Validator: PASS — `0` data rows
- Final mount state: unmounted
- Convenience commands: `scripts/mount-pilot-daily-close.sh` and `scripts/unmount-pilot-daily-close.sh`

Filled records, measurement enablement, and pilot execution remain blocked.
