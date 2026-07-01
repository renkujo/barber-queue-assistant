# LINE OA Integration

## Principle

LINE OA should support the product, not define the whole product.

The queue app must work through normal web links and QR codes. LINE is used when it is convenient for entry and notifications.

## Entry paths

Possible entry paths:

- LINE OA rich menu opens queue web app.
- Customer scans QR at shop.
- Owner sends booking/tracking link in chat.
- Customer opens link from Facebook/Instagram/Google profile.

If the customer enters through LINE/LIFF and consent/identity is available, store `lineUserId`.

If not, continue with phone/name and tracking code.

## MVP LINE features

### Rich menu

Suggested buttons:

- จองคิว
- เช็คคิวของฉัน
- เวลาว่างวันนี้
- แผนที่ร้าน / ติดต่อร้าน

### Notifications

Send when `lineUserId` is available:

- booking confirmed;
- queue ticket created;
- appointment reminder;
- confirm-coming request;
- queue is near;
- booking changed/cancelled;
- no-show/cancelled due to late arrival.

### Owner notifications

Optional MVP+:

- notify owner when new online booking arrives;
- notify owner when customer confirms/cancels;
- notify owner when a customer is late.

## Fallback behavior

If LINE identity is not available:

- show tracking link/code on screen;
- allow customer to reopen status page with code;
- owner can still manage queue manually;
- notification log records `skipped` or `none` channel.

## Do not build in MVP

- Full natural-language chatbot.
- Complex chat-based booking conversation.
- Mandatory LIFF-only customer journey.
- Payment/deposit through LINE.

These can come later if validated.
