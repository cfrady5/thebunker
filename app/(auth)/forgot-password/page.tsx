import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Request a password reset link for your Bunker account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-primary">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send a link to reset it.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-gold-dark">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
