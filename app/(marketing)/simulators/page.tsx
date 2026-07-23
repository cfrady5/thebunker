import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  CloudSun,
  Gamepad2,
  LandPlot,
  MonitorPlay,
  Ruler,
  Users,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TartanDivider } from "@/components/brand/tartan-divider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = buildMetadata({
  title: "The Simulator Experience — Golf Simulators in Linton, Indiana",
  description:
    "State-of-the-art golf simulator bays with realistic ball tracking, world-famous courses, practice ranges and games for all ages at The Bunker in Linton, Indiana.",
  path: "/simulators",
});

const features = [
  {
    icon: Ruler,
    title: "Realistic ball and club tracking",
    body: "Every swing is measured — carry, spin, launch and path — so the ball flies on screen the way it would outside.",
  },
  {
    icon: LandPlot,
    title: "World-famous courses",
    body: "Play full rounds on courses you've watched on TV, from links classics to modern championship layouts.",
  },
  {
    icon: MonitorPlay,
    title: "Practice modes that teach",
    body: "Driving range, approach practice and putting modes with instant feedback on every shot.",
  },
  {
    icon: Gamepad2,
    title: "Games for everyone",
    body: "Closest-to-the-pin, long drive and target games that beginners, kids and non-golfers genuinely enjoy.",
  },
  {
    icon: Users,
    title: "Built for groups",
    body: "Up to six players per bay with comfortable seating, so nobody stands around waiting.",
  },
  {
    icon: CloudSun,
    title: "No weather, no offseason",
    body: "72 and sunny in every bay, all year — swing in January like it's June.",
  },
];

export default async function SimulatorsPage() {
  const settings = await getSiteSettings();
  const canBook = bookingIsOpen(settings.business_mode);

  return (
    <>
      <section className="bg-primary-dark py-16 text-cream md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            The simulator experience
          </p>
          <h1 className="text-display-lg font-semibold">
            Real Golf. Indoors. All Year.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
            Our simulator bays combine precise ball tracking with beautifully
            rendered courses — a true round of golf, minus the weather, the wait
            and the intimidation factor.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="gold">
              <Link href={canBook ? "/book" : "/opening-updates"}>
                {canBook ? "Book a Bay" : "Join the Opening List"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <f.icon aria-hidden className="h-7 w-7 text-gold-dark" />
                <h2 className="mt-4 font-serif text-xl font-semibold text-primary">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <TartanDivider />

      <section className="bg-surface py-16 md:py-24">
        <div className="container grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="The details"
              title="What to Expect in Your Bay"
            />
            <dl className="mt-8 space-y-5 text-charcoal-muted">
              <div>
                <dt className="font-semibold text-charcoal">Simulator bays</dt>
                <dd className="mt-1">
                  {settings.simulator.bay_count} spacious bays, each with lounge
                  seating and its own hitting area.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal">Players per bay</dt>
                <dd className="mt-1">
                  Up to {settings.simulator.max_players_per_bay} players — sessions are
                  priced per bay, not per person.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal">Clubs</dt>
                <dd className="mt-1">
                  {settings.simulator.club_rentals_available
                    ? "Bring your own or use our rental sets, including left-handed and junior options."
                    : "Bring your own clubs."}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal">Technology</dt>
                <dd className="mt-1">
                  {settings.simulator.brand
                    ? `Powered by ${settings.simulator.brand}.`
                    : "We're finalizing our simulator technology partner — details will be announced before opening."}
                </dd>
              </div>
            </dl>
          </div>
          <div className="space-y-5">
            <Card className="border-gold/40 bg-gold/5">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold text-primary">
                  First time? We&apos;ll help.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  Our team walks every new group through the setup: how the screen
                  works, how to pick a game and how to keep it fun for mixed skill
                  levels. Most first-timers are hitting shots within five minutes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Accessibility aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-primary">
                      Accessibility
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                      {settings.simulator.accessibility_notes ??
                        "Accessibility details will be published before opening."}{" "}
                      If you have specific needs, <Link href="/contact" className="font-medium text-primary underline underline-offset-2">contact us</Link> and
                      we&apos;ll make it work.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold text-primary">
                  How long should we book?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  For most groups, one hour works well for practice or a short
                  round. Foursomes playing a full 18 usually book 3–4 hours.
                  Larger groups may prefer 90–120 minutes for games and practice.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
