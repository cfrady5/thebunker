import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Accessibility",
  description:
    "Accessibility at The Bunker Indoor Golf — our facility, website standards and how to request accommodations.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <section className="container max-w-3xl py-14 md:py-20">
      <h1 className="text-display-md font-semibold text-primary">Accessibility</h1>
      <div className="prose-policies mt-4">
        <p>
          Golf should be for everyone, and so should The Bunker. Here&apos;s how
          we&apos;re building for access — and how to tell us when we can do better.
        </p>

        <h2>The facility</h2>
        <ul>
          <li>Step-free entry, restrooms and circulation throughout the building.</li>
          <li>At least one simulator bay planned to be fully wheelchair accessible, with clear floor space in the hitting area.</li>
          <li>Accessible parking adjacent to the entrance.</li>
          <li>Staff trained to assist with setup, seated play options and adaptive equipment questions.</li>
        </ul>

        <h2>This website</h2>
        <ul>
          <li>We target WCAG 2.2 AA: keyboard-accessible navigation and booking, visible focus states, sufficient color contrast and screen-reader-friendly forms.</li>
          <li>Animations respect your reduced-motion system preference.</li>
          <li>The booking flow can be completed entirely without a mouse.</li>
        </ul>

        <h2>Requesting accommodations</h2>
        <p>
          Booking a visit and have a specific need — mobility, sensory, or anything
          else? There&apos;s an accessibility notes field in the booking flow, or{" "}
          <Link href="/contact?subject=Accessibility" className="font-medium text-primary underline underline-offset-2">
            contact us ahead of your visit
          </Link>{" "}
          and we&apos;ll have things ready.
        </p>

        <h2>Feedback</h2>
        <p>
          If you hit an accessibility barrier on this site or in the facility,
          please tell us. We treat accessibility reports as bugs to fix, not
          suggestions to consider.
        </p>
      </div>
    </section>
  );
}
