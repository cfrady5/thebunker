"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type SignupInput,
} from "@/lib/validation/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/seo/metadata";

export interface AuthResult {
  ok: boolean;
  message: string;
}

async function rateLimitAuth(): Promise<AuthResult | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = checkRateLimit("auth", ip);
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many attempts. Please wait ${rate.retryAfterSeconds} seconds and try again.`,
    };
  }
  return null;
}

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  message: "Accounts aren't connected yet on this preview site. Please try again later.",
};

export async function signUp(raw: SignupInput): Promise<AuthResult> {
  const limited = await rateLimitAuth();
  if (limited) return limited;

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data } = parsed;
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${SITE_URL}/verify-email`,
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        marketing_email_consent: data.marketing_email_consent,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return {
        ok: false,
        message: "An account with that email already exists. Try signing in instead.",
      };
    }
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message:
      "Account created! Check your email for a verification link to finish setting up.",
  };
}

export async function signIn(raw: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const limited = await rateLimitAuth();
  if (limited) return limited;

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "Incorrect email or password." };
  }

  const next = raw.next && raw.next.startsWith("/") ? raw.next : "/account";
  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(raw: { email: string }): Promise<AuthResult> {
  const limited = await rateLimitAuth();
  if (limited) return limited;

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  // Same response whether or not the email exists (no enumeration).
  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function updatePassword(raw: {
  password: string;
  confirm: string;
}): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Check your new password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: "Password updated. You're all set!" };
}
