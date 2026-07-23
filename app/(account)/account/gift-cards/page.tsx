import type { Metadata } from "next";
import Link from "next/link";
import { Gift } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getGiftCards } from "@/features/account/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Gift Cards" };

export default async function AccountGiftCardsPage() {
  const user = (await getCurrentUser())!;
  const cards = await getGiftCards(user.profile.id);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-display-sm font-semibold text-primary">
          Gift Cards
        </h1>
        <Button asChild variant="outline">
          <Link href="/gift-cards">Buy a Gift Card</Link>
        </Button>
      </div>
      <p className="mt-1 text-sm text-charcoal-muted">
        Gift cards you&apos;ve purchased. Recipients redeem at checkout with their
        card code.
      </p>

      <div className="mt-8">
        {cards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No gift cards purchased yet"
            description="A Bunker gift card covers bay time, lessons and food — a reliable favorite."
            action={
              <Button asChild>
                <Link href="/gift-cards">Give the Gift of Golf</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => (
              <li
                key={card.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/40 bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    Card ending in {card.code_last4}
                    {card.recipient_name ? ` — for ${card.recipient_name}` : ""}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {formatCents(card.remaining_balance_cents)} of{" "}
                    {formatCents(card.original_balance_cents)} remaining
                  </p>
                </div>
                <Badge
                  variant={
                    card.status === "active"
                      ? "success"
                      : card.status === "depleted"
                        ? "outline"
                        : "warning"
                  }
                >
                  {card.status.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
