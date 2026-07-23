import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatFacility } from "@/lib/dates";
import { formatCents } from "@/lib/utils";
import type { GiftCard } from "@/types";

export const metadata: Metadata = { title: "Gift Cards" };

export default async function AdminGiftCardsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const cards = (data ?? []) as GiftCard[];

  const liability = cards
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.remaining_balance_cents, 0);

  return (
    <div>
      <AdminPageHeader
        title="Gift Cards"
        description="Outstanding balances are a liability on the books — keep an eye on the total."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Outstanding liability" value={formatCents(liability)} />
        <MetricCard
          label="Active cards"
          value={String(cards.filter((c) => c.status === "active").length)}
        />
        <MetricCard label="Total sold" value={String(cards.length)} />
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No gift cards sold yet.
        </p>
      ) : (
        <DataTable headers={["Card", "Recipient", "Balance", "Purchased", "Status"]}>
          {cards.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-mono text-xs">••••{c.code_last4}</td>
              <td className="px-4 py-3">
                {c.recipient_name ?? "—"}
                {c.recipient_email ? (
                  <p className="text-xs text-muted-foreground">{c.recipient_email}</p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {formatCents(c.remaining_balance_cents)} /{" "}
                {formatCents(c.original_balance_cents)}
              </td>
              <td className="px-4 py-3">
                {formatFacility(c.created_at, "MMM d, yyyy")}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    c.status === "active"
                      ? "success"
                      : c.status === "depleted"
                        ? "outline"
                        : "warning"
                  }
                >
                  {c.status.replace(/_/g, " ")}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
