import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Gift,
  Handshake,
  MonitorPlay,
  PartyPopper,
  Quote,
  Sparkles,
} from "lucide-react";
import type { EventRow, League, MenuItem, SiteSettings } from "@/types";
import { homeCopy } from "@/lib/content/home";
import { Reveal } from "@/components/motion/reveal";
import { EventCountdown } from "@/components/home/event-countdown";
import { WeatherWidget } from "@/components/home/weather-widget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

/* ---------- Simulator experience ---------- */

export function SimulatorSection({ settings }: { settings: SiteSettings }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 xl:px-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src="/gallery/putting-stroke.jpg"
              alt="A golfer mid-stroke on the practice green"
              width={1000}
              height={1000}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03] motion-reduce:hover:scale-100"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-primary-dark/50 via-transparent to-transparent"
            />
            <p className="absolute bottom-5 left-5 text-sm font-semibold uppercase tracking-[0.2em] text-cream">
              Tour-level ball tracking
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            The simulator experience
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-primary md:text-[46px]">
            Play Pebble Beach.
            <br />
            In January. In Linton.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-charcoal-muted">
            Every swing is measured — carry, spin, launch and path — and every
            round plays out on beautifully rendered championship courses. Bring
            your clubs or use ours; bring your foursome or your family.
          </p>
          <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-border/70 pt-8">
            <div>
              <dt className="text-xs uppercase tracking-widest text-charcoal-muted">
                Bays
              </dt>
              <dd className="mt-1 font-serif text-4xl font-semibold text-primary">
                {settings.simulator.bay_count}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-charcoal-muted">
                Per bay
              </dt>
              <dd className="mt-1 font-serif text-4xl font-semibold text-primary">
                {settings.simulator.max_players_per_bay}
                <span className="text-lg text-charcoal-muted"> players</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-charcoal-muted">
                Season
              </dt>
              <dd className="mt-1 font-serif text-4xl font-semibold text-primary">
                365<span className="text-lg text-charcoal-muted"> days</span>
              </dd>
            </div>
          </dl>
          <Link
            href="/simulators"
            className="group mt-9 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-dark"
          >
            <MonitorPlay aria-hidden className="h-4 w-4" />
            Explore the experience
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Food & drinks ---------- */

export function FoodDrinksSection({
  featuredFood,
  featuredDrink,
}: {
  featuredFood: MenuItem | null;
  featuredDrink: MenuItem | null;
}) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-28 xl:px-16">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            Food &amp; drinks
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-primary md:text-[46px]">
            The 19th Hole, Perfected.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-charcoal-muted">
            Shareables made for the whole bay, local drafts, and a lounge that
            makes staying for one more round the obvious call.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[
            { label: "From the kitchen", item: featuredFood },
            { label: "From the bar", item: featuredDrink },
          ].map(({ label, item }, i) =>
            item ? (
              <Reveal key={label} delay={i * 0.1}>
                <div className="group relative overflow-hidden rounded-xl bg-primary-dark p-8 md:p-10">
                  <div
                    aria-hidden
                    className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    {label}
                  </p>
                  <h3 className="mt-4 font-serif text-3xl font-semibold text-cream">
                    {item.name}
                  </h3>
                  <p className="mt-3 max-w-sm leading-relaxed text-cream/75">
                    {item.description}
                  </p>
                  <p className="mt-6 font-serif text-2xl text-gold">
                    {formatCents(item.price_cents)}
                  </p>
                </div>
              </Reveal>
            ) : null,
          )}
        </div>

        <Reveal className="mt-10">
          <Link
            href="/menu"
            className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-dark"
          >
            See the full menu
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Events & leagues ---------- */

export function EventsLeaguesSection({
  events,
  leagues,
}: {
  events: EventRow[];
  leagues: League[];
}) {
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now)
    .slice(0, 4);
  const featured = upcoming[0] ?? null;
  const rest = upcoming.slice(1);

  return (
    <section className="bg-primary-dark py-20 text-cream md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 xl:px-16">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
            What&apos;s happening
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight md:text-[46px]">
            Events, Leagues &amp; Nights Worth Circling.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          {featured ? (
            <Reveal className="lg:col-span-3">
              <Link
                href={`/events/${featured.slug}`}
                className="group block overflow-hidden rounded-xl border border-gold/25 bg-primary-light/30 p-8 backdrop-blur-sm transition-colors hover:border-gold/50 md:p-10"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Next up · {formatDateTime(featured.starts_at)}
                </p>
                <h3 className="mt-4 font-serif text-3xl font-semibold md:text-4xl">
                  {featured.title}
                </h3>
                <p className="mt-3 max-w-lg leading-relaxed text-cream/75">
                  {featured.excerpt}
                </p>
                <div className="mt-7">
                  <EventCountdown startsAtIso={featured.starts_at} />
                </div>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Event details
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </Reveal>
          ) : null}

          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="flex h-full flex-col">
              {rest.length > 0 ? (
                <ul className="space-y-4">
                  {rest.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.slug}`}
                        className="group flex items-baseline justify-between gap-4 border-b border-cream/10 pb-4 transition-colors hover:border-gold/40"
                      >
                        <span className="font-serif text-lg text-cream group-hover:text-gold">
                          {event.title}
                        </span>
                        <span className="shrink-0 text-sm text-cream/60">
                          {formatDateTime(event.starts_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Find your league
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {leagues.slice(0, 6).map((league) => (
                    <Link
                      key={league.id}
                      href={`/leagues/${league.slug}`}
                      className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/80 transition-colors hover:border-gold hover:text-gold"
                    >
                      {league.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/leagues"
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cream/80 transition-colors hover:text-gold"
                >
                  All leagues &amp; tournaments
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Private parties & corporate ---------- */

export function PrivatePartiesSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 xl:px-16">
        <Reveal>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            Private events
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-primary md:text-[46px]">
            Your Party. Our Bays.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-charcoal-muted">
            Birthdays that beat the arcade. Corporate outings that beat the
            conference room. Reserve a bay, a corner, or the whole clubhouse —
            we&apos;ll handle setup, food and the fun.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              { icon: PartyPopper, text: "Birthdays, celebrations and team nights" },
              { icon: Handshake, text: "Corporate outings with catering packages" },
              { icon: Sparkles, text: "Full-facility rentals for up to ~80 guests" },
            ].map((row) => (
              <li key={row.text} className="flex items-center gap-3 text-charcoal-muted">
                <row.icon aria-hidden className="h-5 w-5 shrink-0 text-gold-dark" />
                {row.text}
              </li>
            ))}
          </ul>
          <Link
            href="/private-events"
            className="mt-9 inline-flex h-[52px] items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold uppercase tracking-wider text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-light motion-reduce:hover:translate-y-0"
          >
            Plan an Event
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
              <Image
                src="/gallery/friends-on-course.jpg"
                alt="Friends enjoying a round together"
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.04] motion-reduce:hover:scale-100"
              />
            </div>
            <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-xl">
              <Image
                src="/gallery/balls-pile.jpg"
                alt="A heap of fresh golf balls"
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.04] motion-reduce:hover:scale-100"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Why The Bunker + weather ---------- */

export function WhyBunkerSection() {
  return (
    <section className="bg-primary py-20 text-cream md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 xl:px-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
              Why The Bunker
            </p>
            <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight md:text-[46px]">
              Golf, Without the Gatekeeping.
            </h2>
            <ul className="mt-8 space-y-6">
              {homeCopy.why.map((reason) => (
                <li key={reason.title}>
                  <h3 className="font-serif text-xl font-semibold text-gold">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-cream/75">
                    {reason.body}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <WeatherWidget />
            <div className="mt-6 rounded-lg border border-cream/15 p-6">
              <p className="font-serif text-lg font-semibold text-cream">
                Hole-in-One Wall
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">
                Every ace at The Bunker earns a permanent spot on the wall — and
                on this page. The first name goes up opening season. It could be
                yours.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Gift card promo ---------- */

export function GiftCardPromo() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20 xl:px-16">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 via-cream to-cream p-8 md:flex-row md:items-center md:p-10">
            <div className="flex items-start gap-4">
              <Gift aria-hidden className="mt-1 h-8 w-8 shrink-0 text-gold-dark" />
              <div>
                <h2 className="font-serif text-2xl font-semibold text-primary md:text-3xl">
                  Give the Gift of Golf
                </h2>
                <p className="mt-1.5 max-w-md text-charcoal-muted">
                  Digital gift cards from $10–$500, good for bay time, lessons
                  and the kitchen. Delivered by email in minutes.
                </p>
              </div>
            </div>
            <Link
              href="/gift-cards"
              className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-md bg-primary px-7 text-sm font-semibold uppercase tracking-wider text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-light motion-reduce:hover:translate-y-0"
            >
              Gift Cards
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Testimonials (renders only with real quotes) ---------- */

export function TestimonialsSection() {
  // Populated post-opening with real customer quotes — never invented.
  if (homeCopy.testimonials.length === 0) return null;

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 xl:px-16">
        <Reveal className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            From our guests
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-primary md:text-[46px]">
            Word Travels Fast in Linton.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {homeCopy.testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="h-full">
                <Quote aria-hidden className="h-6 w-6 text-gold" />
                <blockquote className="mt-4 font-serif text-xl leading-relaxed text-charcoal">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold uppercase tracking-wider text-charcoal-muted">
                  {t.name}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function FaqSection() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <Reveal className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            Good to know
          </p>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-primary md:text-[46px]">
            Questions, Answered.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible>
            {homeCopy.faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`home-faq-${i}`}>
                <AccordionTrigger className="font-serif text-lg">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px]">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-dark"
            >
              All questions →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
