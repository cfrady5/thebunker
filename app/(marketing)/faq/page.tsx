import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, faqJsonLd } from "@/lib/seo/metadata";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "FAQ — Everything to Know Before You Visit",
  description:
    "Answers about golf simulators, pricing, what to bring, kids, leagues, lessons and more at The Bunker Indoor Golf in Linton, Indiana.",
  path: "/faq",
});

const faqSections: Array<{
  heading: string;
  faqs: Array<{ q: string; a: string }>;
}> = [
  {
    heading: "First visit",
    faqs: [
      {
        q: "I've never used a golf simulator. Is that okay?",
        a: "Absolutely — a big part of The Bunker is built for first-timers. Our team will set up your bay, pick an easy game mode and show you the basics. Most new players are hitting shots within five minutes.",
      },
      {
        q: "Do I need my own clubs?",
        a: "No. Bring your own if you have them, or use our rental sets — we plan to stock right-handed, left-handed and junior clubs. You only need one club to have fun.",
      },
      {
        q: "What should I wear?",
        a: "Whatever's comfortable. Athletic shoes or sneakers are ideal. No dress code, no collared-shirt rules.",
      },
      {
        q: "How long should we book?",
        a: "One hour works well for practice or games for 1–2 people. A foursome playing a full 18 holes usually takes 3–4 hours. Groups who mostly want games and social time love 90–120 minutes.",
      },
    ],
  },
  {
    heading: "Booking & pricing",
    faqs: [
      {
        q: "How does pricing work?",
        a: "You rent the bay by the hour — not per person. Up to six people can share one bay and split the cost however you like.",
      },
      {
        q: "Can I cancel or reschedule?",
        a: "Yes. Cancel at least 24 hours before your session for a full refund, or reschedule free up to 2 hours before. Inside the window we're happy to convert your payment to account credit.",
      },
      {
        q: "Do you take walk-ins?",
        a: "When bays are open, absolutely — but evenings and weekends often book out, so reserving online is the safe move.",
      },
      {
        q: "Can kids play?",
        a: "Yes! Kids are welcome in bays with an adult, and our youth clinics and junior league are built just for them. The simulator's target games are a family favorite.",
      },
    ],
  },
  {
    heading: "Leagues, lessons & events",
    faqs: [
      {
        q: "I'm not very good. Can I still join a league?",
        a: "Yes — most of our leagues use handicaps so every skill level can compete, and several are explicitly social-first. If you're nervous, the Beginner Basics lesson is a great warm-up.",
      },
      {
        q: "How do lessons work?",
        a: "Lessons happen right in a simulator bay, where your instructor uses real ball-flight data to guide each session. Private lessons, beginner sessions and youth clinics are all available.",
      },
      {
        q: "Can I book The Bunker for a private event?",
        a: "Yes — single bays, multiple bays or the whole facility for birthdays, corporate outings, church groups and fundraisers. Send an inquiry from the Private Events page and we'll build a package.",
      },
    ],
  },
  {
    heading: "Food, drinks & facility",
    faqs: [
      {
        q: "Do you serve food and drinks?",
        a: "Yes — shareables, sandwiches, kids' items and desserts, plus soft drinks, coffee and local beer and wine. You can order right from your bay's seating area.",
      },
      {
        q: "Is The Bunker accessible?",
        a: "The facility is designed to be step-free with accessible restrooms, and at least one bay is planned to be fully wheelchair accessible. See our Accessibility page for details, or contact us about specific needs.",
      },
      {
        q: "When are you open?",
        a: "We open in Fall 2026. Regular hours will be posted here and on Google before opening day. Join the opening list to be notified.",
      },
    ],
  },
];

export default function FaqPage() {
  const allFaqs = faqSections.flatMap((s) => s.faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(allFaqs.map((f) => ({ question: f.q, answer: f.a }))),
          ),
        }}
      />
      <section className="container max-w-3xl py-14 md:py-20">
        <SectionHeading
          eyebrow="FAQ"
          title="Good Questions, Straight Answers"
          description="Everything to know before your first visit. Still curious? We're a message away."
        />

        <div className="mt-12 space-y-10">
          {faqSections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-serif text-2xl font-semibold text-primary">
                {section.heading}
              </h2>
              <Accordion type="single" collapsible className="mt-2">
                {section.faqs.map((faq, i) => (
                  <AccordionItem key={faq.q} value={`${section.heading}-${i}`}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-lg border border-border/40 bg-surface p-8 text-center">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Didn&apos;t find your answer?
          </h2>
          <p className="mt-2 text-charcoal-muted">We&apos;ll get back to you quickly.</p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/contact">Contact The Bunker</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
