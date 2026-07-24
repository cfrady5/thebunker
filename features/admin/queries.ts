import { createSupabaseServerClient } from "@/lib/supabase/server";
import { facilityLocalToUtc, facilityToday } from "@/lib/dates";
import type {
  Booking,
  ContactMessage,
  DiscountCode,
  DiscountRedemption,
  PrivateEventInquiry,
  Profile,
} from "@/types";

type StaffName = { first_name: string; last_name: string } | null;
export type DiscountCodeRow = DiscountCode & { creator: StaffName };
export type DiscountRedemptionRow = DiscountRedemption & { redeemer: StaffName };

/**
 * Admin queries run through the anon server client so staff RLS
 * policies stay in force — a non-staff session gets empty results,
 * never data.
 */

export interface AdminDashboardData {
  todaysBookings: Array<Booking & { profile: Pick<Profile, "first_name" | "last_name" | "email"> | null }>;
  todayRevenueCents: number;
  occupancyPct: number;
  newInquiries: number;
  newMessages: number;
  interestCount: number;
  pendingPayments: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createSupabaseServerClient();
  const empty: AdminDashboardData = {
    todaysBookings: [],
    todayRevenueCents: 0,
    occupancyPct: 0,
    newInquiries: 0,
    newMessages: 0,
    interestCount: 0,
    pendingPayments: 0,
  };
  if (!supabase) return empty;

  const today = facilityToday();
  const dayStart = facilityLocalToUtc(today, "00:00").toISOString();
  const dayEnd = facilityLocalToUtc(today, "23:59").toISOString();

  const [bookingsRes, inquiriesRes, messagesRes, interestRes, baysRes, hoursRes] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, profile:profiles(first_name, last_name, email)")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .order("starts_at"),
      supabase
        .from("private_event_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("interest_submissions")
        .select("id", { count: "exact", head: true }),
      supabase.from("simulator_bays").select("id").eq("active", true),
      supabase.from("business_hours").select("*").eq("active", true),
    ]);

  const bookings = (bookingsRes.data ?? []) as AdminDashboardData["todaysBookings"];
  const live = bookings.filter((b) =>
    ["confirmed", "checked_in", "completed"].includes(b.status),
  );
  const revenue = live.reduce((sum, b) => sum + b.total_cents, 0);
  const pendingPayments = bookings.filter((b) => b.status === "payment_pending").length;

  // Occupancy: booked minutes ÷ open bay-minutes today.
  const bayCount = (baysRes.data ?? []).length;
  const dow = new Date(`${today}T12:00:00`).getDay();
  const todaysHours = (hoursRes.data ?? []).find(
    (h: { day_of_week: number }) => h.day_of_week === dow,
  ) as { opens_at: string; closes_at: string } | undefined;
  let occupancyPct = 0;
  if (todaysHours && bayCount > 0) {
    const [oh = 0, om = 0] = todaysHours.opens_at.split(":").map(Number);
    const [ch = 0, cm = 0] = todaysHours.closes_at.split(":").map(Number);
    const openMinutes = (ch * 60 + cm - (oh * 60 + om)) * bayCount;
    const bookedMinutes = live.reduce(
      (sum, b) =>
        sum +
        (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60_000,
      0,
    );
    occupancyPct = openMinutes > 0 ? Math.round((bookedMinutes / openMinutes) * 100) : 0;
  }

  return {
    todaysBookings: bookings,
    todayRevenueCents: revenue,
    occupancyPct,
    newInquiries: inquiriesRes.count ?? 0,
    newMessages: messagesRes.count ?? 0,
    interestCount: interestRes.count ?? 0,
    pendingPayments,
  };
}

/** Discount codes with the staff member who created each. */
export async function getDiscountCodes(): Promise<DiscountCodeRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("discount_codes")
    .select("*, creator:profiles(first_name, last_name)")
    .order("created_at", { ascending: false });
  return (data ?? []) as DiscountCodeRow[];
}

/** Every discount redemption with the employee who applied it. */
export async function getDiscountRedemptions(): Promise<DiscountRedemptionRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("discount_redemptions")
    .select("*, redeemer:profiles(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as DiscountRedemptionRow[];
}

/** Contact-form submissions for the staff inbox, newest first. */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as ContactMessage[];
}

export async function getRecentBookings(limit = 50) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("bookings")
    .select("*, profile:profiles(first_name, last_name, email), bay:simulator_bays(name)")
    .order("starts_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<
    Booking & {
      profile: Pick<Profile, "first_name" | "last_name" | "email"> | null;
      bay: { name: string } | null;
    }
  >;
}

export async function getCustomers(search: string | undefined, limit = 50) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  const { data } = await query;
  return (data ?? []) as Profile[];
}

export async function getInquiries(): Promise<PrivateEventInquiry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("private_event_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as PrivateEventInquiry[];
}
