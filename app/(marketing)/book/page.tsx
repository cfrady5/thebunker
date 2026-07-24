import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getCurrentUser } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingFlow } from "@/components/booking/booking-flow";
import { SectionHeading } from "@/components/marketing/section-heading";
import type { BusinessHoursRow } from "@/types";

export const metadata: Metadata = buildMetadata({
  title: "Book a Bay",
  description:
    "Reserve a golf simulator bay at The Bunker in Linton, Indiana. Pick your date, time and session length — up to six players per bay.",
  path: "/book",
});

const STATE_NAMES: Record<string, string> = { IN: "Indiana" };
const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "16:00:00" → "4:00 PM" */
function formatClock(t: string): string {
  const [hRaw = 0, mRaw = 0] = t.split(":").map(Number);
  const period = hRaw < 12 ? "AM" : "PM";
  const hour = ((hRaw + 11) % 12) + 1;
  return `${hour}:${String(mRaw).padStart(2, "0")} ${period}`;
}

/**
 * Groups active weekly hours into compact "Mon – Thu · 4:00 PM – 10:00 PM"
 * ranges for the experience panel. Returns null when unavailable so the
 * panel shows an honest placeholder rather than invented hours.
 */
async function loadHours(): Promise<Array<{ days: string; range: string }> | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("business_hours")
    .select("day_of_week, opens_at, closes_at, active")
    .eq("active", true);
  const rows = (data ?? []) as Pick<
    BusinessHoursRow,
    "day_of_week" | "opens_at" | "closes_at"
  >[];
  if (rows.length === 0) return null;

  const byDow = new Map(rows.map((r) => [r.day_of_week, r]));
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun
  type Group = { startIdx: number; endIdx: number; range: string };
  const groups: Group[] = [];
  order.forEach((dow, idx) => {
    const row = byDow.get(dow);
    if (!row) return;
    const range = `${formatClock(row.opens_at)} – ${formatClock(row.closes_at)}`;
    const last = groups[groups.length - 1];
    if (last && last.range === range && last.endIdx === idx - 1) {
      last.endIdx = idx;
    } else {
      groups.push({ startIdx: idx, endIdx: idx, range });
    }
  });

  const nm = (idx: number) => DOW_NAMES[order[idx] ?? 0] ?? "";
  return groups.map((g) => ({
    days:
      g.startIdx === g.endIdx
        ? nm(g.startIdx)
        : `${nm(g.startIdx)} – ${nm(g.endIdx)}`,
    range: g.range,
  }));
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [settings, user, params, hours] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    searchParams,
    loadHours(),
  ]);

  if (!bookingIsOpen(settings.business_mode)) {
    return (
      <section className="container max-w-2xl py-16 md:py-24">
        <SectionHeading
          eyebrow="Reservations"
          title="Temporarily Closed"
          description="We're temporarily closed and not accepting reservations right now. Please check back soon, or reach out and we'll help you plan your visit."
        />
        <div className="mt-8 text-center">
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary-dark"
          >
            Contact us
          </a>
        </div>
      </section>
    );
  }

  const city = settings.facility.city;
  const state = settings.facility.state;
  const locationLabel = `${city}, ${STATE_NAMES[state] ?? state}`;

  return (
    <BookingFlow
      signedIn={Boolean(user)}
      userEmail={user?.profile.email ?? null}
      taxRate={settings.booking_rules.tax_rate}
      cancellationHours={settings.booking_rules.cancellation_window_hours}
      maxPlayers={settings.simulator.max_players_per_bay}
      advanceWindowDays={settings.booking_rules.advance_window_days}
      hours={hours}
      locationLabel={locationLabel}
      cancelled={Boolean(params.cancelled)}
    />
  );
}
