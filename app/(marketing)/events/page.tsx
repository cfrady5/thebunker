import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedEvents } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EventCard } from "@/components/marketing/event-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "Events — What's Happening at The Bunker",
  description:
    "Community nights, Highland Stage entertainment, tournaments, watch parties and seasonal events at The Bunker Indoor Golf in Linton, Indiana.",
  path: "/events",
});

export default async function EventsPage() {
  const events = await getPublishedEvents();
  const now = Date.now();
  const upcoming = events.filter(
    (e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now,
  );
  const past = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() < now);

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="Events"
        title="What's Happening at The Bunker"
        description="From live music on the Highland Stage to demo weekends and fundraisers — there's always a reason to stop in."
      />

      <div className="mt-12">
        {upcoming.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events just yet"
            description="New events are announced to the opening list first — join and you won't miss a thing."
            action={
              <Button asChild>
                <Link href="/#opening-list">Join the Opening List</Link>
              </Button>
            }
          />
        )}
      </div>

      {past.length > 0 ? (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-semibold text-primary">Past events</h2>
          <div className="mt-6 grid gap-5 opacity-70 md:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
