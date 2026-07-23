import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

const FROM_FALLBACK = "The Bunker <onboarding@resend.dev>";

/**
 * Sends a transactional email via Resend. No-ops (with a server
 * log) when RESEND_API_KEY is not configured so flows never break
 * in development.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email skipped — RESEND_API_KEY unset] ${params.subject}`);
    return { sent: false, error: "not_configured" };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? FROM_FALLBACK,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    react: params.react,
    replyTo: params.replyTo,
  });

  if (error) {
    console.error("Resend send failed:", error.message);
    return { sent: false, error: error.message };
  }
  return { sent: true };
}
