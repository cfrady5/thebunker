import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = buildMetadata({
  title: "Create Account",
  description: "Create your Bunker account for faster booking and member benefits.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-primary">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Faster checkout, easy rescheduling, booking history and league
        registration — all in one place.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-gold-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
