import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus, Clock, MapPin, Navigation, Phone, Tag } from "lucide-react";
import type { SiteSettings } from "@/types";
import type { FacilityHours } from "@/lib/content/facility-info";

/**
 * Final homepage section: the practical "how do I get there / what does
 * it cost / when are you open" block, with the primary booking CTA.
 * Replaces the pre-opening email capture. Values that aren't finalised
 * yet render as clearly-marked placeholders.
 */
export function VisitAndBook({
  facility,
  fromHourlyCents,
  hours,
  directionsUrl,
}: {
  facility: SiteSettings["facility"];
  fromHourlyCents: number | null;
  hours: FacilityHours | null;
  directionsUrl: string;
}) {
  const priceLabel =
    fromHourlyCents != null
      ? `Bay rentals from $${Math.round(fromHourlyCents / 100)}/hour`
      : "Bay rentals — see pricing";

  const addressLines = facility.address_line1
    ? [facility.address_line1, `${facility.city}, ${facility.state}${facility.postal_code ? ` ${facility.postal_code}` : ""}`]
    : [`${facility.city}, ${facility.state}`, "Full address coming soon"];

  return (
    <section className="bg-primary-dark text-cream">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8 md:py-20 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
              Visit &amp; book
            </p>
            <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight md:text-[44px]">
              Come See Us in Linton.
            </h2>

            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <InfoRow icon={Tag} label="Pricing">
                {priceLabel}
              </InfoRow>
              <InfoRow icon={Clock} label="Hours">
                {hours?.todayRange ? (
                  <>
                    <span className="font-semibold text-cream">
                      Open today: {hours.todayRange}
                    </span>
                    {hours.week.length > 0 ? (
                      <span className="mt-1 block text-sm text-cream/60">
                        {hours.week.map((h) => `${h.days} ${h.range}`).join(" · ")}
                      </span>
                    ) : null}
                  </>
                ) : hours ? (
                  "Closed today — see weekly hours"
                ) : (
                  "Hours coming soon"
                )}
              </InfoRow>
              <InfoRow icon={MapPin} label="Location">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                {facility.phone ?? "Phone coming soon"}
              </InfoRow>
            </dl>
          </div>

          <div className="flex flex-col gap-3 lg:w-64">
            <Link
              href="/book"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md bg-gold px-8 text-sm font-semibold uppercase tracking-wider text-primary-dark shadow-[0_6px_24px_rgb(201_164_106/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-dark hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream motion-reduce:hover:translate-y-0"
            >
              <CalendarPlus aria-hidden className="h-4 w-4" />
              Book a Bay
            </Link>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-cream/40 px-8 text-sm font-semibold uppercase tracking-wider text-cream transition-colors hover:border-gold hover:bg-cream/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Navigation aria-hidden className="h-4 w-4" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/10">
        <Icon aria-hidden className="h-4 w-4 text-gold" />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">
          {label}
        </dt>
        <dd className="mt-1 leading-relaxed text-cream/85">{children}</dd>
      </div>
    </div>
  );
}
