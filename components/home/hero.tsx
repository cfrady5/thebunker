import Link from "next/link";
import Image from "next/image";
import { CalendarPlus, MapPin, Tag } from "lucide-react";

/**
 * Operational homepage hero: a wide facility photograph under a dark
 * green gradient so the headline stays legible, with the primary
 * "Book a Bay" CTA. Sized to sit comfortably within the first desktop
 * viewport below the header.
 *
 * NOTE: the background is interim golf photography. Swap the src for a
 * real photo of the simulator bays / customers playing when available
 * (tracked in LAUNCH_CHECKLIST.md).
 */
export function HeroSection({
  eyebrow,
  headline,
  subheadline,
}: {
  /** Admin-editable overrides (site_settings.hero); "\n" splits lines. */
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
}) {
  const eyebrowText = eyebrow ?? "Linton, Indiana";
  const lines = (headline ?? "Indoor Golf.\nReal Connections.").split("\n");
  const copy =
    subheadline ??
    "Premium simulators, great food and year-round golf in Linton, Indiana.";

  return (
    <section className="relative isolate flex min-h-[540px] items-center overflow-hidden bg-primary-dark md:min-h-[600px] lg:min-h-[calc(100svh-92px)] lg:max-h-[760px]">
      <Image
        src="/gallery/friends-on-course.jpg"
        alt="Golfers enjoying a round together"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Dark green gradients for legibility — stronger on the left where the text sits. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/85 to-primary-dark/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-primary-dark/85 via-transparent to-primary-dark/40"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 py-14 md:px-8 md:py-16 xl:px-16">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-gold">
            <MapPin aria-hidden className="h-4 w-4" />
            {eyebrowText}
          </p>
          <h1 className="mt-4 font-serif text-[44px] font-semibold leading-[1.04] text-cream md:text-[60px] lg:text-[66px]">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-md text-[18px] leading-relaxed text-cream/80 md:text-[19px]">
            {copy}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md bg-gold px-8 text-sm font-semibold uppercase tracking-wider text-primary-dark shadow-[0_6px_24px_rgb(201_164_106/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-dark hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream motion-reduce:hover:translate-y-0"
            >
              <CalendarPlus aria-hidden className="h-4 w-4" />
              Book a Bay
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-cream/40 bg-cream/5 px-8 text-sm font-semibold uppercase tracking-wider text-cream backdrop-blur-sm transition-colors hover:border-gold hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Tag aria-hidden className="h-4 w-4" />
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
