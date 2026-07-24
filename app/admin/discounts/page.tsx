import type { Metadata } from "next";
import { getDiscountCodes, getDiscountRedemptions } from "@/features/admin/queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { DiscountCreateForm } from "@/components/admin/discount-create-form";
import { DiscountCodeActions } from "@/components/admin/discount-code-actions";
import { formatCents } from "@/lib/utils";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = { title: "Discounts" };

function staffName(s: { first_name: string; last_name: string } | null): string {
  if (!s) return "—";
  return `${s.first_name} ${s.last_name}`.trim() || "—";
}

export default async function AdminDiscountsPage() {
  const [codes, redemptions] = await Promise.all([
    getDiscountCodes(),
    getDiscountRedemptions(),
  ]);

  const byCode = new Map<string, typeof redemptions>();
  for (const r of redemptions) {
    const list = byCode.get(r.discount_code_id) ?? [];
    list.push(r);
    byCode.set(r.discount_code_id, list);
  }

  const now = Date.now();

  return (
    <div>
      <AdminPageHeader
        title="Discount Codes"
        description="Create promo codes and track every use — how many times and by which employee."
      />

      <DiscountCreateForm />

      {codes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No discount codes yet. Add your first one above.
        </p>
      ) : (
        <div className="space-y-4">
          {codes.map((c) => {
            const uses = byCode.get(c.id) ?? [];
            const expired = c.expires_at ? new Date(c.expires_at).getTime() < now : false;
            const limitReached =
              c.usage_limit != null && c.usage_count >= c.usage_limit;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-border/40 bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-lg font-semibold tracking-wide text-primary">
                        {c.code}
                      </span>
                      {!c.active ? (
                        <Badge variant="danger">Inactive</Badge>
                      ) : expired ? (
                        <Badge variant="warning">Expired</Badge>
                      ) : limitReached ? (
                        <Badge variant="warning">Limit reached</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-charcoal-muted">
                      {c.discount_type === "percentage"
                        ? `${c.value}% off`
                        : `${formatCents(c.value)} off`}
                      {" · "}
                      Used{" "}
                      <span className="font-semibold text-charcoal">
                        {c.usage_count}
                        {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                      </span>
                      {c.starts_at
                        ? ` · from ${formatFacility(c.starts_at, "MMM d, yyyy")}`
                        : ""}
                      {c.expires_at
                        ? ` · until ${formatFacility(c.expires_at, "MMM d, yyyy")}`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Created by {staffName(c.creator)} ·{" "}
                      {formatFacility(c.created_at, "MMM d, yyyy")}
                    </p>
                  </div>
                  <DiscountCodeActions id={c.id} active={c.active} />
                </div>

                {uses.length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">
                      Usage history ({uses.length})
                    </summary>
                    <ul className="mt-2 divide-y divide-border/40 rounded-md border border-border/40">
                      {uses.map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-charcoal">
                            {staffName(u.redeemer)}
                          </span>
                          <span className="text-charcoal-muted">
                            {u.note ? `${u.note} · ` : ""}
                            {formatFacility(u.created_at, "MMM d, yyyy · h:mm a")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
