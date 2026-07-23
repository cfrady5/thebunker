"use server";

import { headers } from "next/headers";
import {
  privateEventInquirySchema,
  type PrivateEventInquiryInput,
} from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { PrivateEventReceivedEmail } from "@/emails/private-event-received";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function submitPrivateEventInquiry(
  raw: PrivateEventInquiryInput,
): Promise<ActionResult> {
  const parsed = privateEventInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields and try again." };
  }
  if (parsed.data.company) {
    // Honeypot triggered — pretend success without storing.
    return { ok: true, message: "Thanks! We'll be in touch." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = checkRateLimit("private_event", ip);
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many submissions. Please try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Inquiries aren't connected yet on this preview site. Please email us directly.",
    };
  }

  const d = parsed.data;
  const { error } = await supabase.from("private_event_inquiries").insert({
    contact_name: d.contact_name,
    organization: d.organization || null,
    email: d.email.toLowerCase(),
    phone: d.phone || null,
    event_type: d.event_type,
    preferred_date: d.preferred_date || null,
    alternate_date: d.alternate_date || null,
    preferred_time: d.preferred_time || null,
    guest_count: d.guest_count ?? null,
    bay_count: d.bay_count ?? null,
    food_and_drink_needs: d.food_and_drink_needs || null,
    budget_range: d.budget_range || null,
    accessibility_needs: d.accessibility_needs || null,
    notes: d.notes || null,
    status: "new",
  });

  if (error) {
    console.error("private_event_inquiries insert failed:", error.message);
    return {
      ok: false,
      message: "Something went wrong sending your inquiry. Please try again.",
    };
  }

  await sendEmail({
    to: d.email,
    subject: "We received your event inquiry — The Bunker",
    react: PrivateEventReceivedEmail({
      contactName: d.contact_name,
      eventType: d.event_type,
      preferredDate: d.preferred_date || null,
    }),
  });

  const staffEmail = process.env.STAFF_NOTIFICATIONS_EMAIL;
  if (staffEmail) {
    await sendEmail({
      to: staffEmail,
      subject: `New private event inquiry: ${d.event_type} — ${d.contact_name}`,
      react: PrivateEventReceivedEmail({
        contactName: d.contact_name,
        eventType: d.event_type,
        preferredDate: d.preferred_date || null,
        staffCopy: true,
      }),
      replyTo: d.email,
    });
  }

  return {
    ok: true,
    message:
      "Thanks! Your inquiry is in — we'll reach out within two business days to start planning.",
  };
}
