import Link from "next/link";
import {
  CalendarCheck,
  Cake,
  Church,
  Flag,
  GraduationCap,
  Guitar,
  HandHeart,
  Handshake,
  MapPin,
  Medal,
  MonitorPlay,
  PartyPopper,
  Sofa,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import {
  getLeagues,
  getMenu,
  getMembershipPlans,
  getOpeningUpdates,
  getPublishedEvents,
} from "@/features/content/queries";
import { buildMetadata, localBusinessJsonLd } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { TartanDivider } from "@/components/brand/tartan-divider";
import { SectionHeading } from "@/components/marketing/section-heading";
import { LeagueCard } from "@/components/marketing/program-card";
import { EventCard } from "@/components/marketing/event-card";
import { MenuItemCard } from "@/components/marketing/menu-item-card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { formatCents, formatDuration } from "@/lib/utils";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = buildMetadata({
  title: "Indoor Golf in Linton, Indiana — Opening Fall 2026",
  description:
    "The Bunker brings state-of-the-art golf simulators, lessons, leagues, youth programs and community events to Linton, Indiana. Join the opening list.",
  path: "/",
});

const valueProps = [
  {
    icon: Flag,
    title: "Play",
    body: "Practice your swing, play world-famous courses or enjoy a casual round with friends.",
  },
  {
    icon: GraduationCap,
    title: "Learn",
    body: "Build confidence through private lessons, youth clinics and beginner-friendly instruction.",
  },
  {
    icon: Trophy,
    title: "Compete",
    body: "Join leagues, tournaments and team events designed for different ages and abilities.",
  },
  {
    icon: Sofa,
    title: "Connect",
    body: "Relax, grab a snack and spend time with family, friends and the Linton community.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Reserve a simulator bay",
    body: "Pick a date, time and session length online — your bay is waiting when you arrive.",
  },
  {
    step: "2",
    title: "Bring your clubs — or don't",
    body: "Use your own set or grab rental clubs at the front desk. Left-handed sets included.",
  },
  {
    step: "3",
    title: "Pick a course or practice mode",
    body: "Warm up on the range, play a famous course, or try closest-to-the-pin games with the group.",
  },
  {
    step: "4",
    title: "Play at your own pace",
    body: "Swing, snack, sip and settle in. Our team is nearby if you ever need a hand.",
  },
];

const privateEventTypes = [
  { icon: Cake, label: "Birthdays" },
  { icon: Handshake, label: "Business outings" },
  { icon: Church, label: "Church groups" },
  { icon: Users, label: "Team building" },
  { icon: HandHeart, label: "Fundraisers" },
  { icon: Medal, label: "Private tournaments" },
];

const timeline = [
  { label: "Construction begins", status: "done" },
  { label: "Simulator installation", status: "upcoming" },
  { label: "League registration opens", status: "upcoming" },
  { label: "Membership sales open", status: "upcoming" },
  { label: "Reservations open", status: "upcoming" },
  { label: "Grand opening", status: "upcoming" },
];

export default async function HomePage() {
  const [settings, leagues, events, menu, plans, updates] = await Promise.all([
    getSiteSettings(),
    getLeagues(),
    getPublishedEvents(),
    getMenu(),
    getMembershipPlans(),
    getOpeningUpdates(),
  ]);

  const canBook = bookingIsOpen(settings.business_mode);
  const featuredLeagues = leagues.slice(0, 6);
  const featuredEvents = events.slice(0, 3);
  const featuredMenuItems = menu.items.filter((i) => i.featured).slice(0, 4);
  const latestUpdate = updates[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            localBusinessJsonLd({
              phone: settings.facility.phone,
              address_line1: settings.facility.address_line1,
              postal_code: settings.facility.postal_code,
            }),
          ),
        }}
      />

      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden bg-primary-dark text-cream">
        <div
          aria-hidden
          className="tartan-band absolute inset-x-0 top-0 h-3 opacity-90"
        />
        <div className="container grid items-center gap-10 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {settings.hero.eyebrow}
            </p>
            <h1 className="text-display-xl font-semibold text-cream">
              {settings.hero.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85 md:text-xl">
              {settings.hero.subheadline}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold">
                <Link href={canBook ? "/book" : "#opening-list"}>
                  {canBook ? "Book a Bay" : "Join the Opening List"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline-cream">
                <Link href="/simulators">Explore The Bunker</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-cream/60">
              {canBook
                ? "Reservations are open — see you on the tee."
                : `Reservations open closer to our ${settings.opening_label} opening.`}
            </p>
          </div>
          <div className="hidden justify-center lg:col-span-5 lg:flex">
            <Logo variant="full" width={280} height={327} priority className="drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* SECTION 2 — VALUE PROPS */}
      <section className="container py-16 md:py-24">
        <SectionHeading
          eyebrow="A year-round place to"
          title="Play. Learn. Compete. Connect."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop) => (
            <Card key={prop.title} className="text-center transition-shadow hover:shadow-card-hover">
              <CardContent className="p-7">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
                  <prop.icon aria-hidden className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-primary">
                  {prop.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-charcoal-muted">
                  {prop.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <TartanDivider />

      {/* SECTION 3 — HOW INDOOR GOLF WORKS */}
      <section className="bg-surface py-16 md:py-24">
        <div className="container">
          <SectionHeading
            eyebrow="New to simulators?"
            title="How Indoor Golf Works"
            description="No tee times at dawn, no rain delays, no pressure. Here's what a visit looks like."
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <li key={item.step} className="relative rounded-lg border border-border/40 bg-background p-6">
                <span
                  aria-hidden
                  className="font-serif text-5xl font-semibold text-gold/40"
                >
                  {item.step}
                </span>
                <h3 className="mt-3 font-serif text-lg font-semibold text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-gold/30 bg-gold/5 p-6 text-center">
            <p className="font-serif text-lg font-semibold text-primary">
              First time? We&apos;ll help.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
              Never used a golf simulator? No problem. Our team will help you get
              started, select a game mode and understand the system before your
              session begins.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — SIMULATOR EXPERIENCE */}
      <section className="container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="The simulator experience"
            title="Real Courses. Real Data. Real Fun."
          />
          <ul className="mt-8 space-y-4">
            {[
              "Accurate ball and club tracking on every swing",
              "Practice ranges and skills challenges",
              "Full rounds on world-famous courses",
              `Multiplayer play for up to ${settings.simulator.max_players_per_bay} per bay`,
              "Casual games that beginners and kids love",
              "Instant feedback to help you improve",
              "Comfortable, climate-controlled bays — in every season",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-charcoal-muted">
                <MonitorPlay aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/simulators">See the Simulator Experience</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-primary p-8 text-cream shadow-card">
          <h3 className="font-serif text-2xl font-semibold">At a glance</h3>
          <dl className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gold">
                Simulator bays
              </dt>
              <dd className="mt-1 font-serif text-4xl font-semibold">
                {settings.simulator.bay_count}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gold">
                Players per bay
              </dt>
              <dd className="mt-1 font-serif text-4xl font-semibold">
                Up to {settings.simulator.max_players_per_bay}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gold">
                Club rentals
              </dt>
              <dd className="mt-1 text-lg">
                {settings.simulator.club_rentals_available ? "Available" : "Bring your own"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-gold">
                Left-handed
              </dt>
              <dd className="mt-1 text-lg">
                {settings.simulator.left_handed_support ? "Fully supported" : "—"}
              </dd>
            </div>
          </dl>
          {settings.simulator.accessibility_notes ? (
            <p className="mt-6 border-t border-cream/15 pt-4 text-sm text-cream/75">
              {settings.simulator.accessibility_notes}
            </p>
          ) : null}
          {settings.simulator.brand ? (
            <p className="mt-2 text-sm text-cream/75">
              Powered by {settings.simulator.brand}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-cream/60">
              Simulator technology partner announced soon.
            </p>
          )}
        </div>
      </section>

      <TartanDivider />

      {/* SECTION 5 — PROGRAMS */}
      <section className="bg-surface py-16 md:py-24">
        <div className="container">
          <SectionHeading
            eyebrow="Leagues & programs"
            title="Find Your League"
            description="Whatever your age, schedule or handicap, there's a seat at The Bunker with your name on it."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/leagues">See All Leagues &amp; Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — COMMUNITY & HIGHLAND STAGE */}
      <section className="container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
        <div className="order-2 rounded-lg bg-thistle/5 p-8 lg:order-1">
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Guitar, label: "Live entertainment" },
              { icon: PartyPopper, label: "Special event nights" },
              { icon: Users, label: "Community programming" },
              { icon: HandHeart, label: "Fundraisers" },
              { icon: MonitorPlay, label: "Watch parties" },
              { icon: CalendarCheck, label: "Seasonal events" },
            ].map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-2 rounded-full border border-thistle/25 bg-surface px-4 py-2 text-sm font-medium text-thistle"
              >
                <tag.icon aria-hidden className="h-4 w-4" />
                {tag.label}
              </span>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow="More than golf"
            title="Community Nights on the Highland Stage"
            description="The Bunker is built to bring people together. When the calendar fills in, you'll find live music nights, watch parties, fundraisers and seasonal celebrations — all under one roof."
          />
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/highland-stage">About the Highland Stage</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 7 — MENU PREVIEW */}
      <section className="bg-primary-dark py-16 text-cream md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              Food &amp; drinks
            </p>
            <h2 className="text-display-md font-semibold text-cream">
              Food, Drinks and a Place to Settle In
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-cream/80">
              Light bites, cold drinks and an easy place to unwind between rounds.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredMenuItems.map((item) => (
              <div key={item.id} className="rounded-lg bg-surface p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    {item.name}
                  </h3>
                  <span className="shrink-0 font-semibold text-charcoal">
                    {formatCents(item.price_cents)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="gold">
              <Link href="/menu">View Full Menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 8 — MEMBERSHIP PREVIEW */}
      <section className="container py-16 md:py-24">
        <SectionHeading
          eyebrow="Memberships"
          title="Make The Bunker Your Home Course"
          description="Members get included simulator time each month, earlier booking windows, discounts on extra hours and priority access to leagues and events."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col text-center">
              <CardContent className="flex flex-1 flex-col p-6">
                <h3 className="font-serif text-xl font-semibold text-primary">{plan.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-muted">
                  {plan.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-gold-dark">
                  {formatDuration(plan.included_minutes)} included monthly
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Final membership pricing will be announced before opening.
        </p>
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/memberships">Membership Details</Link>
          </Button>
        </div>
      </section>

      <TartanDivider />

      {/* SECTION 9 — PRIVATE EVENTS */}
      <section className="bg-surface py-16 md:py-24">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Private events"
              title="Bring Your Group Inside The Bunker"
              description="Reserve a bay — or the whole place — for birthdays, business outings, church groups, team-building and fundraisers. We'll handle the details so you can enjoy the party."
            />
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/private-events">Plan an Event</Link>
              </Button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {privateEventTypes.map((type) => (
              <li
                key={type.label}
                className="flex flex-col items-center gap-2 rounded-lg border border-border/40 bg-background p-5 text-center"
              >
                <type.icon aria-hidden className="h-6 w-6 text-gold-dark" />
                <span className="text-sm font-medium text-charcoal">{type.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 10 — OPENING UPDATES */}
      <section className="container py-16 md:py-24">
        <SectionHeading
          eyebrow="The road to opening"
          title="Follow the Build"
          description={`Track our progress from first walls to first tee shots — opening ${settings.opening_label}.`}
        />
        <ol className="mx-auto mt-12 flex max-w-3xl flex-col gap-0">
          {timeline.map((item, i) => (
            <li key={item.label} className="relative flex gap-4 pb-8 last:pb-0">
              {i < timeline.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[11px] top-7 h-full w-0.5 bg-border/60"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  item.status === "done"
                    ? "border-success bg-success"
                    : "border-border bg-surface"
                }`}
              >
                {item.status === "done" ? (
                  <span className="h-2 w-2 rounded-full bg-cream" />
                ) : null}
              </span>
              <div>
                <p className="font-medium text-charcoal">{item.label}</p>
                {item.status === "done" ? (
                  <Badge variant="success" className="mt-1">
                    In progress
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Coming up</p>
                )}
              </div>
            </li>
          ))}
        </ol>
        {latestUpdate ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-border/40 bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
              Latest update
              {latestUpdate.published_at
                ? ` · ${formatFacility(latestUpdate.published_at, "MMMM d, yyyy")}`
                : ""}
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-primary">
              {latestUpdate.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
              {latestUpdate.excerpt}
            </p>
            <Link
              href={`/opening-updates`}
              className="mt-4 inline-block text-sm font-semibold text-primary hover:text-gold-dark"
            >
              Read all updates →
            </Link>
          </div>
        ) : null}
      </section>

      {/* SECTION 11 — EMAIL SIGNUP */}
      <section id="opening-list" className="bg-primary py-16 text-cream md:py-24">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              The opening list
            </p>
            <h2 className="text-display-md font-semibold text-cream">
              Be First to Tee It Up.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-cream/80">
              Join the opening list for first access to league registration,
              memberships and bay reservations — plus construction updates along
              the way.
            </p>
          </div>
          <div className="rounded-lg bg-surface p-6 text-foreground shadow-card md:p-8">
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* SECTION 12 — LOCATION */}
      <section className="container py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Location"
              title="Meet You at The Bunker"
            />
            <dl className="mt-8 space-y-4 text-charcoal-muted">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <dt className="font-semibold text-charcoal">Address</dt>
                  <dd>
                    {settings.facility.address_line1 ?? "Exact address announced soon"}
                    <br />
                    {settings.facility.city}, {settings.facility.state}
                    {settings.facility.postal_code ? ` ${settings.facility.postal_code}` : ""}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <dt className="font-semibold text-charcoal">Hours</dt>
                  <dd>Posted when we open — {settings.opening_label}.</dd>
                </div>
              </div>
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">
              Free parking on site. Easy access from Highway 54 and downtown Linton.
            </p>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-border/40 bg-surface-muted">
            <div className="text-center">
              <MapPin aria-hidden className="mx-auto h-10 w-10 text-primary/40" />
              <p className="mt-3 font-serif text-lg font-semibold text-primary">
                Linton, Indiana
              </p>
              <p className="text-sm text-muted-foreground">
                Map appears when our address is finalized
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
