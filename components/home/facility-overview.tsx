import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LandPlot, Users, Wind } from "lucide-react";
import type { SiteSettings } from "@/types";

/**
 * One clean split-layout overview — a strong facility photo beside
 * concise copy and three at-a-glance facts. Facts come from
 * site_settings so they stay accurate as the facility is finalised.
 *
 * NOTE: the photo is interim golf photography; swap for a real
 * clubhouse/bay shot when available (LAUNCH_CHECKLIST.md).
 */
export function FacilityOverview({ settings }: { settings: SiteSettings }) {
  const { simulator } = settings;
  const facts = [
    {
      icon: LandPlot,
      value: String(simulator.bay_count),
      label: "premium simulator bays",
    },
    {
      icon: Users,
      value: `Up to ${simulator.max_players_per_bay}`,
      label: "players per bay",
    },
    {
      icon: Wind,
      value: simulator.club_rentals_available ? "Club rentals" : "Bring your clubs",
      label: simulator.club_rentals_available ? "available on site" : "or rent when ready",
    },
  ];

  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-14 xl:px-16">
        <div className="relative overflow-hidden rounded-xl">
          <Image
            src="/gallery/teed-up.jpg"
            alt="A golf ball teed up, ready to play"
            width={1000}
            height={800}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-[5/4] h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-primary-dark/40 via-transparent to-transparent"
          />
        </div>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            The Bunker
          </p>
          <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-primary md:text-[44px]">
            More Than a Round of Golf.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-charcoal-muted">
            The Bunker combines premium golf simulators, lessons, leagues, food
            and drinks in a relaxed clubhouse atmosphere. Practice your game, play
            world-class courses or spend an evening with friends.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-border/70 pt-8 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label}>
                <fact.icon aria-hidden className="h-5 w-5 text-gold-dark" />
                <dd className="mt-2 font-serif text-2xl font-semibold text-primary">
                  {fact.value}
                </dd>
                <dt className="mt-0.5 text-sm text-charcoal-muted">{fact.label}</dt>
              </div>
            ))}
          </dl>

          <Link
            href="/simulators"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-dark"
          >
            Explore the Experience
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
