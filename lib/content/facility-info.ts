import { createSupabaseStaticClient } from "@/lib/supabase/static";
import { facilityToday, facilityDayOfWeek } from "@/lib/dates";
import type { BusinessHoursRow, PricingRule } from "@/types";

/**
 * Live facility facts for the homepage and footer — operating hours and
 * the entry bay-rental price — read through the cookieless static client
 * so these public reads are safe on statically-eligible pages. Each
 * returns null when unavailable so callers can show an honest
 * placeholder rather than invented data.
 */

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "16:00:00" → "4:00 PM" */
function formatClock(t: string): string {
  const [hRaw = 0, mRaw = 0] = t.split(":").map(Number);
  const period = hRaw < 12 ? "AM" : "PM";
  const hour = ((hRaw + 11) % 12) + 1;
  return `${hour}:${String(mRaw).padStart(2, "0")} ${period}`;
}

export interface HoursGroup {
  days: string;
  range: string;
}

export interface FacilityHours {
  /** Compact grouped weekly hours, Mon → Sun. */
  week: HoursGroup[];
  /** Today's range, or null when closed today. */
  todayRange: string | null;
}

export async function loadFacilityHours(): Promise<FacilityHours | null> {
  const supabase = createSupabaseStaticClient();
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
  const week = groups.map((g) => ({
    days:
      g.startIdx === g.endIdx ? nm(g.startIdx) : `${nm(g.startIdx)} – ${nm(g.endIdx)}`,
    range: g.range,
  }));

  const todayDow = facilityDayOfWeek(facilityToday());
  const todayRow = byDow.get(todayDow);
  const todayRange = todayRow
    ? `${formatClock(todayRow.opens_at)} – ${formatClock(todayRow.closes_at)}`
    : null;

  return { week, todayRange };
}

/** Lowest active bay-rental rate, normalised to whole dollars per hour. */
export async function loadBayFromHourlyCents(): Promise<number | null> {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("pricing_rules")
    .select("price_per_unit_cents, billing_unit_minutes, service_type, active")
    .eq("service_type", "bay_rental")
    .eq("active", true);
  const rules = (data ?? []) as Pick<
    PricingRule,
    "price_per_unit_cents" | "billing_unit_minutes"
  >[];
  if (rules.length === 0) return null;
  const hourly = rules
    .filter((r) => r.billing_unit_minutes > 0)
    .map((r) => Math.round((r.price_per_unit_cents * 60) / r.billing_unit_minutes));
  if (hourly.length === 0) return null;
  return Math.min(...hourly);
}
