import { homeCopy } from "@/lib/content/home";

/**
 * Four editorial columns — no icons, no cards. Thin vertical
 * dividers on desktop, horizontal dividers on mobile.
 */
export function ValuePillars() {
  const { values } = homeCopy;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-4 md:px-8 md:pb-28 xl:px-16">
        <div className="flex items-center justify-center gap-5">
          <span aria-hidden className="h-px w-12 bg-gold/50 sm:w-20" />
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            {values.eyebrow}
          </p>
          <span aria-hidden className="h-px w-12 bg-gold/50 sm:w-20" />
        </div>
        <div className="mt-12 grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {values.pillars.map((pillar) => (
            <div key={pillar.title} className="px-6 py-8 text-center lg:py-2 xl:px-10">
              <h2 className="text-[22px] font-semibold uppercase tracking-[0.06em] text-primary">
                {pillar.title}
              </h2>
              <p className="mt-3.5 text-[15px] leading-relaxed text-charcoal-muted">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
