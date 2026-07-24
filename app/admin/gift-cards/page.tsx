import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { GiftCardIssuer } from "@/components/admin/gift-card-issuer";
import { GiftCardActions } from "@/components/admin/gift-card-actions";
import { formatFacility } from "@/lib/dates";
import { formatCents } from "@/lib/utils";
import type { GiftCard } from "@/types";

export const metadata: Metadata = { title: "Gift Cards" };

type Assigned = { first_name: string; last_name: string; email: string } | null;
type Row = GiftCard & { assigned: Assigned };

function assignedLabel(a: Assigned): string | null {
  if (!a) return null;
  const name = `${a.first_name} ${a.last_name}`.trim();
  return name || a.email || null;
}

export default async function AdminGiftCardsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("gift_cards")
        .select("*, assigned:profiles!assigned_profile_id(first_name, last_name, email)")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const cards = (data ?? []) as Row[];

  const liability = cards
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.remaining_balance_cents, 0);

  return (
    <div>
      <AdminPageHeader
        title="Gift Cards"
        description="Issue cards, assign them to customer accounts and take payment through Square. Outstanding balances are a liability — keep an eye on the total."
        actions={<GiftCardIssuer />}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Outstanding liability" value={formatCents(liability)} />
        <MetricCard
          label="Active cards"
          value={String(cards.filter((c) => c.status === "active").length)}
        />
        <MetricCard label="Total issued" value={String(cards.length)} />
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No gift cards yet. Use <span className="font-medium">Issue gift card</span> to
          create one and assign it to a customer.
        </p>
      ) : (
        <DataTable
          headers={["Card", "Assigned to", "Recipient", "Balance", "Issued", "Status", ""]}
        >
          {cards.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-mono text-xs">••••{c.code_last4}</td>
              <td className="px-4 py-3">
                {assignedLabel(c.assigned) ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </td>
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
                        : c.status === "pending_payment"
                          ? "warning"
                          : "danger"
                  }
                >
                  {c.status.replace(/_/g, " ")}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <GiftCardActions id={c.id} status={c.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
