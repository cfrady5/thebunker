import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getCurrentUser } from "@/lib/permissions";
import { BookingFlow } from "@/components/booking/booking-flow";
import { SectionHeading } from "@/components/marketing/section-heading";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata: Metadata = buildMetadata({
  title: "Book a Bay",
  description:
    "Reserve a golf simulator bay at The Bunker in Linton, Indiana. Pick your date, time and session length — up to six players per bay.",
  path: "/book",
});

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [settings, user, params] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    searchParams,
  ]);

  if (!bookingIsOpen(settings.business_mode)) {
    return (
      <section className="container max-w-2xl py-16 md:py-24">
        <SectionHeading
          eyebrow="Reservations"
          title="Reservations Open Soon"
          description={
            settings.business_mode === "temporarily_closed"
              ? "We're temporarily closed and not accepting reservations right now. Check back soon or follow our updates."
              : `Bay reservations open closer to our ${settings.opening_label} opening. Join the opening list and we'll email you the moment booking goes live — opening-list members get first pick of tee times.`
          }
        />
        <div className="mt-10 rounded-lg border border-border/40 bg-surface p-6 md:p-8">
          <NewsletterForm />
        </div>
      </section>
    );
  }

  return (
    <section className="container py-10 md:py-16">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="font-serif text-display-sm font-semibold text-primary">
          Book a Bay
        </h1>
        <p className="mt-1 text-charcoal-muted">
          Reserve your simulator time in a few quick steps.
        </p>
        {params.cancelled ? (
          <div className="mt-4">
            <InlineAlert variant="info" title="Payment cancelled">
              No worries — your card wasn&apos;t charged and no reservation was made.
              Pick up where you left off below.
            </InlineAlert>
          </div>
        ) : null}
      </div>
      <BookingFlow
        signedIn={Boolean(user)}
        userEmail={user?.profile.email ?? null}
        taxRate={settings.booking_rules.tax_rate}
        cancellationHours={settings.booking_rules.cancellation_window_hours}
        maxPlayers={settings.simulator.max_players_per_bay}
      />
    </section>
  );
}
