# The Bunker — Staff Admin Guide

Everything staff can do lives at **`/admin`**. What you see depends on your
role; owners see everything.

## Roles

| Role       | Access                                                            |
| ---------- | ----------------------------------------------------------------- |
| owner      | Everything, including Team and Settings                           |
| manager    | Operations, facility, programs, content, reports                  |
| front_desk | Bookings, calendar, walk-ins, blackouts, customer lookup          |
| instructor | Lessons & programs, their participants                            |
| kitchen    | Menu availability                                                 |
| marketing  | Events, content, opening list, private events                     |

**Granting a role** (owner, via Supabase SQL editor — deliberately not possible
from the browser):

```sql
insert into staff_roles (profile_id, role)
select id, 'front_desk' from profiles where email = 'teammate@example.com';
```

Deactivate with `update staff_roles set active = false where …`.

## Daily operations

- **Dashboard (`/admin`)** — today's schedule, revenue, occupancy, pending
  payments and new event inquiries at a glance.
- **Check-in / no-show** — Bookings → row menu → *Check in*, *Mark no-show* or
  *Mark completed*. Every change is recorded in the status history and audit log.
- **Walk-ins** — Calendar → *Walk-in*. Pick bay, time, duration and a name. The
  system refuses times that collide with existing bookings.
- **Refunds** — Bookings → row menu → *Issue full refund* (owner/manager). The
  refund goes through Stripe and the booking flips to `refunded`. Partial
  refunds: use the Stripe dashboard, then the webhook updates payment status.

## Facility management

- **Block bay time** — Blackouts → *Block Time*. Choose one bay or all bays;
  blocked windows disappear from customer availability instantly.
- **Bay maintenance** — Bays → set *Degraded* (bookable, flagged) or *Offline*
  (removed from availability), or deactivate a bay entirely.
- **Hours** — Weekly hours and special dates are listed under Hours. Change
  values in the `business_hours` / `special_hours` tables (an editor is on the
  launch checklist).
- **Prices** — Pricing shows every rule; the highest-priority match wins.
  Adjust `pricing_rules` rows to change rates — takes effect immediately.

## Programs & content

- **Leagues / lessons / youth programs** — change registration status inline
  (interest → opening soon → open → waitlist/full → in progress → completed).
  The public site reflects status immediately.
- **Events** — publish or unpublish events inline. Only `published` events are
  visible publicly.
- **Menu** — mark items out of stock when the kitchen runs out; the
  public menu shows a *Currently unavailable* state.
- **Site content (`/admin/content`)** — edit the homepage hero, contact
  info/address, and the **business mode**:
  - `pre_opening` — interest collection, no booking
  - `reservations_open` — booking live
  - `fully_operational` — everything on
  - `temporarily_closed` — booking paused with a notice
- **Opening list (`/admin/email`)** — every signup with interests, plus CSV
  export for your email platform.

## Private events

Inquiries land in `/admin/private-events` with status pipeline: **new →
contacted → qualified → proposal sent → tentative hold → confirmed →
completed/lost**. Changing status prompts for an optional dated internal note.
Reply to the inquirer directly via the email link on each card.

## Reports & audit

- **Reports** — rolling 30-day revenue, bookings, average session, no-shows,
  gift-card liability and daily revenue, with CSV export.
- **Audit log** — every staff action that touches money, availability or
  customer state, with actor and details.
