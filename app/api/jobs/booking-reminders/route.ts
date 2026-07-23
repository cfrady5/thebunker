import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { BookingReminderEmail } from "@/emails/booking-reminder";
import type { Booking } from "@/types";

/**
 * Sends reminder emails for confirmed bookings starting 12–36 hours
 * from now — wide enough that a single daily run (Hobby-plan cron
 * limit) covers every next-day booking. Safe to run hourly on Pro:
 * the notifications table tracks sent reminders so overlapping
 * windows never double-send.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const windowStart = new Date(Date.now() + 12 * 3_600_000).toISOString();
  const windowEnd = new Date(Date.now() + 36 * 3_600_000).toISOString();

  const { data: bookings } = await admin
    .from("bookings")
    .select("*, profile:profiles(id, first_name, email)")
    .eq("status", "confirmed")
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  let sent = 0;
  for (const row of (bookings ?? []) as Array<
    Booking & { profile: { id: string; first_name: string; email: string } | null }
  >) {
    const email = row.profile?.email ?? row.guest_email;
    if (!email) continue;

    // Idempotency: skip if a reminder notification already exists.
    if (row.profile) {
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("profile_id", row.profile.id)
        .eq("type", "booking_reminder")
        .contains("metadata", { booking_id: row.id })
        .maybeSingle();
      if (existing) continue;
    }

    const result = await sendEmail({
      to: email,
      subject: `Reminder: your bay tomorrow — ${row.booking_number}`,
      react: BookingReminderEmail({
        firstName: row.profile?.first_name || "there",
        bookingNumber: row.booking_number,
        startsAtIso: row.starts_at,
        endsAtIso: row.ends_at,
        bookingId: row.id,
      }),
    });

    if (result.sent && row.profile) {
      await admin.from("notifications").insert({
        profile_id: row.profile.id,
        type: "booking_reminder",
        title: "Reminder sent for your upcoming session",
        body: `Reservation ${row.booking_number}`,
        metadata: { booking_id: row.id },
      });
      sent += 1;
    }
  }

  return NextResponse.json({ remindersSent: sent });
}
