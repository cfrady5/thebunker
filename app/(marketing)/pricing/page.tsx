import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getMembershipPlans } from "@/features/content/queries";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { formatCents, formatDuration } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Pricing — Simulator Bay Rates & Memberships",
  description:
    "Simple per-bay pricing for golf simulator sessions at The Bunker in Linton, Indiana — split it with up to six players. See hourly rates, membership plans and league pricing.",
  path: "/pricing",
});

export default async function PricingPage() {
  const settings = await getSiteSettings();
  const plans = await getMembershipPlans();
  const canBook = bookingIsOpen(settings.business_mode);

  return (
    <>
      <section className="container py-14 md:py-20">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, Per-Bay Pricing"
          description="You rent the bay, not a seat — bring up to six people and split it however you like. No memberships required to play."
        />

        {!canBook ? (
          <div className="mx-auto mt-8 max-w-2xl">
            <InlineAlert variant="info" title="Pre-opening pricing">
              These are our planned rates. Final pricing will be confirmed before
              reservations open in {settings.opening_label}.
            </InlineAlert>
          </div>
        ) : null}

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-primary">
                  Off-Peak
                </h2>
                <Badge variant="cream">Weekdays before 4pm</Badge>
              </div>
              <p className="mt-5 font-serif text-5xl font-semibold text-primary">
                $30
                <span className="ml-1 font-sans text-base font-normal text-muted-foreground">
                  / hour / bay
                </span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-charcoal-muted">
                <li>Up to 6 players included</li>
                <li>All courses and game modes</li>
                <li>Club rentals available</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-gold/50">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-primary">
                  Peak
                </h2>
                <Badge variant="gold">Evenings &amp; weekends</Badge>
              </div>
              <p className="mt-5 font-serif text-5xl font-semibold text-primary">
                $40–50
                <span className="ml-1 font-sans text-base font-normal text-muted-foreground">
                  / hour / bay
                </span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-charcoal-muted">
                <li>Up to 6 players included</li>
                <li>All courses and game modes</li>
                <li>Most popular times — book ahead</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sessions start at 30 minutes. A bay for four people for an hour works out
          to about the price of a large pizza each.
        </p>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href={canBook ? "/book" : "/opening-updates"}>
              {canBook ? "Book a Bay" : "Join the Opening List"}
            </Link>
          </Button>
        </div>
      </section>

      <section className="bg-surface py-14 md:py-20">
        <div className="container">
          <SectionHeading
            eyebrow="Memberships"
            title="Play More, Pay Less"
            description="Members get included bay time every month, longer booking windows and discounts on everything else."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-6 text-center">
                  <h3 className="font-serif text-xl font-semibold text-primary">
                    {plan.name}
                  </h3>
                  <p className="mt-3 font-serif text-3xl font-semibold text-primary">
                    {formatCents(plan.price_cents)}
                    <span className="font-sans text-sm font-normal text-muted-foreground">
                      /{plan.billing_interval}
                    </span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-charcoal-muted">
                    <li>{formatDuration(plan.included_minutes)} included</li>
                    <li>{plan.discount_percentage}% off extra hours</li>
                    <li>Book {plan.booking_window_days} days ahead</li>
                    {plan.household_eligible ? <li>Shared household benefits</li> : null}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            See full membership benefits and choose the plan that fits your game.{" "}
            <Link href="/memberships" className="font-medium text-primary underline underline-offset-2">
              Membership details →
            </Link>
          </p>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <SectionHeading eyebrow="Also good to know" title="Other Pricing" />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          {[
            {
              title: "Lessons",
              body: "Private lessons from $45–65 depending on format and length. Youth clinics priced per session series.",
              href: "/lessons",
              label: "Lesson details",
            },
            {
              title: "Leagues",
              body: "Season registration from $60 per player depending on league and format — includes weekly simulator time.",
              href: "/leagues",
              label: "League details",
            },
            {
              title: "Private events",
              body: "Custom quotes based on group size, bays and catering. Tell us about your event and we'll build a package.",
              href: "/private-events",
              label: "Plan an event",
            },
            {
              title: "Gift cards",
              body: "Digital gift cards from $10 to $500 — good for bay time, lessons and food.",
              href: "/gift-cards",
              label: "Gift cards",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-block text-sm font-semibold text-primary hover:text-gold-dark"
                >
                  {item.label} →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Cancellations made {settings.booking_rules.cancellation_window_hours}+ hours
          before your session are fully refundable.{" "}
          <Link href="/policies/cancellation" className="font-medium text-primary underline underline-offset-2">
            Read the cancellation policy
          </Link>
          .
        </p>
      </section>
    </>
  );
}
