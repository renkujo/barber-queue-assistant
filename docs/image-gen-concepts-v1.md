# Image-generation Concepts V1

These prompts are for generating visual concept images before committing to a design system.

Important note: generated UI images are reference boards, not final implementation proof. Use them to choose mood, hierarchy, palette, spacing, and component language. Final UI still needs a real design system and coded responsive checks.

## Recommended direction

Start with **Concept A — Warm Paper Queue**.

It best matches the product:

- one-owner barber shop;
- calm, local, practical;
- customer self-service without feeling corporate;
- owner dashboard that feels like a work tool, not salon enterprise software;
- suitable for Thai-first web app and LINE OA entry.

## Shared image-gen constraints

Use these constraints in every prompt:

```txt
No emojis. No blue-purple SaaS gradients. No neon. No glassmorphism. No fake charts. No KPI grid spam. No tiny unreadable text. No generic startup look. No overly rounded pill UI. No website hero inside a phone. Keep all Thai text large and readable; if exact Thai text cannot be rendered perfectly, keep labels short and simple.
```

## Concept A — Warm Paper Queue

### Mood

Warm, local, tactile, calm. Feels like a modern queue ticket system made for a small Thai barber shop, not a corporate salon platform.

### Palette

- paper background: `#FAF8F5`
- warm surface: `#FFFDF9`
- charcoal text: `#251F19`
- copper action: `#A05D2B`
- dark copper: `#82471F`
- sage ready state: `#2F7A4F`
- clay danger state: `#A33D31`
- soft line: `#E6DDD2`

### Visual cues

- matte paper texture;
- queue ticket feeling;
- small barber-tool line motifs;
- clear time blocks;
- restrained copper buttons;
- owner actions large and direct.

### Prompt A1 — four-screen mobile flow board

```txt
Design a premium mobile web app concept for “Barber Queue Assistant”, a queue assistant for a one-owner Thai barber shop. Show four iPhone-style phone mockups in one clean horizontal board with equal spacing.

Platform feel: cross-platform premium mobile web app, app-native, safe-area aware.
Visual direction: warm paper queue ticket system, calm local barber shop, matte tactile surfaces, charcoal typography, restrained copper primary action, sage green for ready/open state, clay red only for late/no-show warning.

Screens, left to right:
1. Customer public status screen: shop open today, current queue count, estimated wait, two clear actions: book a time and get today queue.
2. Booking screen: service selection, date/time slots, simple customer name/phone fields, clear confirm button.
3. Queue tracking screen: queue code, current position, estimated time, confirm coming/cancel actions, subtle LINE notification available note.
4. Owner daily queue screen: current customer, next customer, waiting list, late/no-show warning, large owner action buttons: done, arrived, wait more, no-show, add walk-in.

Composition: clean iPhone frames, consistent device size, content is the hero. Use generous spacing, readable Thai-first labels, no tiny text. Avoid generic SaaS dashboard. Avoid fake charts. Avoid glassmorphism. Avoid purple or blue gradients. No emojis.

Typography: refined sans-serif, high readability, Thai labels large enough to read. Use short realistic Thai labels only.
Background: warm paper off-white with ultra-subtle grain. UI surfaces are mostly flat with 1px warm borders and very soft shadows only where functionally needed.
Iconography: custom-feeling simple barber/queue line icons, consistent stroke, not generic app icons.
```

### Prompt A2 — owner admin focused screen

```txt
Create one detailed iPhone-style mobile screen concept for the owner/admin side of “Barber Queue Assistant”. The owner is the only barber and uses this while working, so the screen must be fast, readable, and touch-friendly.

Screen: Today Queue. Top shows shop open status and current time. Main area shows “กำลังทำ” with customer name, service, started time, and one large “เสร็จแล้ว” action. Below it shows “คิวถัดไป” with an arrived/confirm button. Then a warning block for a late appointment with actions: wait 10 minutes, move to waiting queue, mark no-show. Below is a simple waiting list with booking and walk-in rows.

Style: Warm Paper Queue direction. Off-white paper background, charcoal text, copper action, sage success, clay red warning. Matte texture. Flat surfaces, 1px borders, subtle depth only. No blue/purple, no neon, no glass, no emoji, no fake charts, no overly decorative cards.

Priority: owner can understand the next action in two seconds. Large tap targets. Thai labels are readable. Not a salon enterprise dashboard.
```

### Prompt A3 — customer booking focused screen

```txt
Create one detailed iPhone-style mobile screen concept for the customer side of “Barber Queue Assistant”. The customer may open it from QR code, normal web link, social bio, or LINE OA rich menu, so do not make LINE feel mandatory.

Screen: Shop status and booking entry. Show a calm top area with shop name, open/paused status, estimated wait, and current queue count. Show two primary choices: “จองเวลา” and “รับคิววันนี้”. Show next available time slots below. Include a small existing queue checker with a queue code field.

Visual direction: modern local Thai barber shop, warm paper texture, charcoal typography, copper primary button, sage open state. Simple queue-ticket-like layout, spacious and readable.

Avoid: app-store fintech style, blue SaaS gradients, generic cards, tiny text, chart widgets, emojis, glassmorphism, mandatory LINE branding.
```

## Concept B — Charcoal Chair

### Mood

More premium and masculine. Better if the shop brand wants a dark barber-chair identity. Good for owner/admin, but may feel too heavy for customer booking.

### Palette

- charcoal background: `#171412`
- surface: `#231F1B`
- warm text: `#F3EBDD`
- copper accent: `#C47742`
- muted sand: `#B8AA99`
- sage ready: `#81A684`
- clay warning: `#D07A63`

### Prompt B1 — dark premium concept board

```txt
Design a premium mobile app concept board for “Barber Queue Assistant”, a queue assistant for a one-owner barber shop. Show three iPhone mockups: customer status, queue tracking, owner daily queue.

Visual direction: Charcoal Chair. Dark charcoal barber studio, warm sand text, copper actions, subtle matte leather and paper textures, restrained premium atmosphere. It should feel like a serious work tool for a skilled solo barber, not a nightclub app and not a generic dark SaaS dashboard.

Customer screens must stay welcoming and readable. Owner screen must be action-first with current customer, next customer, late/no-show warning, and large tap buttons.

No neon. No blue/purple gradients. No glassmorphism. No fake charts. No tiny text. No emojis. No overdecorated barber clichés. Use subtle line icons and clean queue-ticket geometry.
```

## Concept C — Local Queue Ticket

### Mood

Most practical and local. Feels like a digital paper queue card. Less premium, more immediately understandable.

### Palette

- ticket paper: `#FFF9ED`
- ink: `#211C17`
- stamp red: `#A84B3D`
- queue copper: `#B66A34`
- shop green: `#3F7A4A`
- line: `#E9DCC8`

### Prompt C1 — tactile queue-ticket concept

```txt
Design a mobile web app concept for “Barber Queue Assistant” using a tactile local queue-ticket visual language. Show four phone mockups: shop status, booking, queue ticket tracking, owner today queue.

The UI should feel like a digital version of a clean paper queue ticket used in a small Thai barber shop. Use warm ticket paper, charcoal ink, copper action color, small stamp-like status treatment, subtle perforation or receipt-line motifs, but keep it premium and modern.

Customer screens should answer: is the shop open, how many queues are waiting, when can I book, what is my queue status. Owner screen should show: current customer, next customer, late/no-show risk, waiting list, and big one-tap actions.

Keep Thai labels readable and short. No emojis. No blue/purple SaaS gradients. No glass. No fake charts. No clutter. No tiny text. No corporate salon dashboard feeling.
```

## Suggested generation order

1. Generate Prompt A1 first.
2. If the overall mood is right, generate A2 and A3 as detailed screens.
3. If A feels too soft, compare with B1.
4. If A feels too polished/corporate, compare with C1.
5. After choosing a direction, create the design system from the selected concept:
   - color tokens;
   - typography;
   - radius;
   - border/shadow;
   - buttons;
   - inputs;
   - queue rows;
   - status states;
   - owner action patterns;
   - mobile layout rules.

## Concept D — Pastel Paper Queue

### Mood

Softer version of Warm Paper Queue. Friendly, calm, approachable, less masculine and less rigid, while still readable and useful for a one-owner barber shop.

### Palette

- warm cream background: `#FFF8EE`
- soft paper surface: `#FFFDF8`
- cocoa ink: `#3A2D25`
- muted brown text: `#7A6A5D`
- peach primary: `#E7A77C`
- apricot active: `#F4C7A1`
- sage status: `#A8C7A1`
- mint soft: `#DDEEDB`
- butter slot: `#F7E3A1`
- dusty rose warning: `#E8A9A1`
- warm line: `#EADCCB`

### Visual cues

- soft pastel paper cards;
- friendly barber queue ticket mood;
- less dark contrast than Warm Paper, but text must remain readable;
- peach/apricot buttons instead of hard copper;
- sage/mint for open and ready states;
- dusty rose for late/no-show warnings;
- avoid babyish or candy-like colors.

### Prompt D1 — pastel four-screen mobile flow board

```txt
Design a premium mobile web app concept for “Barber Queue Assistant”, a queue assistant for a one-owner Thai barber shop. Show four iPhone-style phone mockups in one clean horizontal board with equal spacing.

Platform feel: cross-platform premium mobile web app, app-native, safe-area aware.
Visual direction: Pastel Paper Queue — a softer friendlier version of a warm paper queue ticket system. Calm local Thai barber shop, matte tactile paper surfaces, cocoa-brown typography, soft peach/apricot primary actions, sage and mint for open/ready state, dusty rose only for late/no-show warning. It should feel approachable and gentle, not hard, not masculine, not corporate.

Screens, left to right:
1. Customer public status screen: shop open today, current queue count, estimated wait, two clear actions: book a time and get today queue.
2. Booking screen: service selection, date/time slots, simple customer name/phone fields, clear confirm button.
3. Queue tracking screen: queue code, current position, estimated time, confirm coming/cancel actions, subtle LINE notification available note.
4. Owner daily queue screen: current customer, next customer, waiting list, late/no-show warning, large owner action buttons: done, arrived, wait more, no-show, add walk-in.

Composition: clean iPhone frames, consistent device size, content is the hero. Use generous spacing, readable Thai-first labels, no tiny text. Avoid generic SaaS dashboard. Avoid fake charts. Avoid glassmorphism. Avoid purple or blue gradients. No emojis.

Typography: refined Thai-first sans-serif, high readability, comfortable text sizes. Use short realistic Thai labels only.
Background: warm cream off-white with ultra-subtle paper grain. UI surfaces are mostly flat with 1px warm borders and very soft shadows only where functionally needed.
Iconography: custom-feeling simple barber/queue line icons, consistent stroke, soft cocoa color, not generic app icons.

Hard negatives: no neon, no blue-purple SaaS gradients, no glassmorphism, no fake charts, no KPI grid spam, no tiny unreadable text, no harsh black, no hard dark copper, no candy colors, no childish pastel, no overly rounded pill UI, no website hero inside a phone.
```
