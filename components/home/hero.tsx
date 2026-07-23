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
    <section className="bg-cream">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[48fr_52fr] lg:py-28 xl:px-16">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-[42px] font-semibold leading-[1.06] text-primary md:text-[58px] lg:text-[70px]">
            {hero.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-charcoal-muted md:text-[19px]">
            {hero.paragraph}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={canBook ? "/book" : "#opening-list"}
              className="inline-flex h-[52px] items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {canBook ? "Book a Bay" : hero.primaryCta}
            </Link>
            <Link
              href="/about"
              className="inline-flex h-[52px] items-center justify-center rounded-md border border-gold/70 bg-transparent px-8 text-sm font-semibold uppercase tracking-wider text-charcoal transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {hero.secondaryCta}
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.22em] text-charcoal-muted">
            <MapPin aria-hidden className="h-4 w-4 text-gold-dark" />
            {hero.locationRow}
          </p>
        </div>

        <div className="flex justify-center lg:justify-end lg:pr-8">
          <Logo
            variant="full"
            width={340}
            height={397}
            priority
            className="w-[240px] sm:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>
    </section>
  );
}
