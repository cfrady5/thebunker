import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Security" };

export default async function AccountSecurityPage() {
  const user = (await getCurrentUser())!;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-display-sm font-semibold text-primary">Security</h1>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-charcoal-muted">
            You&apos;re signed in as <strong>{user.profile.email}</strong>. Signing
            out ends your session on this device.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/logout">Sign Out</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-charcoal-muted">
            Deleting your account removes your profile, household and preferences.
            Records we&apos;re required to keep (payments, signed waivers) are
            retained per our{" "}
            <Link href="/policies/privacy" className="font-medium text-primary underline underline-offset-2">
              privacy policy
            </Link>
            . To protect your data, deletion requests are verified by our team.
          </p>
          <Button asChild variant="destructive" className="mt-4">
            <Link href="/contact?subject=Account deletion request">
              Request Account Deletion
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
