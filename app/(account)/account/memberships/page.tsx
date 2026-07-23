import type { Metadata } from "next";
import Link from "next/link";
import { Medal } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getMembership } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateLong } from "@/lib/dates";
import { formatCents, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Membership" };

export default async function AccountMembershipPage() {
  const user = (await getCurrentUser())!;
  const membership = await getMembership(user.profile.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">
        Membership
      </h1>

      {!membership || !membership.plan ? (
        <div className="mt-8">
          <EmptyState
            icon={Medal}
            title="No membership yet"
            description="Members get included monthly bay time, earlier booking windows and discounts on everything else."
            action={
              <Button asChild>
                <Link href="/memberships">See Membership Plans</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl font-semibold text-primary">
                  {membership.plan.name}
                </h2>
                <Badge variant={membership.status === "active" ? "success" : "warning"}>
                  {membership.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="font-semibold text-charcoal">
                {formatCents(membership.plan.price_cents)}/
                {membership.plan.billing_interval}
              </p>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Included time remaining
                </dt>
                <dd className="mt-1 font-medium text-charcoal">
                  {formatDuration(membership.included_minutes_remaining)} of{" "}
                  {formatDuration(membership.plan.included_minutes)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {membership.cancel_at_period_end ? "Ends" : "Renews"}
                </dt>
                <dd className="mt-1 font-medium text-charcoal">
                  {membership.current_period_end
                    ? formatDateLong(membership.current_period_end)
                    : "—"}
                </dd>
              </div>
            </dl>

            {membership.status === "past_due" ? (
              <p className="mt-5 rounded-md bg-warning/10 p-3 text-sm text-warning">
                Your last payment didn&apos;t go through. Update your payment method
                below to keep your benefits active.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                {/* Stripe Customer Portal session is created server-side. */}
                <Link href="/api/billing-portal">Manage Billing</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact?subject=Membership question">Contact Us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
