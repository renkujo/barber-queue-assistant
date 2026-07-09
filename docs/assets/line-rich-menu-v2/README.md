# LINE Rich Menu V2

Generated asset for Barber Queue Assistant LINE Official Account rich menu.

## Files

- `rich-menu-v2.png` - upload image, 2500 x 1686 px.
- `rich-menu-v2.svg` - editable/source image generated with embedded LINE Seed Sans TH fonts.
- `generate-rich-menu-v2.mjs` - generator that renders the SVG to PNG with `sharp` from `app/package.json`.

## Style Source

The asset follows the app styles from:

- `app/src/app/globals.css`
- `app/src/styles/tokens.css`
- `app/src/styles/base.css`
- `app/src/styles/ui.css`
- `app/src/styles/app-ui.css`
- `app/src/styles/owner.css`
- `app/src/styles/toast.css`

Font stack confirmed from the app:

```css
font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
```

The generator embeds the bundled app fonts from:

```text
app/public/fonts/line-seed-sans-th/
```

## LINE OA Manager Template

Use LINE OA Manager Large template with one top area and three bottom areas.

| Area | Bounds | Action URL |
| --- | --- | --- |
| A | `x=0 y=0 width=2500 height=843` | `https://renkujo-barberqueueassistant-9c6sgw-449e71-91-210-146-172.sslip.io/line?target=walk-in` |
| B | `x=0 y=843 width=833 height=843` | `https://renkujo-barberqueueassistant-9c6sgw-449e71-91-210-146-172.sslip.io/line?target=book` |
| C | `x=833 y=843 width=834 height=843` | `https://renkujo-barberqueueassistant-9c6sgw-449e71-91-210-146-172.sslip.io/#queue-status` |
| D | `x=1667 y=843 width=833 height=843` | `https://renkujo-barberqueueassistant-9c6sgw-449e71-91-210-146-172.sslip.io/` |

## Regenerate

Run from the repository root:

```bash
node docs/assets/line-rich-menu-v2/generate-rich-menu-v2.mjs
```
