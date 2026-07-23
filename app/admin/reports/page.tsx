import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";
import { facilityDateKey } from "@/lib/dates";
import type { Booking } from "@/types";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const supabase = await createSupabaseServerClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [bookingsRes, giftRes, customersRes] = supabase
    ? await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .gte("starts_at", thirtyDaysAgo)
          .order("starts_at"),
        supabase
          .from("gift_cards")
          .select("remaining_balance_cents, status"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
      ])
    : [{ data: [] }, { data: [] }, { count: 0 }];

  const bookings = (bookingsRes.data ?? []) as Booking[];
  const paidStatuses = ["confirmed", "checked_in", "completed"];
  const paid = bookings.filter((b) => paidStatuses.includes(b.status));
  const revenue = paid.reduce((sum, b) => sum + b.total_cents, 0);
  const noShows = bookings.filter((b) => b.status === "no_show").length;
  const refunds = bookings.filter((b) =>
    ["refunded", "partially_refunded"].includes(b.status),
  ).length;
  const avgDuration =
    paid.length > 0
      ? Math.round(
          paid.reduce(
            (sum, b) =>
              sum +
              (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60_000,
            0,
          ) / paid.length,
        )
      : 0;
  const giftLiability = ((giftRes.data ?? []) as Array<{ remaining_balance_cents: number; status: string }>)
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + g.remaining_balance_cents, 0);

  // Daily revenue for the table
  const byDay = new Map<string, { count: number; cents: number }>();
  for (const b of paid) {
    const key = facilityDateKey(b.starts_at);
    const entry = byDay.get(key) ?? { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += b.total_cents;
    byDay.set(key, entry);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Rolling 30-day performance. Export raw data for deeper analysis."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/api/admin/export/bookings">
              <Download aria-hidden /> Export Bookings CSV
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="30-day revenue" value={formatCents(revenue)} />
        <MetricCard label="Paid bookings" value={String(paid.length)} />
        <MetricCard label="Avg session" value={`${avgDuration} min`} />
        <MetricCard label="Total customers" value={String(customersRes.count ?? 0)} />
        <MetricCard
          label="No-shows"
          value={String(noShows)}
          tone={noShows > 0 ? "warning" : "default"}
        />
        <MetricCard label="Refunded bookings" value={String(refunds)} />
        <MetricCard label="Gift card liability" value={formatCents(giftLiability)} />
        <MetricCard
          label="Avg booking value"
          value={paid.length > 0 ? formatCents(Math.round(revenue / paid.length)) : "$0"}
        />
      </div>

      <h2 className="mb-3 mt-8 font-serif text-xl font-semibold text-primary">
        Daily revenue
      </h2>
      {days.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No paid bookings in the last 30 days.
        </p>
      ) : (
        <DataTable headers={["Date", "Bookings", "Revenue"]}>
          {days.map(([date, entry]) => (
            <tr key={date}>
              <td className="px-4 py-3 font-medium text-charcoal">{date}</td>
              <td className="px-4 py-3">{entry.count}</td>
              <td className="px-4 py-3">{formatCents(entry.cents)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
