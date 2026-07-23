import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import type { League, Program } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";

const DAY_NAMES = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

export function statusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge variant="success">Registration open</Badge>;
    case "opening_soon":
      return <Badge variant="gold">Registration opening soon</Badge>;
    case "waitlist":
      return <Badge variant="warning">Waitlist</Badge>;
    case "full":
      return <Badge variant="outline">Full</Badge>;
    case "in_progress":
      return <Badge variant="thistle">Season in progress</Badge>;
    case "completed":
      return <Badge variant="outline">Season complete</Badge>;
    default:
      return <Badge variant="cream">Collecting interest</Badge>;
  }
}

export function LeagueCard({ league }: { league: League }) {
  const schedule =
    league.day_of_week !== null && league.start_time
      ? `${DAY_NAMES[league.day_of_week]} · ${league.start_time.slice(0, 5)}`
      : null;

  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold text-primary">{league.name}</h3>
          {statusBadge(league.status)}
        </div>
        <p className="flex-1 text-sm leading-relaxed text-charcoal-muted">
          {league.description}
        </p>
        <dl className="mt-4 space-y-1.5 text-sm text-charcoal-muted">
          {league.season ? (
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden className="h-4 w-4 text-gold-dark" />
              <span>
                {league.season}
                {schedule ? ` · ${schedule}` : ""}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Users aria-hidden className="h-4 w-4 text-gold-dark" />
            <span>
              {league.team_size === 1
                ? "Individual play"
                : `Teams of ${league.team_size}`}
              {league.price_cents > 0
                ? ` · ${formatCents(league.price_cents)} per ${league.team_size === 1 ? "player" : "team"}`
                : ""}
            </span>
          </div>
        </dl>
        <Link
          href={`/leagues/${league.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-gold-dark"
        >
          {league.status === "open" ? "Register" : "Learn more"}
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </CardContent>
    </Card>
  );
}

export function ProgramCard({ program }: { program: Program }) {
  const ages =
    program.age_min !== null && program.age_max !== null
      ? `Ages ${program.age_min}–${program.age_max}`
      : null;

  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold text-primary">{program.name}</h3>
          {statusBadge(program.status)}
        </div>
        <p className="flex-1 text-sm leading-relaxed text-charcoal-muted">
          {program.description}
        </p>
        <p className="mt-4 text-sm text-charcoal-muted">
          {[
            ages,
            program.duration_minutes ? `${program.duration_minutes} minutes` : null,
            program.price_cents > 0 ? formatCents(program.price_cents) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <Link
          href={`/lessons#${program.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-gold-dark"
        >
          Learn more
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
