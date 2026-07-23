"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  emailField,
  interestSchema,
  type InterestInput,
} from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/send";
import { OpeningListEmail } from "@/emails/opening-list";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const emailOnlySchema = z.object({
  email: emailField,
  company: z.string().max(200).optional(), // honeypot
});

/**
 * Frictionless homepage signup: email only. Signing up for the
 * opening list is itself the consent action (the form copy says
 * exactly what will be sent), so email_consent is recorded true.
 */
export async function submitOpeningEmail(raw: {
  email: string;
  company?: string;
}): Promise<ActionResult> {
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (parsed.data.company) {
    return { ok: true, message: "You're on the list." };
  }

  const ip = await clientIp();
  const rate = checkRateLimit("interest", ip);
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many attempts. Please try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Signups aren't connected yet on this preview site. Please try again later.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const { error } = await supabase.from("interest_submissions").upsert(
    {
      first_name: "",
      last_name: "",
      email,
      interests: ["Opening announcements"],
      email_consent: true,
      sms_consent: false,
      source: "homepage",
    },
    { onConflict: "email", ignoreDuplicates: true },
  );

  if (error) {
    console.error("opening email upsert failed:", error.message);
    return {
      ok: false,
      message: "Something went wrong saving your signup. Please try again.",
    };
  }

  await sendEmail({
    to: email,
    subject: "You're on The Bunker's opening list",
    react: OpeningListEmail({ firstName: "there" }),
  });

  return {
    ok: true,
    message: "You're on the list. We'll keep you updated as opening day gets closer.",
  };
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Opening-list signup. Validates, rate-limits, upserts by email so
 * repeat submissions update interests instead of erroring.
 */
export async function submitInterest(raw: InterestInput): Promise<ActionResult> {
  const parsed = interestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields and try again." };
  }
  // Honeypot filled → silently accept without storing.
  if (raw.company && raw.company.length > 0) {
    return { ok: true, message: "You're on the list!" };
  }

  const ip = await clientIp();
  const rate = checkRateLimit("interest", ip);
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many attempts. Please try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Signups aren't connected yet on this preview site. Please try again later.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase.from("interest_submissions").upsert(
    {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      interests: data.interests,
      email_consent: data.email_consent,
      sms_consent: data.sms_consent,
      source: "website",
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("interest_submissions upsert failed:", error.message);
    return { ok: false, message: "Something went wrong saving your signup. Please try again." };
  }

  await sendEmail({
    to: data.email,
    subject: "You're on The Bunker's opening list",
    react: OpeningListEmail({ firstName: data.first_name }),
  });

  return {
    ok: true,
    message: "You're on the list! We'll email you as opening news drops.",
  };
}
