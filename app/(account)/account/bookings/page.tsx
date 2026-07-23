import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { getPastBookings, getUpcomingBookings } from "@/features/account/queries";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { BookingStatusBadge } from "@/components/account/booking-status-badge";
import { formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "My Reservations" };

export default async function AccountBookingsPage() {
  const user = (await getCurrentUser())!;
  const [settings, upcoming, past] = await Promise.all([
    getSiteSettings(),
    getUpcomingBookings(user.profile.id),
    getPastBookings(user.profile.id),
  ]);
  const canBook = bookingIsOpen(settings.business_mode);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-display-sm font-semibold text-primary">
          Reservations
        </h1>
        {canBook ? (
          <Button asChild>
            <Link href="/book">Book a Bay</Link>
          </Button>
        ) : null}
      </div>

      <h2 className="mt-8 font-serif text-xl font-semibold text-primary">Upcoming</h2>
      <div className="mt-3 space-y-3">
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="You do not have any upcoming reservations yet."
            action={
              canBook ? (
                <Button asChild>
                  <Link href="/book">Book Your First Session</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          upcoming.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-charcoal">
                    {formatDateTime(b.starts_at)}
                  </p>
                  <p className="mt-0.5 text-sm text-charcoal-muted">
                    {b.booking_number} · up to {b.player_count} players ·{" "}
                    {formatCents(b.total_cents)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookingStatusBadge status={b.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/account/bookings/${b.id}`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="mt-10 font-serif text-xl font-semibold text-primary">History</h2>
      <div className="mt-3 space-y-3">
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions yet.</p>
        ) : (
          past.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-charcoal">
                    {formatDateTime(b.starts_at)}
                  </p>
                  <p className="mt-0.5 text-sm text-charcoal-muted">
                    {b.booking_number} · {formatCents(b.total_cents)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookingStatusBadge status={b.status} />
                  {canBook ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/book">Rebook</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
