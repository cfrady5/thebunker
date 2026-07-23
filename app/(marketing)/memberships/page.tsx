import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
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
  title: "Memberships — Included Bay Time, Priority Booking & Discounts",
  description:
    "Bunker memberships include monthly simulator time, earlier booking windows, discounts on extra hours and priority access to leagues and events in Linton, Indiana.",
  path: "/memberships",
});

export default async function MembershipsPage() {
  const settings = await getSiteSettings();
  const plans = await getMembershipPlans();
  const canBuy = bookingIsOpen(settings.business_mode);

  return (
    <>
      <section className="bg-primary-dark py-16 text-cream md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Memberships
          </p>
          <h1 className="text-display-lg font-semibold">
            Make The Bunker Your Home Course
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
            Included simulator time every month, first pick of tee times, and
            member pricing on everything from extra hours to league fees.
          </p>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        {!canBuy ? (
          <div className="mx-auto mb-10 max-w-2xl">
            <InlineAlert variant="info" title="Membership details coming soon">
              These are our planned plans and benefits. Final pricing — and a
              founding-member offer for the opening list — will be announced before
              we open in {settings.opening_label}.
            </InlineAlert>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => (
            <Card
              key={plan.id}
              className={i === 1 ? "relative border-gold/60 shadow-card-hover" : ""}
            >
              <CardContent className="flex h-full flex-col p-7">
                {i === 1 ? (
                  <Badge variant="gold" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Most anticipated
                  </Badge>
                ) : null}
                <h2 className="font-serif text-2xl font-semibold text-primary">
                  {plan.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">
                  {plan.description}
                </p>
                <p className="mt-5 font-serif text-4xl font-semibold text-primary">
                  {formatCents(plan.price_cents)}
                  <span className="font-sans text-sm font-normal text-muted-foreground">
                    /{plan.billing_interval}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-charcoal-muted">
                  {[
                    `${formatDuration(plan.included_minutes)} of bay time monthly`,
                    `Book up to ${plan.booking_window_days} days ahead`,
                    `${plan.discount_percentage}% off additional hours`,
                    "League registration discounts",
                    "Priority event access",
                    ...(plan.household_eligible ? ["Shared household benefits"] : []),
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild={canBuy}
                  disabled={!canBuy}
                  className="mt-7 w-full"
                  variant={i === 1 ? "gold" : "default"}
                >
                  {canBuy ? (
                    <Link href={`/signup?plan=${plan.slug}`}>Choose {plan.name}</Link>
                  ) : (
                    <span>Available at opening</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <SectionHeading
            title="Want first access?"
            description="Opening-list members get early notice when memberships go on sale — including any founding-member pricing."
          />
          <div className="mt-6">
            <Button asChild size="lg">
              <Link href="/#opening-list">Join the Opening List</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-surface py-14 md:py-20">
        <div className="container max-w-3xl">
          <SectionHeading eyebrow="The fine print" title="How Memberships Work" />
          <dl className="mt-10 space-y-6 text-charcoal-muted">
            {[
              {
                q: "Billing",
                a: "Memberships bill monthly (or annually at a discount) through secure card payment, and you can manage or cancel your plan anytime from your account.",
              },
              {
                q: "Included time",
                a: "Included minutes refresh each billing period and apply automatically at checkout when you book. Unused time follows your plan's rollover rule.",
              },
              {
                q: "Household plans",
                a: "Family and Business plans share included time across household or team members you add to your account.",
              },
              {
                q: "Pausing",
                a: "Traveling for a season? Plans can be paused rather than cancelled — your rate and benefits are waiting when you return.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-serif text-lg font-semibold text-primary">{item.q}</dt>
                <dd className="mt-1.5 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
