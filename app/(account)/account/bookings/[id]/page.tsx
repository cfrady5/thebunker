import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getBookingById } from "@/features/account/queries";
import { getSiteSettings } from "@/lib/settings";
import { assessCancellation } from "@/lib/bookings/cancellation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/account/booking-status-badge";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { formatDateLong, formatTime, formatDateTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservation Details" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const booking = await getBookingById(user.profile.id, id);
  if (!booking) notFound();

  const settings = await getSiteSettings();
  const assessment = assessCancellation({
    startsAt: new Date(booking.starts_at),
    now: new Date(),
    windowHours: settings.booking_rules.cancellation_window_hours,
    totalPaidCents: booking.total_cents,
  });
  const cancellable = ["confirmed", "payment_pending"].includes(booking.status);
  const upcoming = new Date(booking.starts_at).getTime() > Date.now();

  return (
    <div className="max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href="/account/bookings" className="hover:text-primary">
          Reservations
        </Link>{" "}
        / <span className="text-charcoal">{booking.booking_number}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-display-sm font-semibold text-primary">
          {formatDateLong(booking.starts_at)}
        </h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Time
              </dt>
              <dd className="mt-1 font-medium text-charcoal">
                {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Players
              </dt>
              <dd className="mt-1 font-medium text-charcoal">
                Up to {booking.player_count}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Reservation number
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium text-charcoal">
                {booking.booking_number}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Equipment
              </dt>
              <dd className="mt-1 font-medium text-charcoal">
                {booking.club_rental_required ? "Rental clubs requested" : "Bringing clubs"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border/40 pt-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal-muted">Bay time</dt>
                <dd>{formatCents(booking.subtotal_cents)}</dd>
              </div>
              {booking.discount_cents > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd>-{formatCents(booking.discount_cents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-charcoal-muted">Tax</dt>
                <dd>{formatCents(booking.tax_cents)}</dd>
              </div>
              {booking.credit_applied_cents > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Credit applied</dt>
                  <dd>-{formatCents(booking.credit_applied_cents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold text-primary">
                <dt>Total</dt>
                <dd>{formatCents(booking.total_cents)}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {cancellable && upcoming ? (
        <div className="mt-6 space-y-4">
          <InlineAlert variant={assessment.beforeDeadline ? "info" : "warning"}>
            {assessment.beforeDeadline ? (
              <>
                Free cancellation until{" "}
                <strong>{formatDateTime(assessment.deadline.toISOString())}</strong>.
                Need a different time? Cancel and rebook, or contact us to move it.
              </>
            ) : (
              <>
                The free-cancellation window has passed. Cancelling now converts your
                payment to account credit for a future visit.
              </>
            )}
          </InlineAlert>
          <div className="flex flex-wrap gap-3">
            <CancelBookingButton
              bookingId={booking.id}
              refundEligible={assessment.beforeDeadline}
            />
            <Button asChild variant="outline">
              <Link href="/contact?subject=Reschedule request">Request Reschedule</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
