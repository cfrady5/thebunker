import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import type { Booking } from "@/types";

/**
 * Stripe webhook — the single source of truth for payment state.
 * Bookings are never marked paid from client-side redirects.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;

      const { data: bookingRow } = await admin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      if (!bookingRow) break;
      const booking = bookingRow as Booking;

      // Idempotent: skip if already confirmed.
      if (booking.status !== "payment_pending") break;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await admin
        .from("bookings")
        .update({ status: "confirmed", stripe_payment_intent_id: paymentIntentId })
        .eq("id", bookingId);

      await admin.from("payments").upsert(
        {
          profile_id: booking.profile_id,
          booking_id: booking.id,
          amount_cents: session.amount_total ?? booking.total_cents,
          currency: session.currency ?? "usd",
          status: "succeeded",
          payment_type: "booking",
          stripe_payment_intent_id: paymentIntentId,
        },
        { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true },
      );

      const email = booking.guest_email ?? session.customer_details?.email ?? null;
      let firstName = "there";
      if (booking.profile_id) {
        const { data: profile } = await admin
          .from("profiles")
          .select("first_name, email")
          .eq("id", booking.profile_id)
          .single();
        if (profile) {
          firstName = profile.first_name || firstName;
        }
      }
      const to = email ?? (await lookupProfileEmail(admin, booking.profile_id));
      if (to) {
        await sendEmail({
          to,
          subject: `Reservation confirmed — ${booking.booking_number}`,
          react: BookingConfirmationEmail({
            firstName,
            bookingNumber: booking.booking_number,
            startsAtIso: booking.starts_at,
            endsAtIso: booking.ends_at,
            playerCount: booking.player_count,
            totalCents: booking.total_cents,
            bookingId: booking.id,
          }),
        });
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;
      await admin
        .from("bookings")
        .update({ status: "expired" })
        .eq("id", bookingId)
        .eq("status", "payment_pending");
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const bookingId = intent.metadata?.booking_id;
      if (!bookingId) break;
      await admin.from("payments").upsert(
        {
          booking_id: bookingId,
          amount_cents: intent.amount ?? 0,
          currency: intent.currency ?? "usd",
          status: "failed",
          payment_type: "booking",
          stripe_payment_intent_id: intent.id,
        },
        { onConflict: "stripe_payment_intent_id" },
      );
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);
      if (!paymentIntentId) break;
      await admin
        .from("payments")
        .update({
          status: charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
        })
        .eq("stripe_payment_intent_id", paymentIntentId);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const status = mapSubscriptionStatus(sub.status);
      await admin
        .from("memberships")
        .update({
          status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await admin
        .from("memberships")
        .update({ status: "cancelled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    default:
      // Unhandled event types are acknowledged without action.
      break;
  }

  return NextResponse.json({ received: true });
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "incomplete" | "trialing" | "active" | "paused" | "past_due" | "cancelled" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "incomplete";
  }
}

async function lookupProfileEmail(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  profileId: string | null,
): Promise<string | null> {
  if (!profileId) return null;
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .single();
  return data?.email ?? null;
}
