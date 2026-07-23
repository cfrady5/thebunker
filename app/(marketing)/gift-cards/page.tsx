import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Mail, QrCode, Wallet } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = buildMetadata({
  title: "Gift Cards — Give the Gift of Golf",
  description:
    "Digital gift cards for The Bunker Indoor Golf in Linton, Indiana — good for simulator time, lessons, leagues and food. Delivered by email, any amount from $10.",
  path: "/gift-cards",
});

export default async function GiftCardsPage() {
  const settings = await getSiteSettings();
  const available = bookingIsOpen(settings.business_mode);

  return (
    <section className="container py-14 md:py-20">
      <SectionHeading
        eyebrow="Gift cards"
        title="Give the Gift of Golf"
        description="A digital gift card works for everything at The Bunker — bay time, lessons, league fees, snacks and drinks."
      />

      <div className="mx-auto mt-12 grid max-w-4xl items-center gap-10 lg:grid-cols-2">
        {/* Gift card visual */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-2xl bg-primary-dark p-7 text-cream shadow-card-hover">
            <div className="flex items-start justify-between">
              <Logo variant="cream" width={56} height={65} />
              <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold">
                GIFT CARD
              </span>
            </div>
            <p className="mt-8 font-serif text-3xl font-semibold">The Bunker</p>
            <p className="text-sm text-cream/70">Indoor Golf · Linton, Indiana</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-cream/60">Amount</p>
                <p className="font-serif text-2xl font-semibold text-gold">$10–$500</p>
              </div>
              <QrCode aria-hidden className="h-10 w-10 text-cream/40" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {[
            {
              icon: Gift,
              title: "Any amount, $10–$500",
              body: "Choose a preset amount or set your own — perfect for stocking stuffers or the whole foursome.",
            },
            {
              icon: Mail,
              title: "Delivered by email",
              body: "Send instantly or schedule delivery for the big day, with your personal message included.",
            },
            {
              icon: Wallet,
              title: "Use it a little at a time",
              body: "Balances carry forward — spend it across visits on bay time, lessons or lunch.",
            },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="flex items-start gap-4 p-5">
                <f.icon aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-gold-dark" />
                <div>
                  <h2 className="font-serif text-lg font-semibold text-primary">{f.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">{f.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {available ? (
            <Button asChild size="lg" className="w-full">
              <Link href="/signup?intent=gift-card">Buy a Gift Card</Link>
            </Button>
          ) : (
            <InlineAlert variant="info" title="Available at opening">
              Gift card sales open alongside reservations, before our{" "}
              {settings.opening_label} opening — in plenty of time for the holidays.
              Join the{" "}
              <Link href="/#opening-list" className="font-medium text-primary underline underline-offset-2">
                opening list
              </Link>{" "}
              to be notified.
            </InlineAlert>
          )}
        </div>
      </div>
    </section>
  );
}
