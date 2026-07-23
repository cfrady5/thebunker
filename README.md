# The Bunker Indoor Golf

The complete digital platform for **The Bunker Indoor Golf** — a recreational and
instructional indoor golf facility opening in **Linton, Indiana in Fall 2026**,
founded by Jay and Amanda.

> A year-round place to play, learn, compete and connect.

## What's included

- **Premium marketing site** — homepage, simulator experience, pricing,
  memberships, lessons, youth programs, leagues, tournaments, events, Highland
  Stage, menu, private events, gift cards, about, FAQ, contact, policies and
  accessibility pages, all SEO-optimized with structured data.
- **Booking engine** — server-computed availability, concurrency-safe checkout
  holds (advisory locks + Postgres exclusion constraints), Stripe Checkout, and
  webhook-verified confirmation.
- **Customer accounts** — Supabase Auth, dashboard, reservations with
  self-service cancellation/refund logic, membership view, credits, gift cards,
  household members for youth programs, waivers, notifications, profile and
  security.
- **Admin dashboard** — role-based staff area covering today's operations, a bay
  calendar with walk-ins, bookings with check-in/no-show/refund actions,
  customers, bays, hours, blackouts, pricing, leagues, programs, events, menu
  availability, private-event pipeline, gift-card liability, discounts, site
  content (business mode, hero, contact), opening-list export, reports, team and
  audit log.
- **Pre-opening mode** — a site-wide `business_mode` setting flips the entire
  experience between interest collection and live booking without a deploy.
- **Transactional email** — branded React Email templates via Resend.
- **Tests** — 46 unit tests for the money/time logic plus Playwright e2e specs.

## Stack

| Layer      | Technology                                                       |
| ---------- | ---------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) · React 19 · TypeScript (strict)         |
| Styling    | Tailwind CSS · shadcn-style components · Radix primitives        |
| Data       | Supabase (Postgres, Auth, RLS)                                   |
| Payments   | Stripe Checkout · Stripe Billing · Customer Portal · webhooks    |
| Email      | Resend + React Email                                             |
| Validation | Zod (client + server re-validation)                              |
| Dates      | date-fns + date-fns-tz (facility TZ: America/Indiana/Indianapolis) |
| Testing    | Vitest (unit) · Playwright (e2e)                                 |
| Hosting    | Vercel (cron jobs configured in `vercel.json`)                   |

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in what you have — see below
npm run dev
```

**The site runs with zero configuration.** Without Supabase env vars it renders
in a degraded pre-opening mode using seed-equivalent fallback content; forms
explain that they aren't connected. This makes previews and design review easy.

### Environment variables

Every variable is documented in [`.env.example`](.env.example). The important
groups:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — database + auth (service key is server-only).
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET` — payments.
- `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATIONS_EMAIL` — email.
- `CRON_SECRET` — protects the scheduled job endpoints.

### Database setup

1. Create a Supabase project.
2. Apply migrations in order — they're numbered:
   ```bash
   supabase db push          # or run supabase/migrations/*.sql in order
   ```
3. Load seed data:
   ```bash
   psql $DATABASE_URL -f supabase/seed.sql
   ```
4. Sign up through the app, then grant yourself the owner role (service
   role/SQL editor):
   ```sql
   insert into staff_roles (profile_id, role)
   select id, 'owner' from profiles where email = 'you@example.com';
   ```

### Stripe setup

1. Add the secret/publishable keys to `.env.local`.
2. Create a webhook endpoint pointing at `/api/webhooks/stripe` subscribed to:
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`, `charge.refunded`,
   `customer.subscription.*`.
3. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. For memberships, create Stripe Prices and store their IDs in
   `membership_plans.stripe_price_id`.

Payments are **never** trusted from client redirects — the webhook is the only
thing that marks a booking confirmed.

### Resend setup

1. Verify your sending domain in Resend.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `The Bunker <hello@yourdomain>`).
3. Emails silently no-op (with a server log) when unconfigured.

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # strict TypeScript check
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Playwright (boots the dev server automatically)
npm run format       # Prettier
```

## Deployment (Vercel)

1. Import the repo into Vercel and set all environment variables.
2. `vercel.json` schedules two daily cron jobs (send `Authorization: Bearer
   $CRON_SECRET`): hold-expiry cleanup and booking reminders. Daily fits the
   Hobby plan's cron limit; on Pro you can tighten them (e.g. `*/10 * * * *`
   for hold cleanup, hourly for reminders) — correctness doesn't depend on
   frequency since availability ignores expired holds in real time and the
   reminder job is idempotent.
3. Point the Stripe webhook at the production URL.
4. Work through [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) before flipping
   `business_mode` to `reservations_open`.

## Further docs

- [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) — day-to-day staff operations
- [`DATABASE.md`](DATABASE.md) — schema, RLS, concurrency and webhook behavior
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — colors, type, components, logo usage
- [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) — everything left before opening
