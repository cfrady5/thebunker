import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Discounts" };

interface DiscountRow {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
}

export default async function AdminDiscountsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("discount_codes").select("*").order("code")
    : { data: [] };
  const codes = (data ?? []) as DiscountRow[];

  return (
    <div>
      <AdminPageHeader
        title="Discount Codes"
        description="Promotional codes applied at checkout. Codes are validated server-side with per-IP rate limiting."
      />
      {codes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No discount codes yet. Create codes in the database (or extend this page
          with a creation form) when your first promotion is ready.
        </p>
      ) : (
        <DataTable headers={["Code", "Discount", "Used", "Window", "Status"]}>
          {codes.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-mono font-semibold text-charcoal">{c.code}</td>
              <td className="px-4 py-3">
                {c.discount_type === "percentage" ? `${c.value}%` : formatCents(c.value)}
              </td>
              <td className="px-4 py-3">
                {c.usage_count}
                {c.usage_limit ? ` / ${c.usage_limit}` : ""}
              </td>
              <td className="px-4 py-3 text-xs">
                {c.starts_at ? c.starts_at.slice(0, 10) : "now"} →{" "}
                {c.expires_at ? c.expires_at.slice(0, 10) : "no expiry"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={c.active ? "success" : "outline"}>
                  {c.active ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
