import { NextResponse } from "next/server";
import { verifySquareSignatureAny, type SquarePayment } from "@/lib/square/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { SITE_URL } from "@/lib/seo/metadata";
import type { Booking } from "@/types";

/**
 * Square webhook — the source of truth for payment state.
 * Subscribe this endpoint to payment.updated and refund.updated
 * in the Square developer dashboard.
 */
export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-square-hmacsha256-signature");

  // Square signs with the exact Notification URL on the subscription.
  // Try the configured site URL, an explicit override, and the URL
  // Square actually called (reconstructed from proxy headers) so a
  // differing Vercel alias or trailing slash can't silently 401.
  const reqUrl = new URL(request.url);
  const fwdHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    reqUrl.host;
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "https";
  const candidateUrls = Array.from(
    new Set(
      [
        process.env.SQUARE_WEBHOOK_URL,
        `${SITE_URL}/api/webhooks/square`,
        `${fwdProto}://${fwdHost}${reqUrl.pathname}`,
      ].filter((u): u is string => Boolean(u)),
    ),
  );

  const matchedUrl = verifySquareSignatureAny({
    rawBody,
    signatureHeader,
    signatureKey,
    candidateUrls,
  });
  if (!matchedUrl) {
    console.warn(
      "[square-webhook] signature mismatch — verify SQUARE_WEBHOOK_SIGNATURE_KEY " +
        "matches this sandbox/production subscription, and its Notification URL " +
        "is one of these. Tried:",
      candidateUrls.join(" | "),
      "| signature header present:",
      Boolean(signatureHeader),
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  switch (event.type) {
    case "payment.created":
    case "payment.updated": {
      const payment = event.data?.object?.payment as SquarePayment | undefined;
      if (!payment?.order_id) break;

      if (payment.status === "COMPLETED") {
        const { data: bookingRow } = await admin
          .from("bookings")
          .select("*")
          .eq("square_order_id", payment.order_id)
          .single();
        if (!bookingRow) break;
        const booking = bookingRow as Booking;

        // Idempotent: only transition out of payment_pending once.
        if (booking.status !== "payment_pending") break;

        await admin
          .from("bookings")
          .update({ status: "confirmed", square_payment_id: payment.id })
          .eq("id", booking.id);

        await admin.from("payments").upsert(
          {
            profile_id: booking.profile_id,
            booking_id: booking.id,
            amount_cents: payment.amount_money?.amount ?? booking.total_cents,
            currency: "usd",
            status: "succeeded",
            payment_type: "booking",
            square_payment_id: payment.id,
          },
          { onConflict: "square_payment_id", ignoreDuplicates: true },
        );

        let firstName = "there";
        let email = booking.guest_email ?? payment.buyer_email_address ?? null;
        if (booking.profile_id) {
          const { data: profile } = await admin
            .from("profiles")
            .select("first_name, email")
            .eq("id", booking.profile_id)
            .single();
          if (profile) {
            firstName = profile.first_name || firstName;
            email = email ?? profile.email;
          }
        }
        if (email) {
          await sendEmail({
            to: email,
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
      } else if (payment.status === "FAILED" || payment.status === "CANCELED") {
        await admin.from("payments").upsert(
          {
            amount_cents: payment.amount_money?.amount ?? 0,
            currency: "usd",
            status: "failed",
            payment_type: "booking",
            square_payment_id: payment.id,
          },
          { onConflict: "square_payment_id" },
        );
      }
      break;
    }

    case "refund.created":
    case "refund.updated": {
      const refund = event.data?.object?.refund as
        | {
            id: string;
            status: string;
            payment_id?: string;
            amount_money?: { amount: number };
          }
        | undefined;
      if (!refund?.payment_id || refund.status !== "COMPLETED") break;

      const { data: paymentRow } = await admin
        .from("payments")
        .select("id, amount_cents")
        .eq("square_payment_id", refund.payment_id)
        .maybeSingle();
      if (paymentRow) {
        const full = (refund.amount_money?.amount ?? 0) >= paymentRow.amount_cents;
        await admin
          .from("payments")
          .update({ status: full ? "refunded" : "partially_refunded" })
          .eq("id", paymentRow.id);
      }

      // Reflect the refund on the booking when staff refunded via
      // the Square Dashboard directly (site-initiated refunds set
      // this already).
      const { data: bookingRow } = await admin
        .from("bookings")
        .select("id, status, total_cents")
        .eq("square_payment_id", refund.payment_id)
        .maybeSingle();
      if (bookingRow && ["confirmed", "checked_in"].includes(bookingRow.status)) {
        const full = (refund.amount_money?.amount ?? 0) >= bookingRow.total_cents;
        await admin
          .from("bookings")
          .update({ status: full ? "refunded" : "partially_refunded" })
          .eq("id", bookingRow.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
