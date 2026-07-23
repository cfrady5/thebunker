import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = buildMetadata({
  title: "Cancellation Policy",
  description:
    "Cancellation, refund and rescheduling policy for reservations, leagues, lessons and programs at The Bunker Indoor Golf.",
  path: "/policies/cancellation",
});

export default async function CancellationPolicyPage() {
  const settings = await getSiteSettings();
  const hours = settings.booking_rules.cancellation_window_hours;

  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-display-md font-semibold text-primary">Cancellation Policy</h1>
      <div className="prose-policies mt-4">
        <p>
          We keep this simple: plans change, and we&apos;d rather you come back
          another day than feel penalized.
        </p>

        <h2>Simulator reservations</h2>
        <ul>
          <li>
            <strong>{hours}+ hours before your session:</strong> cancel for a full
            refund to your original payment method, or reschedule free.
          </li>
          <li>
            <strong>Inside {hours} hours:</strong> you can reschedule up to 2 hours
            before your start time, or we&apos;ll convert your payment to account
            credit good for a future visit.
          </li>
          <li>
            <strong>No-shows:</strong> sessions not cancelled or rescheduled are
            charged in full. If something unavoidable happened, contact us — we&apos;re
            reasonable people.
          </li>
        </ul>

        <h2>Lessons and programs</h2>
        <ul>
          <li>Private lessons follow the same {hours}-hour window as reservations.</li>
          <li>
            Multi-week programs (clinics, junior league) are refundable in full until
            one week before the first session, and prorated as credit after that.
          </li>
        </ul>

        <h2>Leagues and tournaments</h2>
        <ul>
          <li>
            League registration is refundable in full until registration closes.
            After that, refunds are offered if we can fill your spot from the
            waitlist.
          </li>
          <li>Tournament entries are refundable until the posted registration deadline.</li>
        </ul>

        <h2>Events and private rentals</h2>
        <ul>
          <li>Ticketed event refund terms are listed on each event page.</li>
          <li>
            Private event deposits and cancellation terms are included in your event
            agreement.
          </li>
        </ul>

        <h2>Weather and facility closures</h2>
        <p>
          If we ever need to close (severe weather, power outage, equipment issues),
          affected reservations are fully refunded or rescheduled — your choice.
        </p>
      </div>
    </section>
  );
}
