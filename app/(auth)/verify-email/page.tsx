import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "Verify Your Email",
  description: "Email verification for your Bunker account.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <MailCheck aria-hidden className="mx-auto h-10 w-10 text-success" />
      <h1 className="mt-4 font-serif text-2xl font-semibold text-primary">
        You&apos;re verified!
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your email address is confirmed and your account is ready. Welcome to The
        Bunker.
      </p>
      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/account">Go to My Account</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
