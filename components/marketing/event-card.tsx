import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { EventRow } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  highland_stage: "Highland Stage",
  community: "Community",
  golf: "Golf",
  tournament: "Tournament",
  youth: "Youth",
  league: "League",
  watch_party: "Watch Party",
  fundraiser: "Fundraiser",
  seasonal: "Seasonal",
  private: "Private",
};

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="thistle">{CATEGORY_LABELS[event.category] ?? event.category}</Badge>
          <Badge variant={event.price_cents ? "gold" : "success"}>
            {event.price_cents ? formatCents(event.price_cents) : "Free"}
          </Badge>
        </div>
        <h3 className="font-serif text-xl font-semibold text-primary">{event.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-muted">
          {event.excerpt}
        </p>
        <dl className="mt-4 space-y-1.5 text-sm text-charcoal-muted">
          <div className="flex items-center gap-2">
            <CalendarDays aria-hidden className="h-4 w-4 text-gold-dark" />
            <span>{formatDateTime(event.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin aria-hidden className="h-4 w-4 text-gold-dark" />
            <span>{event.location}</span>
          </div>
        </dl>
        <Link
          href={`/events/${event.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-gold-dark"
        >
          Event details
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
