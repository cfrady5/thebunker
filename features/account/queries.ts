import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, GiftCard, Membership, MembershipPlan } from "@/types";

/**
 * Account-scoped queries. All run through the anon server client,
 * so RLS guarantees callers only ever see their own rows.
 */

export async function getUpcomingBookings(profileId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("profile_id", profileId)
    .in("status", ["confirmed", "payment_pending", "checked_in"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(10);
  return (data ?? []) as Booking[];
}

export async function getPastBookings(profileId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("profile_id", profileId)
    .lt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(25);
  return (data ?? []) as Booking[];
}

export async function getBookingById(
  profileId: string,
  bookingId: string,
): Promise<Booking | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("profile_id", profileId)
    .single();
  return (data as Booking) ?? null;
}

export interface MembershipWithPlan extends Membership {
  plan: MembershipPlan | null;
}

export async function getMembership(
  profileId: string,
): Promise<MembershipWithPlan | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("memberships")
    .select("*, plan:membership_plans(*)")
    .eq("profile_id", profileId)
    .in("status", ["trialing", "active", "paused", "past_due"])
    .maybeSingle();
  if (!data) return null;
  return data as unknown as MembershipWithPlan;
}

export async function getCreditBalance(profileId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("account_credits")
    .select("amount_cents")
    .eq("profile_id", profileId);
  return (data ?? []).reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
}

export interface CreditEntry {
  id: string;
  amount_cents: number;
  credit_type: string;
  description: string | null;
  created_at: string;
}

export async function getCreditHistory(profileId: string): Promise<CreditEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("account_credits")
    .select("id, amount_cents, credit_type, description, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as CreditEntry[];
}

export interface PaymentEntry {
  id: string;
  amount_cents: number;
  status: string;
  payment_type: string;
  created_at: string;
}

export async function getPayments(profileId: string): Promise<PaymentEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("id, amount_cents, status, payment_type, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as PaymentEntry[];
}

export async function getGiftCards(profileId: string): Promise<GiftCard[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gift_cards")
    .select(
      "id, code_last4, recipient_name, recipient_email, original_balance_cents, remaining_balance_cents, status, delivery_date, personal_message, created_at",
    )
    .or(`purchaser_profile_id.eq.${profileId},assigned_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as GiftCard[];
}

export interface LeagueRegistrationEntry {
  id: string;
  status: string;
  registration_type: string;
  created_at: string;
  league: { name: string; slug: string; season: string | null; status: string } | null;
}

export async function getLeagueRegistrations(
  profileId: string,
): Promise<LeagueRegistrationEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("league_registrations")
    .select("id, status, registration_type, created_at, league:leagues(name, slug, season, status)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as LeagueRegistrationEntry[];
}

export interface ProgramRegistrationEntry {
  id: string;
  status: string;
  created_at: string;
  program: { name: string; slug: string; category: string; status: string } | null;
  household_member: { first_name: string; last_name: string } | null;
}

export async function getProgramRegistrations(
  profileId: string,
): Promise<ProgramRegistrationEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("program_registrations")
    .select(
      "id, status, created_at, program:programs(name, slug, category, status), household_member:household_members(first_name, last_name)",
    )
    .or(`profile_id.eq.${profileId},guardian_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ProgramRegistrationEntry[];
}

export interface HouseholdData {
  id: string;
  name: string;
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    relationship: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  }>;
}

export async function getHousehold(profileId: string): Promise<HouseholdData | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: household } = await supabase
    .from("households")
    .select("id, name")
    .eq("owner_profile_id", profileId)
    .maybeSingle();
  if (!household) return null;

  const { data: members } = await supabase
    .from("household_members")
    .select(
      "id, first_name, last_name, date_of_birth, relationship, emergency_contact_name, emergency_contact_phone",
    )
    .eq("household_id", household.id)
    .order("created_at");

  return { id: household.id, name: household.name, members: members ?? [] };
}

export interface WaiverEntry {
  id: string;
  signed_name: string;
  signed_at: string;
  template: { name: string; version: number } | null;
  household_member: { first_name: string; last_name: string } | null;
}

export async function getWaivers(profileId: string): Promise<WaiverEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("waiver_signatures")
    .select(
      "id, signed_name, signed_at, template:waiver_templates(name, version), household_member:household_members(first_name, last_name)",
    )
    .or(`profile_id.eq.${profileId},guardian_profile_id.eq.${profileId}`)
    .order("signed_at", { ascending: false });
  return (data ?? []) as unknown as WaiverEntry[];
}

export interface NotificationEntry {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export async function getNotifications(profileId: string): Promise<NotificationEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, read_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as NotificationEntry[];
}
