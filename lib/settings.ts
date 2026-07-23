import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessMode, SiteSettings } from "@/types";

/**
 * Defaults mirror supabase/seed.sql. They keep the site fully
 * renderable (in pre-opening mode) before Supabase is configured
 * and act as a safety net if a settings row is missing.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  business_mode: "pre_opening",
  opening_label: "Fall 2026",
  facility: {
    name: "The Bunker Indoor Golf",
    city: "Linton",
    state: "IN",
    address_line1: null,
    postal_code: null,
    phone: null,
    email: "hello@thebunkerlinton.com",
    timezone: process.env.NEXT_PUBLIC_FACILITY_TIMEZONE ?? "America/Indiana/Indianapolis",
  },
  hero: {
    eyebrow: "Coming to Linton, Indiana",
    // "\n" splits the headline onto separate lines.
    headline: "Indoor Golf.\nReal Connections.",
    subheadline:
      "State-of-the-art simulators, leagues, lessons, good food and a place for our community to play, compete and connect—year-round.",
  },
  simulator: {
    brand: null,
    bay_count: 4,
    course_count: null,
    max_players_per_bay: 6,
    club_rentals_available: true,
    left_handed_support: true,
    accessibility_notes: "At least one bay is planned to be fully wheelchair accessible.",
  },
  booking_rules: {
    min_duration_minutes: 30,
    max_duration_minutes: 240,
    slot_interval_minutes: 30,
    buffer_minutes: 10,
    advance_window_days: 30,
    same_day_cutoff_minutes: 60,
    hold_minutes: 10,
    cancellation_window_hours: 24,
    tax_rate: 0.07,
  },
  social: { facebook: null, instagram: null },
};

/**
 * Loads site settings from the site_settings table, deep-merged
 * over defaults. Cached per request via React cache().
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error || !data) return DEFAULT_SETTINGS;

  const map = new Map<string, unknown>(data.map((row) => [row.key, row.value]));

  const merged: SiteSettings = {
    ...DEFAULT_SETTINGS,
    business_mode:
      (map.get("business_mode") as BusinessMode | undefined) ??
      DEFAULT_SETTINGS.business_mode,
    opening_label:
      (map.get("opening_label") as string | undefined) ?? DEFAULT_SETTINGS.opening_label,
    facility: {
      ...DEFAULT_SETTINGS.facility,
      ...((map.get("facility") as Partial<SiteSettings["facility"]> | undefined) ?? {}),
    },
    hero: {
      ...DEFAULT_SETTINGS.hero,
      ...((map.get("hero") as Partial<SiteSettings["hero"]> | undefined) ?? {}),
    },
    simulator: {
      ...DEFAULT_SETTINGS.simulator,
      ...((map.get("simulator") as Partial<SiteSettings["simulator"]> | undefined) ?? {}),
    },
    booking_rules: {
      ...DEFAULT_SETTINGS.booking_rules,
      ...((map.get("booking_rules") as
        | Partial<SiteSettings["booking_rules"]>
        | undefined) ?? {}),
    },
    social: {
      ...DEFAULT_SETTINGS.social,
      ...((map.get("social") as Partial<SiteSettings["social"]> | undefined) ?? {}),
    },
  };

  return merged;
});

export async function getBusinessMode(): Promise<BusinessMode> {
  const settings = await getSiteSettings();
  return settings.business_mode;
}

export function bookingIsOpen(mode: BusinessMode): boolean {
  return mode === "reservations_open" || mode === "fully_operational";
}
