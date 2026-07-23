import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { homeCopy } from "@/lib/content/home";

/**
 * Full-viewport cinematic hero: warm golf imagery under layered
 * dark gradients, drifting gold light motes (CSS-only, hidden for
 * reduced motion) and an animated scroll cue.
 */
export function HeroCinematic({
  canBook,
  eyebrow,
  headline,
  paragraph,
}: {
  canBook: boolean;
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

  const motes = [
    { left: "12%", top: "68%", size: 5, delay: "0s", duration: "11s" },
    { left: "28%", top: "38%", size: 3, delay: "2.2s", duration: "14s" },
    { left: "55%", top: "72%", size: 4, delay: "1.1s", duration: "12s" },
    { left: "72%", top: "30%", size: 3, delay: "3.4s", duration: "15s" },
    { left: "86%", top: "58%", size: 5, delay: "0.7s", duration: "10s" },
    { left: "44%", top: "22%", size: 2, delay: "4.6s", duration: "13s" },
  ];

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-primary-dark text-cream">
      {/* Backdrop */}
      <Image
        src="/gallery/sunset-swing.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-60"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/75 to-primary-dark/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-primary-dark via-transparent to-primary-dark/60"
      />
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="absolute -left-40 top-1/3 h-[540px] w-[540px] rounded-full bg-gold/10 blur-[140px]"
      />
      {/* Drifting light motes */}
      <div aria-hidden className="absolute inset-0 motion-reduce:hidden">
        {motes.map((m, i) => (
          <span
            key={i}
            className="animate-mote absolute rounded-full bg-gold/60"
            style={{
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              animationDelay: m.delay,
              animationDuration: m.duration,
              boxShadow: "0 0 12px 2px rgb(201 164 106 / 0.35)",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-28 pt-36 md:px-8 md:pt-40 xl:px-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-gold md:text-sm">
          {hero.eyebrow}
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-[46px] font-semibold leading-[1.04] md:text-[68px] lg:text-[78px]">
          {hero.headlineLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-cream/85 md:text-[19px]">
          {hero.paragraph}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={canBook ? "/book" : "#opening-list"}
            className="inline-flex h-[54px] items-center justify-center rounded-md bg-gold px-9 text-sm font-semibold uppercase tracking-wider text-primary-dark shadow-[0_6px_28px_rgb(201_164_106/0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-dark hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream motion-reduce:hover:translate-y-0"
          >
            {canBook ? "Book a Bay" : hero.primaryCta}
          </Link>
          <Link
            href="/about"
            className="inline-flex h-[54px] items-center justify-center rounded-md border border-cream/35 px-9 text-sm font-semibold uppercase tracking-wider text-cream backdrop-blur-sm transition-colors hover:border-cream/70 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {hero.secondaryCta}
          </Link>
        </div>
        <p className="mt-9 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.22em] text-cream/60">
          <MapPin aria-hidden className="h-4 w-4 text-gold" />
          {hero.locationRow}
        </p>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-cream/50"
      >
        <ChevronDown className="animate-scroll-cue h-6 w-6" />
      </div>
    </section>
  );
}
