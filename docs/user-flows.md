# User Flows

## Customer flow — check shop status

1. Customer opens public link, QR, LINE OA menu, or social link.
2. System shows today status:
   - open/closed/paused/full;
   - current queue count;
   - approximate wait time;
   - available booking slots if any.
3. Customer chooses:
   - book a time;
   - get today's queue;
   - track existing queue.

## Customer flow — scheduled booking

1. Customer selects service.
2. Customer selects available date/time.
3. Customer enters name, phone, optional note.
4. If opened from LINE and user identity is available, system stores `lineUserId`.
5. System confirms booking.
6. Customer receives:
   - confirmation screen;
   - tracking link/code;
   - LINE message if available.
7. Before appointment, system sends reminder/confirm-coming message if possible.

## Customer flow — walk-in / today's queue

1. Customer opens queue page.
2. System shows estimated wait and whether queue intake is open.
3. Customer selects service and enters basic info.
4. System creates queue ticket.
5. Customer sees queue status/tracking link.
6. System notifies when queue is near if channel is available.

## Owner flow — daily queue

1. Owner opens admin dashboard.
2. Default page shows today queue only.
3. Owner sees:
   - current customer;
   - next customer;
   - waiting walk-ins;
   - scheduled bookings today;
   - late/no-show risk items;
   - paused/blocked time.
4. Owner uses fast actions:
   - arrived;
   - start;
   - done;
   - wait more;
   - no-show;
   - cancel;
   - add walk-in;
   - block time;
   - pause queue.

## Owner flow — manual queue from chat/phone

1. Customer contacts owner outside the app.
2. Owner quickly taps `เพิ่มคิว`.
3. Owner enters minimum info:
   - name;
   - phone/contact;
   - service;
   - booking time or walk-in;
   - note if needed.
4. Queue appears in the same daily list.

## Queue ordering principle

The system suggests order using:

1. current in-progress item;
2. scheduled booking times;
3. arrived/waiting customers;
4. walk-in creation time;
5. owner manual override.

Owner override always wins because real shop situations are messy.
