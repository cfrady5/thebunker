# Database Architecture

Postgres (Supabase) with UUID keys, integer-cents money, `timestamptz`
timestamps and Row Level Security on **every** table.

## Migration order

| File                                   | Contents                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| `0001_foundation.sql`                  | Extensions, helpers, profiles, staff roles, households, settings, notifications, audit log |
| `0002_facility.sql`                    | Bays, business/special hours, blackouts, pricing rules     |
| `0003_bookings_payments.sql`           | Holds, bookings (+exclusion constraints), participants, status history, payments, refunds |
| `0004_memberships.sql`                 | Plans, memberships, minute ledger                          |
| `0005_leagues_programs.sql`            | Leagues, teams, registrations, schedules, results, instructors, programs |
| `0006_events_menu_private_events.sql`  | Events, registrations, menu, private-event inquiries       |
| `0007_giftcards_waivers_content.sql`   | Gift cards, account credits, waivers, discounts, opening updates, interest list |
| `0008_rpc.sql`                         | Hold/booking RPCs + cleanup function                       |
| `0009_rls.sql`                         | All RLS policies                                           |
| `0010_square.sql`                      | Square order/payment reference columns                     |

`seed.sql` loads realistic development/staging content (clearly-marked
placeholders tracked in LAUNCH_CHECKLIST.md).

## Key relationships

```
auth.users ─1:1─ profiles ─┬─ households ── household_members
                           ├─ staff_roles
                           ├─ bookings ── booking_participants / status_history
                           ├─ memberships ── membership_ledger ── membership_plans
                           ├─ league_registrations ── leagues ── league_teams/schedules/results
                           ├─ program_registrations ── programs ── instructors
                           ├─ payments ── refunds
                           ├─ account_credits
                           └─ waiver_signatures ── waiver_templates
simulator_bays ── bookings / booking_holds / bay_blackouts
```

## Booking concurrency (no double-booking)

Three layers guarantee a bay can never be double-booked:

1. **Exclusion constraints** (`btree_gist`) — the database itself rejects
   overlapping rows:
   - `bookings_no_overlap`: `(bay_id, tstzrange(starts_at, ends_at))` for live
     statuses (`held`, `payment_pending`, `confirmed`, `checked_in`).
   - `booking_holds_no_overlap`: same range check for `active` holds.
2. **`create_booking_hold` RPC** — takes a per-bay advisory lock
   (`pg_advisory_xact_lock`), expires stale holds, checks bookings and
   blackouts, then inserts; an exclusion violation maps to `SLOT_UNAVAILABLE`.
3. **Server-side availability** — the UI only ever shows slots computed on the
   server from live data; the client never decides availability.

Checkout flow: hold (8–10 min, visible countdown) → `convert_hold_to_booking`
(RPC, `payment_pending`) → Square Checkout link → **webhook** flips to `confirmed`.
`expire_stale_holds()` (cron) expires abandoned holds and payment-pending
bookings so inventory is always released.

## Webhook behavior

**Square (`/api/webhooks/square`) — primary.** HMAC-verified
(`SQUARE_WEBHOOK_SIGNATURE_KEY`); `payment.updated` COMPLETED flips the
matching booking (by `square_order_id`) from `payment_pending` to `confirmed`,
records the payment and sends the confirmation email; `refund.updated`
COMPLETED marks payments/bookings refunded — including refunds issued directly
in the Square Dashboard.

## Legacy Stripe webhook (`/api/webhooks/stripe`)

- Signature-verified with `STRIPE_WEBHOOK_SECRET`; unverified requests are 400.
- `checkout.session.completed` → booking `confirmed` (idempotent — only from
  `payment_pending`), payment row upserted by intent id, confirmation email.
- `checkout.session.expired` → booking `expired`, slot released.
- `payment_intent.payment_failed` → failed payment recorded.
- `charge.refunded` → payment marked refunded/partially refunded.
- `customer.subscription.*` → membership status/period synced.

Client-side redirects are **never** trusted for payment state.

## Row Level Security model

- **Customers** read/update their own profile; read their own bookings,
  household, membership, payments, registrations, credits, gift cards and
  waivers; insert only waiver signatures (their own/their dependents').
- **Public** reads bays, hours, pricing, menu, published events/updates,
  leagues, programs, plans, active waiver templates and `site_settings`.
- **Staff** access is role-checked in the database via
  `has_staff_role(text[])` (security-definer, reads `staff_roles`) — the same
  roles are re-checked in server actions before any write.
- **Money and entitlements** (payments, refunds, membership minutes, gift-card
  balances, booking totals, role grants) are writable only via the service role
  in server code paths that performed their own authorization; customers have
  no insert/update policy on those tables at all.
- Public form submissions (interest, private-event inquiries) are inserted
  server-side after Zod validation, honeypot checks and per-IP rate limiting.

## Indexing highlights

GiST range indexes on booking/hold/blackout time ranges (also serve the
exclusion constraints); btree indexes on customer email (lower-cased unique),
booking status/date, Stripe identifiers, slugs, event dates, league/program
status, and gift-card hashes.
