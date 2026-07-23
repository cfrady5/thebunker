import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getPayments } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

export default async function AccountPaymentsPage() {
  const user = (await getCurrentUser())!;
  const payments = await getPayments(user.profile.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">Payments</h1>
      <p className="mt-1 text-sm text-charcoal-muted">
        Your payment history. Card details are handled securely by Stripe and never
        stored at The Bunker.
      </p>

      <div className="mt-8">
        {payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Payments appear here once you've booked a session or registered for a program."
          />
        ) : (
          <ul className="divide-y divide-border/40 rounded-lg border border-border/40 bg-surface">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium capitalize text-charcoal">
                    {p.payment_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {formatDateTime(p.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      p.status === "succeeded"
                        ? "success"
                        : p.status === "failed"
                          ? "danger"
                          : "outline"
                    }
                  >
                    {p.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="font-semibold text-charcoal">
                    {formatCents(p.amount_cents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
