import type { Metadata } from "next";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getWaivers } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Waivers" };

export default async function AccountWaiversPage() {
  const user = (await getCurrentUser())!;
  const waivers = await getWaivers(user.profile.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">Waivers</h1>
      <p className="mt-1 text-sm text-charcoal-muted">
        Signed participation waivers for you and your household members.
      </p>

      <div className="mt-8">
        {waivers.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="No waivers signed yet"
            description="You'll sign the participation waiver before your first session — online or at the front desk."
            action={
              <Button asChild variant="outline">
                <Link href="/policies/waiver">Read the Waiver</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {waivers.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/40 bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {w.template?.name ?? "Participation Waiver"}
                    {w.template ? ` (v${w.template.version})` : ""}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {w.household_member
                      ? `For ${w.household_member.first_name} ${w.household_member.last_name} · `
                      : ""}
                    Signed by {w.signed_name} · {formatDateTime(w.signed_at)}
                  </p>
                </div>
                <Badge variant="success">Signed</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
