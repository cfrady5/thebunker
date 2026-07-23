import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = buildMetadata({
  title: "Choose a New Password",
  description: "Set a new password for your Bunker account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-primary">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        You&apos;re signed in through your reset link — set a new password below.
      </p>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
