import { cache } from "react";
import { createSupabaseStaticClient } from "@/lib/supabase/static";
import type {
  EventRow,
  League,
  MembershipPlan,
  MenuCategory,
  MenuItem,
  OpeningUpdate,
  Program,
} from "@/types";
import {
  FALLBACK_EVENTS,
  FALLBACK_LEAGUES,
  FALLBACK_MEMBERSHIP_PLANS,
  FALLBACK_MENU,
  FALLBACK_PROGRAMS,
  FALLBACK_UPDATES,
} from "@/features/content/fallback-data";

/**
 * Public content queries. Each falls back to static seed-equivalent
 * data when Supabase is unavailable so the site always renders.
 */

export const getLeagues = cache(async (): Promise<League[]> => {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return FALLBACK_LEAGUES;
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .neq("status", "cancelled")
    .order("name");
  if (error || !data || data.length === 0) return FALLBACK_LEAGUES;
  return data as League[];
});

export const getLeagueBySlug = cache(async (slug: string): Promise<League | null> => {
  const leagues = await getLeagues();
  return leagues.find((l) => l.slug === slug) ?? null;
});

export const getPrograms = cache(async (): Promise<Program[]> => {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return FALLBACK_PROGRAMS;
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .neq("status", "cancelled")
    .order("name");
  if (error || !data || data.length === 0) return FALLBACK_PROGRAMS;
  return data as Program[];
});

export const getPublishedEvents = cache(async (): Promise<EventRow[]> => {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return FALLBACK_EVENTS;
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("starts_at");
  if (error || !data || data.length === 0) return FALLBACK_EVENTS;
  return data as EventRow[];
});

export const getEventBySlug = cache(async (slug: string): Promise<EventRow | null> => {
  const events = await getPublishedEvents();
  return events.find((e) => e.slug === slug) ?? null;
});

export const getMembershipPlans = cache(async (): Promise<MembershipPlan[]> => {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return FALLBACK_MEMBERSHIP_PLANS;
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error || !data || data.length === 0) return FALLBACK_MEMBERSHIP_PLANS;
  return data as MembershipPlan[];
});

export const getMenu = cache(
  async (): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> => {
    const supabase = createSupabaseStaticClient();
    if (!supabase) return FALLBACK_MENU;
    const [cats, items] = await Promise.all([
      supabase.from("menu_categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    if (cats.error || items.error || !cats.data || cats.data.length === 0) {
      return FALLBACK_MENU;
    }
    return {
      categories: cats.data as MenuCategory[],
      items: (items.data ?? []) as MenuItem[],
    };
  },
);

export const getOpeningUpdates = cache(async (): Promise<OpeningUpdate[]> => {
  const supabase = createSupabaseStaticClient();
  if (!supabase) return FALLBACK_UPDATES;
  const { data, error } = await supabase
    .from("opening_updates")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error || !data || data.length === 0) return FALLBACK_UPDATES;
  return data as OpeningUpdate[];
});

export const getOpeningUpdateBySlug = cache(
  async (slug: string): Promise<OpeningUpdate | null> => {
    const updates = await getOpeningUpdates();
    return updates.find((u) => u.slug === slug) ?? null;
  },
);
