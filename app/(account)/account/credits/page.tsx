import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getCreditBalance, getCreditHistory } from "@/features/account/queries";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";
import { formatCents, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Account Credits" };

export default async function AccountCreditsPage() {
  const user = (await getCurrentUser())!;
  const [balance, history] = await Promise.all([
    getCreditBalance(user.profile.id),
    getCreditHistory(user.profile.id),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-display-sm font-semibold text-primary">
        Account Credits
      </h1>

      <div className="mt-6 rounded-lg bg-primary p-6 text-cream">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">
          Available balance
        </p>
        <p className="mt-1 font-serif text-4xl font-semibold">{formatCents(balance)}</p>
        <p className="mt-2 text-sm text-cream/75">
          Credits apply automatically the next time you check out.
        </p>
      </div>

      <h2 className="mt-8 font-serif text-xl font-semibold text-primary">History</h2>
      <div className="mt-3">
        {history.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No credit activity yet"
            description="Refund credits, promotions and gift-card redemptions appear here."
          />
        ) : (
          <ul className="divide-y divide-border/40 rounded-lg border border-border/40 bg-surface">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-charcoal">
                    {entry.description ??
                      `${entry.credit_type.charAt(0).toUpperCase()}${entry.credit_type.slice(1)} credit`}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {formatDateTime(entry.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    entry.amount_cents >= 0 ? "text-success" : "text-charcoal",
                  )}
                >
                  {entry.amount_cents >= 0 ? "+" : ""}
                  {formatCents(entry.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
