import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { BookingStatusBadge } from "@/components/account/booking-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatFacility } from "@/lib/dates";
import { formatCents } from "@/lib/utils";
import type { Booking, Profile } from "@/types";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (!profileRow) notFound();
  const profile = profileRow as Profile;

  const [bookingsRes, creditsRes, membershipRes, waiversRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .eq("profile_id", id)
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase.from("account_credits").select("amount_cents").eq("profile_id", id),
    supabase
      .from("memberships")
      .select("status, plan:membership_plans(name)")
      .eq("profile_id", id)
      .maybeSingle(),
    supabase
      .from("waiver_signatures")
      .select("id")
      .eq("profile_id", id),
  ]);

  const bookings = (bookingsRes.data ?? []) as Booking[];
  const creditBalance = (creditsRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0,
  );
  const lifetimeCents = bookings
    .filter((b) => ["confirmed", "checked_in", "completed"].includes(b.status))
    .reduce((sum, b) => sum + b.total_cents, 0);
  const membership = membershipRes.data as
    | { status: string; plan: { name: string } | null }
    | null;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin/customers" className="hover:text-primary">
          Customers
        </Link>{" "}
        / <span className="text-charcoal">{profile.email}</span>
      </nav>

      <AdminPageHeader
        title={`${profile.first_name} ${profile.last_name}`.trim() || profile.email}
        description={`Customer since ${formatFacility(profile.created_at, "MMMM yyyy")}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lifetime bookings value" value={formatCents(lifetimeCents)} />
        <MetricCard label="Credit balance" value={formatCents(creditBalance)} />
        <MetricCard
          label="Membership"
          value={membership?.plan?.name ?? "None"}
          hint={membership ? membership.status : undefined}
        />
        <MetricCard
          label="Waivers on file"
          value={String((waiversRes.data ?? []).length)}
        />
      </div>

      <div className="mb-6 rounded-lg border border-border/40 bg-surface p-5">
        <h2 className="font-serif text-lg font-semibold text-primary">Contact</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium text-charcoal">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-0.5 font-medium text-charcoal">{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Marketing consent</dt>
            <dd className="mt-0.5 flex gap-2">
              <Badge variant={profile.marketing_email_consent ? "success" : "outline"}>
                Email {profile.marketing_email_consent ? "yes" : "no"}
              </Badge>
              <Badge variant={profile.marketing_sms_consent ? "success" : "outline"}>
                SMS {profile.marketing_sms_consent ? "yes" : "no"}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <h2 className="mb-3 font-serif text-xl font-semibold text-primary">
        Booking history
      </h2>
      {bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No bookings yet.
        </p>
      ) : (
        <DataTable headers={["When", "Booking", "Players", "Total", "Status"]}>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3">{formatDateTime(b.starts_at)}</td>
              <td className="px-4 py-3 font-mono text-xs">{b.booking_number}</td>
              <td className="px-4 py-3">{b.player_count}</td>
              <td className="px-4 py-3">{formatCents(b.total_cents)}</td>
              <td className="px-4 py-3">
                <BookingStatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
