import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { homeCopy } from "@/lib/content/home";

/**
 * Four editorial columns — no icons, no cards. Each links to the
 * relevant page with a restrained hover. Thin dividers keep it calm.
 */
const PILLAR_HREFS: Record<string, string> = {
  Play: "/simulators",
  Learn: "/lessons",
  Compete: "/leagues",
  Connect: "/events",
};

export function ValuePillars() {
  const { values } = homeCopy;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8 md:py-20 xl:px-16">
        <div className="flex items-center justify-center gap-5">
          <span aria-hidden className="h-px w-12 bg-gold/50 sm:w-20" />
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            {values.eyebrow}
          </p>
          <span aria-hidden className="h-px w-12 bg-gold/50 sm:w-20" />
        </div>
        <div className="mt-10 grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-border/70">
          {values.pillars.map((pillar) => {
            const href = PILLAR_HREFS[pillar.title] ?? "/about";
            return (
              <Link
                key={pillar.title}
                href={href}
                className="group block px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset lg:py-5 xl:px-10"
              >
                <h2 className="inline-flex items-center gap-1.5 text-[22px] font-semibold uppercase tracking-[0.06em] text-primary transition-colors group-hover:text-primary-light">
                  {pillar.title}
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 text-gold-dark opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  />
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-charcoal-muted">
                  {pillar.body}
                </p>
                <span
                  aria-hidden
                  className="mx-auto mt-3.5 block h-px w-8 bg-transparent transition-colors duration-200 group-hover:bg-gold"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
