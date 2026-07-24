import Link from "next/link";
import {
  CalendarPlus,
  CircleDollarSign,
  Gauge,
  MessageSquare,
  PartyPopper,
  TriangleAlert,
} from "lucide-react";
import { getAdminDashboard } from "@/features/admin/queries";
import { getSiteSettings } from "@/lib/settings";
import { AdminPageHeader, MetricCard, DataTable } from "@/components/admin/ui";
import { BookingStatusBadge } from "@/components/account/booking-status-badge";
import { BusinessModeSwitcher } from "@/components/admin/business-mode-switcher";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [data, settings] = await Promise.all([getAdminDashboard(), getSiteSettings()]);

  return (
    <div>
      <AdminPageHeader
        title="Today at The Bunker"
        description={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/calendar">
                <CalendarPlus aria-hidden /> Calendar
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/bookings">Manage Bookings</Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 rounded-lg border border-gold/40 bg-gold/5 p-4">
        <BusinessModeSwitcher current={settings.business_mode} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Today's reservations"
          value={String(data.todaysBookings.length)}
          icon={CalendarPlus}
        />
        <MetricCard
          label="Today's revenue"
          value={formatCents(data.todayRevenueCents)}
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Occupancy"
          value={`${data.occupancyPct}%`}
          hint="Booked ÷ open bay-hours"
          icon={Gauge}
        />
        <MetricCard
          label="New event inquiries"
          value={String(data.newInquiries)}
          icon={PartyPopper}
          tone={data.newInquiries > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="New messages"
          value={String(data.newMessages)}
          hint="Website contact form"
          icon={MessageSquare}
          tone={data.newMessages > 0 ? "warning" : "default"}
        />
      </div>

      {data.pendingPayments > 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning">
          <TriangleAlert aria-hidden className="h-4 w-4" />
          {data.pendingPayments} booking{data.pendingPayments === 1 ? "" : "s"} awaiting
          payment — these auto-expire after 30 minutes.
        </p>
      ) : null}

      <h2 className="mb-3 mt-8 font-serif text-xl font-semibold text-primary">
        Today&apos;s schedule
      </h2>
      {data.todaysBookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No reservations on the books today.
        </p>
      ) : (
        <DataTable headers={["Time", "Customer", "Players", "Total", "Status"]}>
          {data.todaysBookings.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {formatTime(b.starts_at)} – {formatTime(b.ends_at)}
              </td>
              <td className="px-4 py-3">
                {b.profile
                  ? `${b.profile.first_name} ${b.profile.last_name}`.trim() ||
                    b.profile.email
                  : (b.guest_email ?? b.notes ?? "Guest")}
              </td>
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
