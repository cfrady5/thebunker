import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Trophy, Users } from "lucide-react";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo/metadata";
import { getLeagueBySlug, getLeagues } from "@/features/content/queries";
import { statusBadge } from "@/components/marketing/program-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { formatCents } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";

const DAY_NAMES = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const league = await getLeagueBySlug(slug);
  if (!league) return {};
  return buildMetadata({
    title: `${league.name} — Leagues at The Bunker`,
    description:
      league.description ??
      `${league.name} at The Bunker Indoor Golf in Linton, Indiana.`,
    path: `/leagues/${league.slug}`,
  });
}

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const league = await getLeagueBySlug(slug);
  if (!league) notFound();

  const schedule =
    league.day_of_week !== null && league.start_time
      ? `${DAY_NAMES[league.day_of_week]} at ${league.start_time.slice(0, 5)}`
      : "Schedule announced soon";

  const registrationOpen = league.status === "open";
  const collectingInterest =
    league.status === "interest" || league.status === "opening_soon";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Leagues", path: "/leagues" },
              { name: league.name, path: `/leagues/${league.slug}` },
            ]),
          ),
        }}
      />
      <section className="container max-w-5xl py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/leagues" className="hover:text-primary">
            Leagues
          </Link>{" "}
          / <span className="text-charcoal">{league.name}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-display-md font-semibold text-primary">{league.name}</h1>
            {league.season ? (
              <p className="mt-2 text-lg text-charcoal-muted">{league.season}</p>
            ) : null}
          </div>
          {statusBadge(league.status)}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-primary">Overview</h2>
              <p className="mt-3 leading-relaxed text-charcoal-muted">
                {league.description}
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold text-primary">Format</h2>
              <ul className="mt-3 space-y-2 text-charcoal-muted">
                <li className="flex items-center gap-2.5">
                  <CalendarDays aria-hidden className="h-5 w-5 text-gold-dark" />
                  {schedule}
                </li>
                <li className="flex items-center gap-2.5">
                  <Users aria-hidden className="h-5 w-5 text-gold-dark" />
                  {league.team_size === 1
                    ? "Individual play"
                    : `Teams of ${league.team_size}`}
                  {league.capacity ? ` · ${league.capacity} total spots` : ""}
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock aria-hidden className="h-5 w-5 text-gold-dark" />
                  Weekly simulator time included
                </li>
                <li className="flex items-center gap-2.5">
                  <Trophy aria-hidden className="h-5 w-5 text-gold-dark" />
                  Season standings with end-of-season prizes
                </li>
              </ul>
            </div>

            {league.rules ? (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-primary">Rules</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-charcoal-muted">
                  {league.rules}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-primary">
                  Good to know
                </h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-charcoal-muted">
                  <li>All skill levels are welcome unless noted — handicaps even the field.</li>
                  <li>Can&apos;t make a week? Make-up sessions can be scheduled in open bay time.</li>
                  <li>Detailed rules and scoring are shared with registered players before week one.</li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
                  Registration
                </p>
                <p className="mt-3 font-serif text-3xl font-semibold text-primary">
                  {league.price_cents > 0 ? formatCents(league.price_cents) : "TBD"}
                  {league.price_cents > 0 ? (
                    <span className="font-sans text-sm font-normal text-muted-foreground">
                      {" "}
                      per {league.team_size === 1 ? "player" : "team"}
                    </span>
                  ) : null}
                </p>
                {league.registration_closes_at ? (
                  <p className="mt-2 text-sm text-charcoal-muted">
                    Registration closes {formatDateTime(league.registration_closes_at)}
                  </p>
                ) : null}

                <div className="mt-5 space-y-3">
                  {registrationOpen ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/signup?league=${league.slug}`}>Register Now</Link>
                    </Button>
                  ) : collectingInterest ? (
                    <>
                      <InlineAlert variant="info">
                        Registration for this season isn&apos;t open yet. Contact us
                        and we&apos;ll let you know the moment it does.
                      </InlineAlert>
                      <Button asChild className="w-full" size="lg">
                        <Link href="/contact?subject=League interest">
                          Contact Us
                        </Link>
                      </Button>
                    </>
                  ) : league.status === "waitlist" || league.status === "full" ? (
                    <>
                      <InlineAlert variant="warning">
                        This league is currently full. Join the waitlist and
                        we&apos;ll contact you if a spot opens.
                      </InlineAlert>
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/contact?subject=League waitlist">
                          Join the Waitlist
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <InlineAlert variant="info">
                      This season is underway. Check back for the next one!
                    </InlineAlert>
                  )}
                </div>

                <p className="mt-5 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
                  Questions about format, skill level or team registration?{" "}
                  <Link href="/contact" className="font-medium text-primary underline underline-offset-2">
                    Contact us
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export async function generateStaticParams() {
  const leagues = await getLeagues();
  return leagues.map((l) => ({ slug: l.slug }));
}
