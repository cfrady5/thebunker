"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { contactSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
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

  const staffEmail = process.env.STAFF_NOTIFICATIONS_EMAIL;
  if (!staffEmail) {
    return {
      ok: false,
      message:
        "Messaging isn't connected yet on this preview site. Please email us directly.",
    };
  }

  const d = parsed.data;
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

  if (!sent.sent) {
    return { ok: false, message: "Something went wrong sending your message. Please try again." };
  }

  return { ok: true, message: "Message sent — we'll get back to you soon!" };
}
