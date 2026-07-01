# Asset Manifest V1 — Pastel Paper Queue

Current preferred asset pack:

`docs/assets/generated-v1/`

The earlier hand-authored SVG files under `docs/assets/ui/` are now treated as draft/reference only because Kiattisak said they were not precise enough. Do not use the SVG draft pack as the final visual direction.

## Current generated raster assets

See: `docs/assets/generated-v1/manifest.md`

## Production-readiness note

The generated PNGs are better visually than the first SVG draft, but they do not currently include real alpha channels. They are suitable for visual direction and prototype use on matching Pastel Paper Queue backgrounds.

Before final production use, either:

1. regenerate assets with confirmed transparent output, or
2. run a proper cleanup/background-removal pass and export true transparent PNG/WebP variants.
