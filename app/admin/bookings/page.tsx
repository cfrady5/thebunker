import type { Metadata } from "next";
import { getRecentBookings } from "@/features/admin/queries";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { BookingStatusBadge } from "@/components/account/booking-status-badge";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import { formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const bookings = await getRecentBookings(75);

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Recent and upcoming reservations across all bays. Check in arrivals, handle no-shows and issue refunds."
      />
      {bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No bookings yet. They&apos;ll appear here the moment reservations start
          coming in.
        </p>
      ) : (
        <DataTable
          headers={["When", "Booking", "Customer", "Bay", "Total", "Status", ""]}
          caption="All bookings"
        >
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {formatDateTime(b.starts_at)}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{b.booking_number}</td>
              <td className="px-4 py-3">
                {b.profile
                  ? `${b.profile.first_name} ${b.profile.last_name}`.trim() ||
                    b.profile.email
                  : (b.guest_email ?? "Guest")}
              </td>
              <td className="px-4 py-3">{b.bay?.name ?? "—"}</td>
              <td className="px-4 py-3">{formatCents(b.total_cents)}</td>
              <td className="px-4 py-3">
                <BookingStatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <BookingRowActions
                  bookingId={b.id}
                  status={b.status}
                  canRefund={Boolean(b.stripe_payment_intent_id) && b.status === "confirmed"}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
