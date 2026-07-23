"use server";

import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { getCurrentUser } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { createHoldSchema, bookingDetailsSchema } from "@/lib/validation/schemas";
import { resolvePricingRule, computeQuote } from "@/lib/pricing/engine";
import { assessCancellation } from "@/lib/bookings/cancellation";
import { facilityDayOfWeek, facilityDateKey, formatFacility } from "@/lib/dates";
import { SITE_URL } from "@/lib/seo/metadata";
import type { Booking, BookingHold, PricingRule } from "@/types";

const HOLD_COOKIE = "bunker_checkout_token";

async function getCheckoutToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(HOLD_COOKIE)?.value;
  if (existing && /^[a-f0-9]{48}$/.test(existing)) return existing;
  const token = randomBytes(24).toString("hex");
  store.set(HOLD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  return token;
}

export interface HoldResult {
  ok: boolean;
  message: string;
  hold?: {
    id: string;
    expiresAtIso: string;
    startsAtIso: string;
    endsAtIso: string;
    bayId: string;
  };
}

/**
 * Places a temporary hold on a slot during checkout. Backed by the
 * create_booking_hold RPC, which is concurrency-safe (advisory lock
 * + exclusion constraints).
 */
export async function createHold(raw: {
  bay_id: string;
  starts_at: string;
  duration_minutes: number;
}): Promise<HoldResult> {
  const parsed = createHoldSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Invalid slot selection." };
  }

  const settings = await getSiteSettings();
  if (!bookingIsOpen(settings.business_mode)) {
    return { ok: false, message: "Reservations aren't open yet." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = checkRateLimit("hold", ip);
  if (!rate.allowed) {
    return { ok: false, message: "Too many attempts — please slow down a moment." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "The booking system isn't connected yet." };
  }

  const token = await getCheckoutToken();
  const startsAt = new Date(parsed.data.starts_at);
  const endsAt = new Date(startsAt.getTime() + parsed.data.duration_minutes * 60_000);

  const { data, error } = await supabase.rpc("create_booking_hold", {
    p_bay_id: parsed.data.bay_id,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_session_token: token,
    p_hold_minutes: settings.booking_rules.hold_minutes,
  });

  if (error || !data) {
    if (error?.message.includes("SLOT_UNAVAILABLE")) {
      return {
        ok: false,
        message: "That time was just taken. Please pick another opening.",
      };
    }
    console.error("create_booking_hold failed:", error?.message);
    return { ok: false, message: "We couldn't hold that time. Please try again." };
  }

  const hold = data as BookingHold;
  return {
    ok: true,
    message: "Time held",
    hold: {
      id: hold.id,
      expiresAtIso: hold.expires_at,
      startsAtIso: hold.starts_at,
      endsAtIso: hold.ends_at,
      bayId: hold.bay_id,
    },
  };
}

export interface CheckoutResult {
  ok: boolean;
  message: string;
  /** Stripe Checkout URL to redirect to. */
  checkoutUrl?: string;
  bookingId?: string;
  /** True when the booking was fully covered by credit (no Stripe). */
  paid?: boolean;
}

/**
 * Converts an active hold into a payment_pending booking and starts
 * Stripe Checkout. The booking is only confirmed by the webhook.
 */
export async function startCheckout(raw: {
  hold_id: string;
  details: {
    player_count: number;
    skill_level?: "new" | "beginner" | "intermediate" | "advanced";
    bringing_clubs: boolean;
    club_rental_required: boolean;
    first_time: boolean;
    accessibility_needs?: string;
    notes?: string;
  };
  guest_email?: string;
}): Promise<CheckoutResult> {
  const details = bookingDetailsSchema.safeParse(raw.details);
  if (!details.success) {
    return { ok: false, message: "Please check your session details." };
  }

  const settings = await getSiteSettings();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, message: "The booking system isn't connected yet." };
  }

  const user = await getCurrentUser();
  const guestEmail = raw.guest_email?.trim().toLowerCase() || null;
  if (!user && !guestEmail) {
    return { ok: false, message: "Sign in or provide an email to continue." };
  }

  const token = await getCheckoutToken();

  // Load the hold to price it server-side (never trust client totals).
  const { data: holdRow } = await admin
    .from("booking_holds")
    .select("*")
    .eq("id", raw.hold_id)
    .eq("session_token", token)
    .eq("status", "active")
    .single();

  if (!holdRow) {
    return {
      ok: false,
      message: "Your hold expired. Please reselect a time.",
    };
  }
  const hold = holdRow as BookingHold;
  if (new Date(hold.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "Your hold expired. Please reselect a time." };
  }

  const durationMinutes = Math.round(
    (new Date(hold.ends_at).getTime() - new Date(hold.starts_at).getTime()) / 60_000,
  );

  const { data: rulesData } = await admin
    .from("pricing_rules")
    .select("*")
    .eq("active", true);
  const date = facilityDateKey(hold.starts_at);
  const rule = resolvePricingRule((rulesData ?? []) as PricingRule[], {
    dayOfWeek: facilityDayOfWeek(date),
    startTime: formatFacility(hold.starts_at, "HH:mm"),
    date,
    serviceType: "bay_rental",
  });
  if (!rule) {
    return { ok: false, message: "Pricing isn't configured for that time." };
  }

  const quote = computeQuote({
    rule,
    durationMinutes,
    taxRate: settings.booking_rules.tax_rate,
  });

  // Convert hold → payment_pending booking (transactional RPC).
  const { data: bookingData, error: convertError } = await admin.rpc(
    "convert_hold_to_booking",
    {
      p_hold_id: hold.id,
      p_session_token: token,
      p_profile_id: user?.profile.id ?? null,
      p_guest_email: user ? null : guestEmail,
      p_booking_type: "bay_rental",
      p_player_count: details.data.player_count,
      p_subtotal_cents: quote.subtotalCents,
      p_tax_cents: quote.taxCents,
      p_discount_cents: quote.discountCents,
      p_credit_applied_cents: quote.creditAppliedCents,
      p_total_cents: quote.totalCents,
      p_notes:
        [
          details.data.notes,
          details.data.accessibility_needs
            ? `Accessibility: ${details.data.accessibility_needs}`
            : null,
          details.data.skill_level ? `Skill: ${details.data.skill_level}` : null,
        ]
          .filter(Boolean)
          .join(" | ") || null,
      p_first_time_guest: details.data.first_time,
      p_club_rental_required: details.data.club_rental_required,
    },
  );

  if (convertError || !bookingData) {
    if (convertError?.message.includes("HOLD_EXPIRED")) {
      return { ok: false, message: "Your hold expired. Please reselect a time." };
    }
    console.error("convert_hold_to_booking failed:", convertError?.message);
    return { ok: false, message: "We couldn't create your reservation. Please try again." };
  }
  const booking = bookingData as Booking;

  const stripe = getStripe();
  if (!stripe) {
    // Payments unconfigured (preview environments): keep the booking
    // payment_pending and tell the customer clearly.
    return {
      ok: false,
      bookingId: booking.id,
      message:
        "Online payment isn't connected on this preview site, so the reservation wasn't completed.",
    };
  }

  const customerEmail = user?.profile.email ?? guestEmail ?? undefined;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: booking.total_cents,
          product_data: {
            name: `Simulator bay — ${formatFacility(booking.starts_at, "EEE, MMM d 'at' h:mm a")}`,
            description: `${durationMinutes} minutes · up to ${details.data.player_count} players · Booking ${booking.booking_number}`,
          },
        },
      },
    ],
    metadata: { booking_id: booking.id, booking_number: booking.booking_number },
    payment_intent_data: {
      metadata: { booking_id: booking.id, booking_number: booking.booking_number },
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${SITE_URL}/book/confirmation/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/book?cancelled=1`,
  });

  await admin
    .from("bookings")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", booking.id);

  return {
    ok: true,
    message: "Redirecting to secure payment…",
    checkoutUrl: session.url ?? undefined,
    bookingId: booking.id,
  };
}

export interface CancelResult {
  ok: boolean;
  message: string;
}

/** Customer-initiated cancellation, honoring the cancellation window. */
export async function cancelBooking(bookingId: string): Promise<CancelResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return { ok: false, message: "The booking system isn't connected yet." };
  }

  // RLS scopes this read to the caller's own bookings.
  const { data: bookingRow } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!bookingRow) return { ok: false, message: "Reservation not found." };
  const booking = bookingRow as Booking;

  if (booking.profile_id !== user.profile.id) {
    return { ok: false, message: "Reservation not found." };
  }
  if (!["confirmed", "payment_pending"].includes(booking.status)) {
    return { ok: false, message: "This reservation can no longer be cancelled online." };
  }

  const settings = await getSiteSettings();
  const assessment = assessCancellation({
    startsAt: new Date(booking.starts_at),
    now: new Date(),
    windowHours: settings.booking_rules.cancellation_window_hours,
    totalPaidCents: booking.total_cents,
  });

  const stripe = getStripe();
  let refunded = false;

  if (
    assessment.beforeDeadline &&
    booking.status === "confirmed" &&
    booking.stripe_payment_intent_id &&
    stripe
  ) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        reason: "requested_by_customer",
      });
      refunded = true;
    } catch (err) {
      console.error("Stripe refund failed:", err);
      return {
        ok: false,
        message:
          "We couldn't process the refund automatically. Please contact us and we'll sort it out.",
      };
    }
  }

  await admin
    .from("bookings")
    .update({ status: refunded ? "refunded" : "cancelled_by_customer" })
    .eq("id", booking.id);

  if (!assessment.beforeDeadline && booking.status === "confirmed") {
    // Inside the window: issue account credit instead of a card refund.
    await admin.from("account_credits").insert({
      profile_id: user.profile.id,
      amount_cents: assessment.creditEligibleCents,
      credit_type: "refund",
      booking_id: booking.id,
      description: `Credit for cancelled reservation ${booking.booking_number}`,
    });
    return {
      ok: true,
      message:
        "Reservation cancelled. Because it was inside the cancellation window, the amount was added to your account as credit.",
    };
  }

  return {
    ok: true,
    message: refunded
      ? "Reservation cancelled and refunded to your original payment method."
      : "Reservation cancelled.",
  };
}
