import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { homeCopy } from "@/lib/content/home";

export function HeroSection({
  canBook,
  eyebrow,
  headline,
  paragraph,
}: {
  canBook: boolean;
  /** Admin-editable overrides (site_settings.hero); "\n" splits headline lines. */
  eyebrow?: string;
  headline?: string;
  paragraph?: string;
}) {
  const hero = {
    ...homeCopy.hero,
    eyebrow: eyebrow ?? homeCopy.hero.eyebrow,
    headlineLines: headline ? headline.split("\n") : [...homeCopy.hero.headlineLines],
    paragraph: paragraph ?? homeCopy.hero.paragraph,
  };

  return (
    <section className="relative overflow-hidden bg-primary-dark">
      {/* Ambient depth + gold glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary to-primary-dark"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-gold/20 blur-[160px]"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[48fr_52fr] lg:py-28 xl:px-16">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-[42px] font-semibold leading-[1.06] text-cream md:text-[58px] lg:text-[70px]">
            {hero.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-cream/75 md:text-[19px]">
            {hero.paragraph}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={canBook ? "/book" : "#opening-list"}
              className="inline-flex h-[52px] items-center justify-center rounded-md bg-gold px-8 text-sm font-semibold uppercase tracking-wider text-primary-dark transition-colors hover:bg-gold-dark hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
            >
              {canBook ? "Book a Bay" : hero.primaryCta}
            </Link>
            <Link
              href="/about"
              className="inline-flex h-[52px] items-center justify-center rounded-md border border-cream/40 bg-transparent px-8 text-sm font-semibold uppercase tracking-wider text-cream transition-colors hover:border-gold hover:bg-cream/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark"
            >
              {hero.secondaryCta}
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.22em] text-cream/70">
            <MapPin aria-hidden className="h-4 w-4 text-gold" />
            {hero.locationRow}
          </p>
        </div>

        <div className="relative flex justify-center lg:justify-end lg:pr-8">
          {/* Soft glow to lift the crest off the dark green */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[120px] lg:left-auto lg:right-16"
          />
          <Logo
            variant="full"
            width={400}
            priority
            className="relative w-[240px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>
    </section>
  );
}
