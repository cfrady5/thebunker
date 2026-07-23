import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Accessibility,
  CalendarDays,
  CalendarPlus,
  MapPin,
  UtensilsCrossed,
} from "lucide-react";
import { buildMetadata, breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/metadata";
import { getEventBySlug, getPublishedEvents } from "@/features/content/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateLong, formatTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return buildMetadata({
    title: `${event.title} — Events at The Bunker`,
    description: event.excerpt ?? `${event.title} at The Bunker in Linton, Indiana.`,
    path: `/events/${event.slug}`,
  });
}

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const googleCalUrl = new URL("https://calendar.google.com/calendar/render");
  googleCalUrl.searchParams.set("action", "TEMPLATE");
  googleCalUrl.searchParams.set("text", `${event.title} — The Bunker`);
  googleCalUrl.searchParams.set("details", event.excerpt ?? "");
  googleCalUrl.searchParams.set("location", event.location);
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  googleCalUrl.searchParams.set(
    "dates",
    `${fmt(event.starts_at)}/${fmt(event.ends_at ?? event.starts_at)}`,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            eventJsonLd({
              name: event.title,
              description: event.excerpt ?? event.title,
              startDate: event.starts_at,
              endDate: event.ends_at,
              slug: event.slug,
              free: !event.price_cents,
            }),
            breadcrumbJsonLd([
              { name: "Events", path: "/events" },
              { name: event.title, path: `/events/${event.slug}` },
            ]),
          ]),
        }}
      />
      <section className="container max-w-5xl py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/events" className="hover:text-primary">
            Events
          </Link>{" "}
          / <span className="text-charcoal">{event.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="thistle">{event.category.replace(/_/g, " ")}</Badge>
          <Badge variant={event.price_cents ? "gold" : "success"}>
            {event.price_cents ? formatCents(event.price_cents) : "Free to attend"}
          </Badge>
        </div>
        <h1 className="mt-4 text-display-md font-semibold text-primary">{event.title}</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line text-lg leading-relaxed text-charcoal-muted">
              {event.description ?? event.excerpt}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-surface p-4">
                <UtensilsCrossed aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div className="text-sm">
                  <p className="font-semibold text-charcoal">Food &amp; drinks</p>
                  <p className="mt-1 text-charcoal-muted">
                    The lounge menu is available during all public events.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-surface p-4">
                <Accessibility aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div className="text-sm">
                  <p className="font-semibold text-charcoal">Accessibility</p>
                  <p className="mt-1 text-charcoal-muted">
                    The facility is step-free.{" "}
                    <Link href="/accessibility" className="font-medium text-primary underline underline-offset-2">
                      Accessibility details
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <CalendarDays aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                  <div className="text-sm">
                    <p className="font-semibold text-charcoal">
                      {formatDateLong(event.starts_at)}
                    </p>
                    <p className="text-charcoal-muted">
                      {formatTime(event.starts_at)}
                      {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                  <p className="text-sm text-charcoal-muted">{event.location}</p>
                </div>

                {event.registration_required ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/signup?event=${event.slug}`}>Register</Link>
                  </Button>
                ) : (
                  <p className="rounded-md bg-success/10 p-3 text-center text-sm font-medium text-success">
                    No registration needed — just show up!
                  </p>
                )}

                <Button asChild variant="outline" className="w-full">
                  <a href={googleCalUrl.toString()} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus aria-hidden /> Add to Google Calendar
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({ slug: e.slug }));
}
