import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDateLong } from "@/lib/dates";
import { formatCents, formatDuration } from "@/lib/utils";
import type { MembershipPlan } from "@/types";

export const metadata: Metadata = { title: "Memberships" };

interface MembershipRow {
  id: string;
  status: string;
  included_minutes_remaining: number;
  current_period_end: string | null;
  profile: { first_name: string; last_name: string; email: string } | null;
  plan: { name: string } | null;
}

export default async function AdminMembershipsPage() {
  const supabase = await createSupabaseServerClient();
  const [membersRes, plansRes] = supabase
    ? await Promise.all([
        supabase
          .from("memberships")
          .select(
            "id, status, included_minutes_remaining, current_period_end, profile:profiles(first_name, last_name, email), plan:membership_plans(name)",
          )
          .order("created_at", { ascending: false }),
        supabase.from("membership_plans").select("*").order("sort_order"),
      ])
    : [{ data: [] }, { data: [] }];

  const memberships = (membersRes.data ?? []) as unknown as MembershipRow[];
  const plans = (plansRes.data ?? []) as MembershipPlan[];
  const active = memberships.filter((m) => m.status === "active").length;
  const pastDue = memberships.filter((m) => m.status === "past_due").length;

  return (
    <div>
      <AdminPageHeader
        title="Memberships"
        description="Active members and available plans. Billing changes happen through Stripe; plan config lives in the database until the editor lands."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active members" value={String(active)} />
        <MetricCard
          label="Past due"
          value={String(pastDue)}
          tone={pastDue > 0 ? "danger" : "default"}
        />
        <MetricCard label="Plans offered" value={String(plans.length)} />
      </div>

      <h2 className="mb-3 font-serif text-xl font-semibold text-primary">Members</h2>
      {memberships.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No memberships yet — they appear here once members subscribe.
        </p>
      ) : (
        <DataTable headers={["Member", "Plan", "Minutes left", "Renews", "Status"]}>
          {memberships.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-charcoal">
                  {m.profile
                    ? `${m.profile.first_name} ${m.profile.last_name}`.trim()
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
              </td>
              <td className="px-4 py-3">{m.plan?.name ?? "—"}</td>
              <td className="px-4 py-3">
                {formatDuration(m.included_minutes_remaining)}
              </td>
              <td className="px-4 py-3">
                {m.current_period_end ? formatDateLong(m.current_period_end) : "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    m.status === "active"
                      ? "success"
                      : m.status === "past_due"
                        ? "danger"
                        : "outline"
                  }
                >
                  {m.status.replace(/_/g, " ")}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <h2 className="mb-3 mt-8 font-serif text-xl font-semibold text-primary">Plans</h2>
      <DataTable headers={["Plan", "Price", "Included time", "Window", "Discount", "Status"]}>
        {plans.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3 font-medium text-charcoal">{p.name}</td>
            <td className="px-4 py-3">
              {formatCents(p.price_cents)}/{p.billing_interval}
            </td>
            <td className="px-4 py-3">{formatDuration(p.included_minutes)}</td>
            <td className="px-4 py-3">{p.booking_window_days} days</td>
            <td className="px-4 py-3">{p.discount_percentage}%</td>
            <td className="px-4 py-3">
              <Badge variant={p.active ? "success" : "outline"}>
                {p.active ? "Active" : "Hidden"}
              </Badge>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
