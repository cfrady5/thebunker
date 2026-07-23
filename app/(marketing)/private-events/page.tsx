import type { Metadata } from "next";
import {
  Cake,
  Church,
  HandHeart,
  Handshake,
  Medal,
  PartyPopper,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TartanDivider } from "@/components/brand/tartan-divider";
import { PrivateEventForm } from "@/components/marketing/private-event-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = buildMetadata({
  title: "Private Events — Birthdays, Corporate Outings & Group Rentals",
  description:
    "Host birthdays, corporate outings, team-building, church groups and fundraisers at The Bunker Indoor Golf in Linton, Indiana. Tell us about your event.",
  path: "/private-events",
});

const eventTypes = [
  { icon: Cake, label: "Birthdays", body: "Kid-friendly games, cake table and zero cleanup for you." },
  { icon: Handshake, label: "Corporate outings", body: "Client entertainment and team rewards that beat another dinner." },
  { icon: Users, label: "Team building", body: "Scrambles and team games that get everyone involved — golfers or not." },
  { icon: Church, label: "Church groups", body: "Fellowship nights with room for all ages." },
  { icon: HandHeart, label: "Fundraisers", body: "A turnkey venue for tournaments and benefit nights." },
  { icon: Medal, label: "Private tournaments", body: "Your own bracket, your own trophy, our whole setup." },
  { icon: PartyPopper, label: "Holiday parties", body: "Warm, festive and indoors — perfect for December." },
  { icon: UtensilsCrossed, label: "Family gatherings", body: "Reunions and celebrations with food and games in one place." },
];

const faqs = [
  {
    q: "How many people can you host?",
    a: "Each bay comfortably fits six players, and the lounge and Highland Stage area flex for larger gatherings. Full-facility rentals can host roughly 60–80 guests — tell us your number and we'll make it work.",
  },
  {
    q: "Do you provide food and drinks?",
    a: "Yes — our kitchen offers shareable platters, sandwiches and desserts, plus soft drinks, coffee, beer and wine. We'll build a food package that fits your group and budget.",
  },
  {
    q: "What if some guests don't golf?",
    a: "That's normal! Simulator games like closest-to-the-pin take seconds to learn, and plenty of guests are happy just to relax in the lounge. Non-golfers always have a good time.",
  },
  {
    q: "How far ahead should we book?",
    a: "Two to four weeks ahead is ideal for most events; December dates and full-facility rentals go earliest. Short-notice requests are still worth asking about.",
  },
  {
    q: "How does pricing work?",
    a: "Private events are quoted per event based on bays, hours, headcount and catering. Send an inquiry and we'll reply with a straightforward quote — no obligation.",
  },
];

export default async function PrivateEventsPage() {
  await getSiteSettings();

  return (
    <>
      <section className="bg-primary-dark py-16 text-cream md:py-24">
        <div className="container max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Private events
          </p>
          <h1 className="text-display-lg font-semibold">
            Bring Your Group Inside The Bunker
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
            Reserve a bay, a corner or the whole clubhouse. We handle setup, food
            and the fun — you take the credit.
          </p>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((t) => (
            <div key={t.label} className="rounded-lg border border-border/40 bg-surface p-5">
              <t.icon aria-hidden className="h-6 w-6 text-gold-dark" />
              <h2 className="mt-3 font-serif text-lg font-semibold text-primary">{t.label}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <TartanDivider />

      <section className="bg-surface py-14 md:py-20">
        <div className="container grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SectionHeading
              align="left"
              eyebrow="Plan an event"
              title="Tell Us What You're Planning"
              description="Share the basics and we'll reply within two business days with availability and a quote. No commitment — just a conversation."
            />
            <div className="mt-8">
              <h2 className="font-serif text-lg font-semibold text-primary">
                Common questions
              </h2>
              <Accordion type="single" collapsible className="mt-2">
                {faqs.map((faq, i) => (
                  <AccordionItem key={faq.q} value={`faq-${i}`}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background p-6 md:p-8 lg:col-span-3">
            <PrivateEventForm />
          </div>
        </div>
      </section>
    </>
  );
}
