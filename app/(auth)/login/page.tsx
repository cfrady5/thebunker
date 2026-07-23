import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to your Bunker account.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-primary">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to manage reservations, memberships and registrations.
      </p>
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-muted">
        New to The Bunker?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:text-gold-dark">
          Create an account
        </Link>
      </p>
    </div>
  );
}
