"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { contactSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { ContactMessageEmail } from "@/emails/contact-message";

export interface ActionResult {
  ok: boolean;
  message: string;
}

type ContactInput = z.infer<typeof contactSchema>;

export async function submitContact(raw: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields and try again." };
  }
  if (parsed.data.company) {
    return { ok: true, message: "Message sent!" };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = checkRateLimit("contact", ip);
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many messages. Please try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const d = parsed.data;

  // Primary record: land the message in the staff inbox.
  const admin = createSupabaseAdminClient();
  let stored = false;
  if (admin) {
    const { error } = await admin.from("contact_messages").insert({
      name: d.name,
      email: d.email,
      subject: d.subject,
      message: d.message,
    });
    stored = !error;
    if (error) console.error("[contact] failed to store message", error);
  }

  // Best-effort email notification on top of the inbox.
  const staffEmail = process.env.STAFF_NOTIFICATIONS_EMAIL;
  let emailed = false;
  if (staffEmail) {
    const sent = await sendEmail({
      to: staffEmail,
      subject: `Website message: ${d.subject}`,
      react: ContactMessageEmail({
        name: d.name,
        email: d.email,
        subject: d.subject,
        message: d.message,
      }),
      replyTo: d.email,
    });
    emailed = sent.sent;
  }

  if (!stored && !emailed) {
    return {
      ok: false,
      message:
        "Messaging isn't connected yet on this preview site. Please email us directly.",
    };
  }

  return { ok: true, message: "Message sent — we'll get back to you soon!" };
}
