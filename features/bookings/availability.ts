"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import {
  computeAvailableSlots,
  groupSlotsByTime,
  type Interval,
} from "@/lib/availability/engine";
import { resolvePricingRule, computeQuote } from "@/lib/pricing/engine";
import { availabilityQuerySchema } from "@/lib/validation/schemas";
import { facilityDayOfWeek, facilityLocalToUtc, formatFacility } from "@/lib/dates";
import type {
  BayBlackout,
  Booking,
  BookingHold,
  BusinessHoursRow,
  PricingRule,
  SimulatorBay,
  SpecialHoursRow,
} from "@/types";

export interface AvailableTime {
  startsAtIso: string;
  endsAtIso: string;
  label: string; // "6:30 PM"
  bayId: string;
  bayName: string;
  priceCents: number;
  peakLabel: "peak" | "off-peak" | null;
}

export type AvailabilityResponse =
  | { ok: true; times: AvailableTime[]; date: string }
  | {
      ok: false;
      reason: "closed" | "not_configured" | "booking_closed" | "invalid";
      message: string;
    };

/**
 * Computes bookable start times for a date/duration/party size.
 * All calculation happens server-side against live reservation data.
 */
export async function getAvailability(raw: {
  date: string;
  duration_minutes: number;
  player_count: number;
}): Promise<AvailabilityResponse> {
  const parsed = availabilityQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", message: "Invalid availability request." };
  }
  const { date, duration_minutes, player_count } = parsed.data;

  const settings = await getSiteSettings();
  if (!bookingIsOpen(settings.business_mode)) {
    return {
      ok: false,
      reason: "booking_closed",
      message: "Reservations aren't open yet.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      reason: "not_configured",
      message: "The booking system isn't connected on this preview site.",
    };
  }

  const rules = settings.booking_rules;
  const dayStartUtc = facilityLocalToUtc(date, "00:00");
  const dayEndUtc = new Date(dayStartUtc.getTime() + 36 * 3_600_000); // generous window

  const [baysRes, hoursRes, specialRes, bookingsRes, holdsRes, blackoutsRes, pricingRes] =
    await Promise.all([
      supabase.from("simulator_bays").select("*").eq("active", true).order("sort_order"),
      supabase.from("business_hours").select("*").eq("active", true),
      supabase.from("special_hours").select("*").eq("date", date),
      supabase
        .from("bookings")
        .select("id, bay_id, starts_at, ends_at, status")
        .in("status", ["held", "payment_pending", "confirmed", "checked_in"])
        .gte("ends_at", dayStartUtc.toISOString())
        .lte("starts_at", dayEndUtc.toISOString()),
      supabase
        .from("booking_holds")
        .select("id, bay_id, starts_at, ends_at, expires_at, status")
        .eq("status", "active")
        .gte("ends_at", dayStartUtc.toISOString()),
      supabase
        .from("bay_blackouts")
        .select("*")
        .gte("ends_at", dayStartUtc.toISOString())
        .lte("starts_at", dayEndUtc.toISOString()),
      supabase.from("pricing_rules").select("*").eq("active", true),
    ]);

  const bays = (baysRes.data ?? []) as SimulatorBay[];
  const hours = (hoursRes.data ?? []) as BusinessHoursRow[];
  const special = (specialRes.data ?? []) as SpecialHoursRow[];
  const bookings = (bookingsRes.data ?? []) as Pick<
    Booking,
    "id" | "bay_id" | "starts_at" | "ends_at" | "status"
  >[];
  const holds = (holdsRes.data ?? []) as BookingHold[];
  const blackouts = (blackoutsRes.data ?? []) as BayBlackout[];
  const pricingRules = (pricingRes.data ?? []) as PricingRule[];

  // Resolve the open window for this date (special hours override weekly).
  const dow = facilityDayOfWeek(date);
  const todaysSpecial = special[0];
  let openWindow: Interval | null = null;

  if (todaysSpecial?.closed) {
    openWindow = null;
  } else if (todaysSpecial?.opens_at && todaysSpecial?.closes_at) {
    openWindow = {
      startMs: facilityLocalToUtc(date, todaysSpecial.opens_at).getTime(),
      endMs: facilityLocalToUtc(date, todaysSpecial.closes_at).getTime(),
    };
  } else {
    const todaysHours = hours.filter(
      (h) =>
        h.day_of_week === dow &&
        (!h.effective_from || h.effective_from <= date) &&
        (!h.effective_to || h.effective_to >= date),
    );
    const row = todaysHours[0];
    if (row) {
      openWindow = {
        startMs: facilityLocalToUtc(date, row.opens_at).getTime(),
        endMs: facilityLocalToUtc(date, row.closes_at).getTime(),
      };
    }
  }

  if (!openWindow) {
    return {
      ok: false,
      reason: "closed",
      message: "We're closed on that date. Try another day.",
    };
  }

  const now = Date.now();
  const busyByBay: Record<string, Interval[]> = {};
  for (const b of bookings) {
    (busyByBay[b.bay_id] ??= []).push({
      startMs: new Date(b.starts_at).getTime(),
      endMs: new Date(b.ends_at).getTime(),
    });
  }
  for (const h of holds) {
    if (new Date(h.expires_at).getTime() < now) continue; // stale hold
    (busyByBay[h.bay_id] ??= []).push({
      startMs: new Date(h.starts_at).getTime(),
      endMs: new Date(h.ends_at).getTime(),
    });
  }

  const slots = computeAvailableSlots({
    openWindow,
    bays: bays.map((b) => ({
      id: b.id,
      name: b.name,
      capacity: b.capacity,
      active: b.active,
      maintenanceStatus: b.maintenance_status,
    })),
    busyByBay,
    blackouts: blackouts.map((b) => ({
      startMs: new Date(b.starts_at).getTime(),
      endMs: new Date(b.ends_at).getTime(),
      bayId: b.bay_id,
    })),
    durationMinutes: duration_minutes,
    bufferMinutes: rules.buffer_minutes,
    slotIntervalMinutes: rules.slot_interval_minutes,
    nowMs: now,
    sameDayCutoffMinutes: rules.same_day_cutoff_minutes,
  });

  const options = groupSlotsByTime(slots, player_count);
  const bayById = new Map(bays.map((b) => [b.id, b]));
  const standardRule = pricingRules
    .filter((r) => r.service_type === "bay_rental" && r.priority === 0)
    .sort((a, b) => a.price_per_unit_cents - b.price_per_unit_cents)[0];

  const times: AvailableTime[] = [];
  for (const opt of options) {
    if (!opt.assignedBayId) continue;
    const bay = bayById.get(opt.assignedBayId);
    if (!bay) continue;

    const startIso = new Date(opt.startMs).toISOString();
    const startTimeLocal = formatFacility(startIso, "HH:mm");
    const rule = resolvePricingRule(pricingRules, {
      dayOfWeek: dow,
      startTime: startTimeLocal,
      date,
      serviceType: "bay_rental",
    });
    if (!rule) continue;

    const quote = computeQuote({
      rule,
      durationMinutes: duration_minutes,
      taxRate: 0, // slot list shows pre-tax bay price; tax added at review
    });

    times.push({
      startsAtIso: startIso,
      endsAtIso: new Date(opt.endMs).toISOString(),
      label: formatFacility(startIso, "h:mm a"),
      bayId: bay.id,
      bayName: bay.name,
      priceCents: quote.subtotalCents,
      peakLabel: standardRule
        ? rule.price_per_unit_cents > standardRule.price_per_unit_cents
          ? "peak"
          : rule.price_per_unit_cents < standardRule.price_per_unit_cents
            ? "off-peak"
            : null
        : null,
    });
  }

  return { ok: true, times, date };
}
