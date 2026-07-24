// Domain types shared across the application.
// Database rows use cents for money and ISO strings for timestamps.

export type BusinessMode =
  | "pre_opening"
  | "reservations_open"
  | "fully_operational"
  | "temporarily_closed";

export type BookingStatus =
  | "draft"
  | "held"
  | "payment_pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled_by_customer"
  | "cancelled_by_staff"
  | "no_show"
  | "refunded"
  | "partially_refunded"
  | "expired";

export type StaffRole =
  | "owner"
  | "manager"
  | "front_desk"
  | "instructor"
  | "kitchen"
  | "marketing";

export type LeagueStatus =
  | "interest"
  | "opening_soon"
  | "open"
  | "waitlist"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Profile {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  handedness: "left" | "right" | "either" | null;
  skill_level: string | null;
  accessibility_notes: string | null;
  marketing_email_consent: boolean;
  marketing_sms_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulatorBay {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  capacity: number;
  active: boolean;
  accessible: boolean;
  supports_left_handed: boolean;
  sort_order: number;
  maintenance_status: "operational" | "degraded" | "offline";
}

export interface BusinessHoursRow {
  id: string;
  day_of_week: number;
  opens_at: string; // "HH:MM:SS"
  closes_at: string;
  active: boolean;
  effective_from: string | null;
  effective_to: string | null;
}

export interface SpecialHoursRow {
  id: string;
  date: string; // YYYY-MM-DD
  opens_at: string | null;
  closes_at: string | null;
  closed: boolean;
  reason: string | null;
}

export interface BayBlackout {
  id: string;
  bay_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  blackout_type: string;
}

export interface PricingRule {
  id: string;
  name: string;
  service_type: "bay_rental" | "lesson" | "league" | "event";
  day_of_week: number | null;
  starts_at: string | null; // "HH:MM"
  ends_at: string | null;
  price_per_unit_cents: number;
  billing_unit_minutes: number;
  membership_plan_id: string | null;
  effective_from: string | null;
  effective_to: string | null;
  priority: number;
  active: boolean;
}

export interface Booking {
  id: string;
  booking_number: string;
  profile_id: string | null;
  guest_email: string | null;
  bay_id: string;
  booking_type: string;
  starts_at: string;
  ends_at: string;
  player_count: number;
  status: BookingStatus;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  credit_applied_cents: number;
  total_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  square_order_id: string | null;
  square_payment_id: string | null;
  notes: string | null;
  first_time_guest: boolean;
  club_rental_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingHold {
  id: string;
  profile_id: string | null;
  session_token: string;
  bay_id: string;
  starts_at: string;
  ends_at: string;
  expires_at: string;
  status: "active" | "converted" | "expired" | "released";
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  billing_interval: "month" | "year";
  price_cents: number;
  stripe_price_id: string | null;
  included_minutes: number;
  rollover_rule: "none" | "one_period" | "unlimited";
  booking_window_days: number;
  discount_percentage: number;
  household_eligible: boolean;
  sort_order: number;
  active: boolean;
}

export interface Membership {
  id: string;
  profile_id: string;
  household_id: string | null;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "incomplete" | "trialing" | "active" | "paused" | "past_due" | "cancelled";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  included_minutes_remaining: number;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  season: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  day_of_week: number | null;
  start_time: string | null;
  capacity: number | null;
  team_size: number;
  price_cents: number;
  status: LeagueStatus;
  rules: string | null;
  featured_image_url: string | null;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  instructor_id: string | null;
  age_min: number | null;
  age_max: number | null;
  skill_level: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  price_cents: number;
  duration_minutes: number | null;
  what_to_bring: string | null;
  status: LeagueStatus;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string;
  capacity: number | null;
  price_cents: number | null;
  registration_required: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  image_url: string | null;
  featured: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  dietary_labels: string[];
  allergen_notes: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
}

export interface OpeningUpdate {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string | null;
  status: "draft" | "published" | "archived";
}

export interface PrivateEventInquiry {
  id: string;
  contact_name: string;
  organization: string | null;
  email: string;
  phone: string | null;
  event_type: string;
  preferred_date: string | null;
  alternate_date: string | null;
  preferred_time: string | null;
  guest_count: number | null;
  bay_count: number | null;
  food_and_drink_needs: string | null;
  budget_range: string | null;
  accessibility_needs: string | null;
  notes: string | null;
  status: string;
  follow_up_at: string | null;
  created_at: string;
}

export type ContactMessageStatus = "new" | "read" | "archived";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  handled_by: string | null;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  value: number; // percent (1-100) or cents
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface DiscountRedemption {
  id: string;
  discount_code_id: string;
  redeemed_by: string | null;
  booking_id: string | null;
  note: string | null;
  created_at: string;
}

export interface GiftCard {
  id: string;
  code_last4: string;
  recipient_name: string | null;
  recipient_email: string | null;
  original_balance_cents: number;
  remaining_balance_cents: number;
  status: "pending_payment" | "active" | "depleted" | "disabled";
  delivery_date: string | null;
  personal_message: string | null;
  created_at: string;
  assigned_profile_id?: string | null;
  issued_by?: string | null;
  square_payment_id?: string | null;
}

export interface SiteFacility {
  name: string;
  city: string;
  state: string;
  address_line1: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
}

export interface BookingRules {
  min_duration_minutes: number;
  max_duration_minutes: number;
  slot_interval_minutes: number;
  buffer_minutes: number;
  advance_window_days: number;
  same_day_cutoff_minutes: number;
  hold_minutes: number;
  cancellation_window_hours: number;
  tax_rate: number;
}

export interface SiteSettings {
  business_mode: BusinessMode;
  opening_label: string;
  facility: SiteFacility;
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
  };
  simulator: {
    brand: string | null;
    bay_count: number;
    course_count: number | null;
    max_players_per_bay: number;
    club_rentals_available: boolean;
    left_handed_support: boolean;
    accessibility_notes: string | null;
  };
  booking_rules: BookingRules;
  social: { facebook: string | null; instagram: string | null };
}
