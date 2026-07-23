import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Logo } from "@/components/brand/logo";
import { formatDateLong, formatTime } from "@/lib/dates";
import { formatCents } from "@/lib/utils";
import type { Booking } from "@/types";

export const metadata: Metadata = buildMetadata({
  title: "Reservation Confirmation",
  description: "Your reservation at The Bunker Indoor Golf.",
  path: "/book/confirmation",
  noIndex: true,
});

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(bookingId)) notFound();

  const admin = createSupabaseAdminClient();
  if (!admin) notFound();

  const { data: bookingRow } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (!bookingRow) notFound();
  const booking = bookingRow as Booking;

  const settings = await getSiteSettings();
  const confirmed = ["confirmed", "checked_in", "completed"].includes(booking.status);
  const pending = booking.status === "payment_pending";

  const googleCalUrl = new URL("https://calendar.google.com/calendar/render");
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  googleCalUrl.searchParams.set("action", "TEMPLATE");
  googleCalUrl.searchParams.set("text", "Simulator bay — The Bunker Indoor Golf");
  googleCalUrl.searchParams.set(
    "details",
    `Reservation ${booking.booking_number}. Arrive ~10 minutes early.`,
  );
  googleCalUrl.searchParams.set(
    "location",
    `The Bunker Indoor Golf, ${settings.facility.city}, ${settings.facility.state}`,
  );
  googleCalUrl.searchParams.set(
    "dates",
    `${fmt(booking.starts_at)}/${fmt(booking.ends_at)}`,
  );

  return (
    <section className="container max-w-2xl py-12 md:py-20">
      <div className="text-center">
        {confirmed ? (
          <>
            <CheckCircle2 aria-hidden className="mx-auto h-16 w-16 text-success" />
            <h1 className="mt-5 font-serif text-display-sm font-semibold text-primary">
              You&apos;re booked!
            </h1>
            <p className="mt-2 text-charcoal-muted">
              Confirmation and details are on their way to your email.
            </p>
          </>
        ) : pending ? (
          <>
            <Clock aria-hidden className="mx-auto h-16 w-16 text-warning" />
            <h1 className="mt-5 font-serif text-display-sm font-semibold text-primary">
              Almost there…
            </h1>
            <p className="mt-2 text-charcoal-muted">
              We&apos;re waiting on payment confirmation. This page updates once the
              payment settles — usually within a minute.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-display-sm font-semibold text-primary">
              Reservation {booking.status.replace(/_/g, " ")}
            </h1>
            <div className="mt-4">
              <InlineAlert variant="warning">
                This reservation is no longer active. If that seems wrong,{" "}
                <Link href="/contact" className="font-medium text-primary underline underline-offset-2">
                  contact us
                </Link>
                .
              </InlineAlert>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-border/50 bg-surface shadow-card">
        <div className="flex items-center justify-between bg-primary-dark px-6 py-4">
          <Logo variant="cream" width={40} height={47} />
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-cream/60">
              Reservation
            </p>
            <p className="font-mono text-sm font-semibold text-cream">
              {booking.booking_number}
            </p>
          </div>
        </div>
        <dl className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <CalendarPlus aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                When
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {formatDateLong(booking.starts_at)}
                <br />
                {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Party
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                Up to {booking.player_count} players
                {booking.club_rental_required ? " · rental clubs ready" : ""}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Where
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                The Bunker Indoor Golf
                <br />
                {settings.facility.address_line1 ?? ""}{" "}
                {settings.facility.city}, {settings.facility.state}
              </dd>
            </div>
          </div>
          <div className="border-t border-border/40 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-muted">Total{confirmed ? " paid" : ""}</span>
              <span className="font-semibold text-primary">
                {formatCents(booking.total_cents)}
              </span>
            </div>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline">
          <a href={googleCalUrl.toString()} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden /> Add to Google Calendar
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href={booking.profile_id ? "/account/bookings" : "/signup"}>
            {booking.profile_id ? "Manage Reservation" : "Create Account to Manage"}
          </Link>
        </Button>
      </div>

      <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-5 text-sm leading-relaxed text-charcoal-muted">
        <p className="font-semibold text-primary">Before you arrive</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Arrive about 10 minutes early — especially for a first visit.</li>
          <li>Bring your clubs, or grab rentals at the front desk (free).</li>
          <li>Sneakers or athletic shoes are perfect. No dress code.</li>
          <li>
            Plans changed? Cancel free until{" "}
            {settings.booking_rules.cancellation_window_hours} hours before your
            session — see the{" "}
            <Link href="/policies/cancellation" className="font-medium text-primary underline underline-offset-2">
              cancellation policy
            </Link>
            .
          </li>
        </ul>
      </div>
    </section>
  );
}
