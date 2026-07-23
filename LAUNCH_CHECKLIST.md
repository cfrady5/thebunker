# Launch Checklist

Everything that must be finalized before The Bunker opens. Placeholder values
in code/seed are marked below with where to change them.

## Business information

- [ ] **Street address** — Admin → Site Content (or `site_settings.facility`)
- [ ] **Phone number** — same place; enables Call button in the mobile bar
- [ ] **Public email** — currently `hello@thebunkerlinton.com` placeholder
- [ ] **Final operating hours** — `business_hours` table (seeded with placeholders)
- [ ] **Holiday hours** — `special_hours` table
- [ ] **Social links** — `site_settings.social`

## Facility & product

- [ ] **Simulator brand & course count** — `site_settings.simulator` (currently unannounced)
- [ ] **Final bay count and names** — `simulator_bays` (seeded with 4)
- [x] **Brand assets** — real crest + wordmark processed into `/public/brand`
      (transparent PNG/WebP; sources in `/assets/source`)
- [ ] **Facility photography** — homepage gallery currently uses interim stock
      golf photos; replace with facility shoots (lounge, lessons, food, live
      music, league nights) by adding files to `/public/gallery` and entries in
      `lib/content/home.ts`
- [ ] **Final bay pricing** — `pricing_rules` (seeded: $30 off-peak / $40–50 peak per hour)
- [ ] **Tax rate confirmation** — `site_settings.booking_rules.tax_rate` (seeded 7%)
- [ ] **Booking rules review** — buffers, cutoffs, hold length, cancellation window

## Programs & pricing

- [ ] **Membership plans + prices** — `membership_plans`; create Stripe Prices and
      fill `stripe_price_id`; decide founding-member offer
- [ ] **League schedules, prices and capacities** — `leagues`
- [ ] **Lesson pricing & instructor profiles** — `programs`, `instructors`
- [ ] **Final menu with prices and allergens** — `menu_categories` / `menu_items`
      (seeded items are clearly plausible placeholders)

## Legal (requires counsel review)

- [ ] **Participation waiver text** — `waiver_templates` (placeholder present)
- [ ] **Privacy policy** — `/policies/privacy` page content
- [ ] **Terms of service** — `/policies/terms` page content
- [ ] **Gift card expiration policy vs. Indiana law** — `/policies/terms`

## Payments (Square)

- [ ] Sandbox env vars set in Vercel (`SQUARE_ACCESS_TOKEN`,
      `SQUARE_ENVIRONMENT=sandbox`) and `/api/admin/square-status` returns OK
- [ ] Webhook subscription created for `<site>/api/webhooks/square`
      (payment.created/updated, refund.created/updated) +
      `SQUARE_WEBHOOK_SIGNATURE_KEY` set
- [ ] Sandbox test booking end-to-end (pay with Square test card, booking
      flips to confirmed, order visible in Square Dashboard)
- [ ] Refund flow tested from admin and from the Square Dashboard
- [ ] Switch to production token + `SQUARE_ENVIRONMENT=production` at launch
- [ ] Small live charge + refund verified
- [ ] Membership billing decision: move subscriptions to Square Subscriptions
      or keep Stripe Billing (currently optional legacy path)

## Email

- [ ] Domain verified in Resend; SPF/DKIM/DMARC records added
- [ ] `EMAIL_FROM` and `STAFF_NOTIFICATIONS_EMAIL` set
- [ ] Send test of every template (booking confirmation, reminder, cancellation,
      opening list, gift card, membership, private-event notifications)

## Infrastructure

- [ ] Production domain connected on Vercel; `NEXT_PUBLIC_SITE_URL` updated
- [ ] `CRON_SECRET` set; cron jobs verified (hold expiry, reminders)
- [ ] Supabase production project: migrations applied, seed adapted, backups on
- [ ] First owner role granted (see ADMIN_GUIDE.md)
- [ ] Google Analytics 4 property + `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] Google Search Console verified; sitemap submitted
- [ ] Google Business Profile created/claimed
- [ ] Sentry DSN configured (optional but recommended)

## Quality gates before flipping business mode

- [ ] Accessibility review with keyboard + screen reader on booking flow
- [ ] Lighthouse pass on homepage, pricing, menu, booking (mobile)
- [ ] Test bookings: new customer, returning, reschedule, cancel inside/outside
      window, simultaneous booking attempt on same slot
- [ ] Parent registers a child (household + waiver flow)
- [ ] Staff trained on ADMIN_GUIDE.md flows (check-in, walk-in, blackout, refund)

## Opening sequence

1. Flip `business_mode` → `reservations_open` (Admin → Site Content)
2. Send "Reservations now open" email to the opening list (template ready in
   `emails/reservations-open.tsx`)
3. Open league registration statuses as seasons firm up
4. Flip to `fully_operational` on opening day 🎉
