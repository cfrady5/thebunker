import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import type { PricingRule } from "@/types";

export const metadata: Metadata = { title: "Pricing" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminPricingPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("pricing_rules")
        .select("*")
        .order("priority", { ascending: false })
    : { data: [] };
  const rules = (data ?? []) as PricingRule[];

  return (
    <div>
      <AdminPageHeader
        title="Pricing Rules"
        description="Highest-priority matching rule wins. Rates are per billing unit, per bay. Rule editing lands with the launch checklist; adjust values in the database until then."
      />
      {rules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No pricing rules configured — run the seed script to load the planned
          rates.
        </p>
      ) : (
        <DataTable
          headers={["Rule", "Applies", "Rate", "Unit", "Priority", "Status"]}
        >
          {rules.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-charcoal">{r.name}</td>
              <td className="px-4 py-3">
                {r.day_of_week !== null ? DAYS[r.day_of_week] : "Every day"}
                {r.starts_at && r.ends_at
                  ? ` · ${r.starts_at.slice(0, 5)}–${r.ends_at.slice(0, 5)}`
                  : " · all day"}
              </td>
              <td className="px-4 py-3">{formatCents(r.price_per_unit_cents)}</td>
              <td className="px-4 py-3">{r.billing_unit_minutes} min</td>
              <td className="px-4 py-3">{r.priority}</td>
              <td className="px-4 py-3">
                <Badge variant={r.active ? "success" : "outline"}>
                  {r.active ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
