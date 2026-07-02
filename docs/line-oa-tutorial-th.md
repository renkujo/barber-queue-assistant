# Tutorial: เชื่อม Barber Queue Assistant กับ LINE OA ตั้งแต่ศูนย์

เอกสารนี้เป็นคู่มือแบบทำตามทีละขั้นสำหรับเชื่อมระบบคิวร้านตัดผมกับ LINE Official Account, Messaging API, LINE Login และ LIFF

เป้าหมายสุดท้าย:

1. ลูกค้าเปิดลิงก์จาก LINE
2. ระบบรู้ `lineUserId` ของลูกค้า
3. ลูกค้ารับคิวหรือจองคิว
4. เจ้าของร้านกดจัดการคิว
5. LINE ส่งแจ้งเตือนกลับไปหาลูกค้าคนนั้นจริง

## ภาพรวมก่อนเริ่ม

สิ่งที่ต้องมี:

- LINE Official Account หรือบัญชี LINE ที่ใช้สร้าง OA ได้
- LINE Developers account
- โปรเจคนี้รัน local ได้
- PostgreSQL พร้อมใช้งาน
- tunnel HTTPS เช่น ngrok หรือ cloudflared สำหรับทดสอบ local

ในโปรเจคนี้ไม่มี backend แยกต่างหาก Next.js ตัวเดียวทำหน้าที่เป็น:

- frontend
- server actions
- API routes
- LINE webhook

## คำศัพท์ที่ต้องรู้

### LINE Official Account หรือ OA

บัญชี LINE ของร้าน ใช้ให้ลูกค้า follow และรับข้อความแจ้งเตือน

### Messaging API channel

ตัวเชื่อมสำหรับส่ง push message และรับ webhook event จาก LINE OA

ใช้ค่า:

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

### LINE Login channel

channel ที่ใช้สร้าง LIFF app เพื่อให้เว็บรู้ว่า user ที่เปิดจาก LINE คือใคร

### LIFF app

ประตูเข้าเว็บจาก LINE ถ้าลูกค้าเปิดผ่าน LIFF ระบบจะขอ profile แล้วได้ `lineUserId`

ในโปรเจคนี้ route กลางคือ:

```text
/line
```

## Step 1: สร้าง Provider

เข้า LINE Developers Console:

```text
https://developers.line.biz/console/
```

สร้าง Provider ใหม่

แนะนำชื่อ:

```text
Barber Queue Assistant
```

Provider คือกลุ่มที่เก็บ LINE channels ของโปรเจคนี้ เช่น Messaging API และ LINE Login

## Step 2: สร้าง LINE Official Account

ไปที่ LINE Official Account Manager แล้วสร้าง OA ใหม่

ค่าที่แนะนำ:

- ชื่อบัญชี:

```text
Barber Queue Assistant
```

หรือถ้าใช้ชื่อร้านจริง:

```text
Dream Catcher Barber
```

- ประเทศ:

```text
ไทย
```

- ประเภทธุรกิจ:

เลือกกลุ่มที่ใกล้กับร้านตัดผม เช่น:

```text
บริการ / ความงาม / สุขภาพและความงาม / ร้านทำผม
```

ถ้ามีช่อง Privacy Policy / Terms of Use และขึ้นว่า optional สามารถเว้นว่างไว้ก่อนได้

## Step 3: เปิด Messaging API

ใน LINE Official Account Manager:

1. เข้า OA ที่สร้างไว้
2. ไปที่ `Settings`
3. เลือก `Messaging API`
4. กด enable หรือ connect กับ LINE Developers provider
5. เลือก Provider ที่สร้างไว้ เช่น `Barber Queue Assistant`

หลังเปิดแล้ว ให้กลับไป LINE Developers Console แล้วหา Messaging API channel ของ OA นี้

## Step 4: เอา Channel secret และ Channel access token

ใน LINE Developers Console:

1. เลือก Provider
2. เลือก Messaging API channel ของ OA
3. ไปที่ tab `Basic settings`
4. copy ค่า `Channel secret`
5. ไปที่ tab `Messaging API`
6. หา `Channel access token`
7. กด `Issue` หรือ `Reissue`
8. copy token

ใส่ในไฟล์:

```text
app/.env
```

เพิ่มหรือแก้ให้มี:

```env
LINE_CHANNEL_SECRET="replace-with-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="replace-with-channel-access-token"
```

ห้าม commit ค่า token จริง

## Step 5: สร้าง LINE Login channel

ใน LINE Developers Console:

1. เลือก Provider เดิม
2. กดสร้าง channel ใหม่
3. เลือกชนิด channel เป็น `LINE Login`

ค่าที่แนะนำ:

- Channel name:

```text
Barber Queue
```

เหตุผล: LINE จำกัดความยาวชื่อ channel ประมาณ 20 ตัวอักษร

- Channel description:

```text
Booking and queue notifications for a barber shop.
```

- App types:

ติ๊ก:

```text
Web app
```

ไม่จำเป็นต้องติ๊ก Mobile app สำหรับ MVP นี้

- Require two-factor authentication:

เปิดไว้ได้ ไม่กระทบลูกค้าโดยตรง

- Privacy policy URL / Terms of use URL:

optional เว้นว่างได้ถ้าระบบยังเป็น MVP/local test

จากนั้นติ๊ก agreement checkbox แล้วกด create

## Step 6: สร้าง LIFF app

เข้า LINE Login channel ที่สร้างไว้ แล้วเปิด tab `LIFF`

กด `Add a LIFF app`

ค่าที่แนะนำ:

- LIFF app name:

```text
Barber Queue Entry
```

- Size:

```text
Full
```

- Endpoint URL:

ถ้าเป็น production:

```text
https://your-domain.example/line
```

ถ้าเป็น local tunnel:

```text
https://your-tunnel-url/line
```

- Scopes:

ติ๊ก:

```text
openid
profile
```

ไม่ต้องติ๊ก `chat_message.write` ตอนนี้

- Add friend option:

เลือก:

```text
On (Normal)
```

- Scan QR:

ปิดไว้ได้

กด `Add`

หลังสร้างเสร็จ copy ค่า `LIFF ID`

ใส่ใน `app/.env`:

```env
NEXT_PUBLIC_LINE_LIFF_ID="replace-with-liff-id"
```

ชื่อตัวแปรต้องเป็น `NEXT_PUBLIC_LINE_LIFF_ID` เพราะโค้ดฝั่ง browser ต้องอ่านค่านี้

## Step 7: ตั้ง webhook URL

ใน LINE Developers > Messaging API channel:

ตั้ง webhook URL เป็น:

```text
https://your-domain.example/api/line/webhook
```

ถ้าใช้ local tunnel:

```text
https://your-tunnel-url/api/line/webhook
```

เปิด `Use webhook`

จากนั้นกด verify webhook

ผลที่ควรได้:

- valid webhook returns `200`
- invalid signature returns `401`
- invalid JSON returns `400`

## Step 8: รันระบบสำหรับ local LINE testing

สำหรับการทดสอบผ่าน LINE webview ห้ามใช้ `pnpm dev` เป็นหลัก เพราะ LINE webview + tunnel อาจโหลด dev/Turbopack chunks ไม่ครบ ทำให้ select/icon ไม่ทำงาน

ให้ใช้ production local mode:

```bash
cd /Users/kiattisakmayong/playground/barber-queue-assistant/app
pnpm build
pnpm start
```

จากนั้นเปิดอีก terminal แล้วรัน tunnel:

```bash
ngrok http 3000
```

หรือ:

```bash
cloudflared tunnel --url http://localhost:3000
```

ถ้า tunnel URL เปลี่ยน ต้องกลับไปแก้ทั้งสองที่:

1. LIFF Endpoint URL
2. Messaging API Webhook URL

ตัวอย่างถ้า tunnel คือ:

```text
https://abc123.ngrok-free.app
```

ให้ตั้ง:

```text
LIFF Endpoint URL = https://abc123.ngrok-free.app/line
Webhook URL       = https://abc123.ngrok-free.app/api/line/webhook
```

## Step 9: URL สำหรับทดสอบใน LINE

หลังตั้ง LIFF endpoint แล้ว ให้เปิดจากในแอป LINE ด้วย URL เหล่านี้:

รับคิววันนี้:

```text
https://your-domain-or-tunnel/line?target=walk-in
```

จองเวลา:

```text
https://your-domain-or-tunnel/line?target=book
```

หรือใช้ LIFF URL ที่ LINE ให้มา รูปแบบ:

```text
https://liff.line.me/<liff-id>
```

แต่ถ้าต้องการเลือก target เป็น booking/walk-in ชัดเจน ให้ใช้ domain/tunnel route ที่ลงท้าย `/line?target=...`

เมื่อสำเร็จ ระบบจะ redirect ไป:

```text
/walk-in?lineUserId=...
```

หรือ:

```text
/book?lineUserId=...
```

จากนั้น form จะส่ง `lineUserId` เข้า queue creation อัตโนมัติ

## Step 10: ทดสอบ end-to-end จริง

ทดสอบ walk-in:

1. เปิด URL นี้จากใน LINE:

```text
https://your-domain-or-tunnel/line?target=walk-in
```

2. ระบบควรพาไปหน้า walk-in
3. กรอกชื่อ เบอร์ บริการ
4. กดรับคิววันนี้
5. เปิดหน้า owner:

```text
https://your-domain-or-tunnel/owner
```

6. กด `เริ่มตัด`
7. LINE ควรได้รับ notification

ใน DB ควรเห็น `NotificationLog` แบบ:

```text
QUEUE_CREATED  LINE  SENT
QUEUE_NEAR     LINE  SENT
```

## ตรวจจาก database ว่าส่งจริงไหม

รันจาก `app/`:

```bash
node - <<'NODE'
process.loadEnvFile('.env')
const pg = require('pg')
;(async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const logs = await client.query(`
    select
      nl."createdAt",
      nl."channel",
      nl."type",
      nl."status",
      case when nl."recipient" is null then null else concat(left(nl."recipient", 4), '…', right(nl."recipient", 4)) end as "recipient",
      nl."error",
      qi."customerNameSnapshot" as "customerName",
      qi."status" as "queueStatus"
    from "NotificationLog" nl
    left join "QueueItem" qi on qi."id" = nl."queueItemId"
    order by nl."createdAt" desc
    limit 12
  `)
  console.table(logs.rows)
  await client.end()
})().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
NODE
```

อ่านผล:

- `SENT` = ส่ง LINE จริงสำเร็จ
- `SKIPPED` + `NONE` = คิวนั้นไม่มี `lineUserId`
- `SKIPPED` + `LINE` = มี `lineUserId` แต่ไม่มี access token
- `FAILED` = เรียก LINE API แล้วล้ม ดู `error`

## Troubleshooting

### เปิดใน LINE แล้ว select/icon ไม่ทำงาน

สาเหตุที่เจอจริง: ใช้ `pnpm dev` ผ่าน LINE webview/ngrok แล้ว client JS hydrate ไม่ครบ

วิธีแก้:

```bash
pnpm build
pnpm start
```

แล้วใช้ tunnel ชี้ port 3000 ใหม่

### เปิดแล้วไม่ redirect ไป `/walk-in?lineUserId=...`

เช็ค:

1. `NEXT_PUBLIC_LINE_LIFF_ID` อยู่ใน `app/.env`
2. restart server แล้วหลังแก้ env
3. LIFF endpoint เป็น tunnel/domain ปัจจุบัน + `/line`
4. เปิดจากในแอป LINE ไม่ใช่ browser ปกติ
5. Scopes มี `openid` และ `profile`

### Webhook verify ไม่ผ่าน

เช็ค:

1. Webhook URL ลงท้าย `/api/line/webhook`
2. tunnel ยังไม่หมดอายุ
3. `LINE_CHANNEL_SECRET` ใน `.env` ตรงกับ Messaging API channel
4. server กำลังรันอยู่ที่ port 3000

### LINE ไม่ส่ง notification

เช็ค `NotificationLog` ก่อน

- ถ้า `NONE/SKIPPED`: user ไม่ได้เข้าผ่าน LIFF หรือ queue ไม่มี `lineUserIdSnapshot`
- ถ้า `LINE/SKIPPED`: ไม่มี `LINE_CHANNEL_ACCESS_TOKEN`
- ถ้า `LINE/FAILED`: token ผิด หมดอายุ หรือ LINE API reject
- ถ้า `LINE/SENT`: ระบบส่งสำเร็จแล้ว ให้เช็คบัญชี LINE ปลายทาง

### Owner หรือหน้า queue ไม่มีข้อมูล

ไม่ใช่ปัญหา LINE เสมอไป

ถ้า DB วันนี้ไม่มี active queue ระบบจะแสดงว่างจริง เพราะโปรเจคนี้ตั้งใจไม่ fallback mock เมื่อ DB ใช้งานได้

สร้างคิวใหม่ผ่าน `/walk-in` หรือ `/line?target=walk-in` ก่อน แล้วค่อยเช็ค owner

## Commands ที่ควรรันหลังแก้โค้ด

จาก `app/`:

```bash
pnpm typecheck
pnpm lint
pnpm test:integration
pnpm e2e
pnpm prisma:validate
pnpm build
```

## สถานะล่าสุดที่ทดสอบจริงแล้ว

ยืนยันแล้วว่า local LINE test ใช้งานได้เมื่อใช้:

```bash
pnpm build
pnpm start
ngrok http 3000
```

และ `NotificationLog` แสดง:

```text
QUEUE_CREATED  LINE  SENT
QUEUE_NEAR     LINE  SENT
```

แปลว่า flow นี้ทำงานครบ:

```text
LINE LIFF → walk-in → owner start service → LINE push notification
```
