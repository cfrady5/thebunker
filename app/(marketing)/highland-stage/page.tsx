import type { Metadata } from "next";
import Link from "next/link";
import { Guitar, HandHeart, MonitorPlay, PartyPopper, Users } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublishedEvents } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EventCard } from "@/components/marketing/event-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "The Highland Stage — Live Music & Community Nights",
  description:
    "The Highland Stage at The Bunker hosts live entertainment, watch parties, fundraisers and community programming in Linton, Indiana.",
  path: "/highland-stage",
});

export default async function HighlandStagePage() {
  const events = await getPublishedEvents();
  const stageEvents = events.filter((e) => e.category === "highland_stage");

  return (
    <>
      <section className="relative overflow-hidden bg-thistle py-16 text-cream md:py-24">
        <div className="container max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cream/70">
            More than golf
          </p>
          <h1 className="text-display-lg font-semibold">The Highland Stage</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
            A corner of The Bunker built for the community — live acoustic nights,
            watch parties, fundraisers and celebrations, all with the lounge and
            simulators just steps away.
          </p>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Guitar,
              title: "Live entertainment",
              body: "Local musicians and acoustic nights when scheduled — announced on the events calendar.",
            },
            {
              icon: MonitorPlay,
              title: "Watch parties",
              body: "The majors, big games and championship Sundays on the big screens.",
            },
            {
              icon: HandHeart,
              title: "Fundraisers",
              body: "A turnkey venue for schools, teams and causes that matter in Greene County.",
            },
            {
              icon: PartyPopper,
              title: "Seasonal events",
              body: "Holiday parties, themed nights and community celebrations all year.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border/40 bg-surface p-6">
              <item.icon aria-hidden className="h-7 w-7 text-thistle" />
              <h2 className="mt-3 font-serif text-lg font-semibold text-primary">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading
            eyebrow="On the calendar"
            title="Upcoming Stage Nights"
            description="Programming is scheduled event by event rather than on a fixed weekly schedule — check the events calendar for what's coming up."
          />
          <div className="mt-10">
            {stageEvents.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {stageEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-charcoal-muted">
                Stage programming will be announced on the{" "}
                <Link href="/events" className="font-medium text-primary underline underline-offset-2">
                  events calendar
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-lg border border-thistle/25 bg-thistle/5 p-8 text-center">
          <Users aria-hidden className="mx-auto h-8 w-8 text-thistle" />
          <h2 className="mt-3 font-serif text-2xl font-semibold text-primary">
            Want to perform or host?
          </h2>
          <p className="mt-3 leading-relaxed text-charcoal-muted">
            Musicians, organizers and community groups — the stage is for you.
            Tell us what you have in mind.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/contact?subject=Highland Stage">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
