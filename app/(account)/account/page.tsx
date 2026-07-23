import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Medal, Users, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import {
  getCreditBalance,
  getLeagueRegistrations,
  getMembership,
  getUpcomingBookings,
} from "@/features/account/queries";
import { getSiteSettings, bookingIsOpen } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/dates";
import { formatCents, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "My Account" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AccountDashboardPage() {
  const user = (await getCurrentUser())!;
  const [settings, upcoming, membership, credit, leagueRegs] = await Promise.all([
    getSiteSettings(),
    getUpcomingBookings(user.profile.id),
    getMembership(user.profile.id),
    getCreditBalance(user.profile.id),
    getLeagueRegistrations(user.profile.id),
  ]);
  const canBook = bookingIsOpen(settings.business_mode);
  const next = upcoming[0];
  const activeLeagues = leagueRegs.filter((r) =>
    ["pending", "confirmed", "waitlisted"].includes(r.status),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-display-sm font-semibold text-primary">
            {greeting()}, {user.profile.first_name || "golfer"}.
          </h1>
          <p className="mt-1 text-charcoal-muted">
            {canBook
              ? "Ready for your next round?"
              : `We open ${settings.opening_label} — thanks for being here early.`}
          </p>
        </div>
        <Button asChild>
          <Link href={canBook ? "/book" : "/opening-updates"}>
            <CalendarPlus aria-hidden />
            {canBook ? "Book a Bay" : "Opening Updates"}
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {/* Next reservation */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays aria-hidden className="h-5 w-5 text-gold-dark" /> Next
              reservation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {next ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-charcoal">
                    {formatDateTime(next.starts_at)}
                  </p>
                  <p className="mt-0.5 text-sm text-charcoal-muted">
                    {next.booking_number} · up to {next.player_count} players
                  </p>
                  {next.status === "payment_pending" ? (
                    <Badge variant="warning" className="mt-2">
                      Payment pending
                    </Badge>
                  ) : null}
                </div>
                <Button asChild variant="outline">
                  <Link href={`/account/bookings/${next.id}`}>Manage</Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                title="You do not have any upcoming reservations yet."
                description={
                  canBook
                    ? "Grab a bay and get swinging."
                    : "Reservations open before our grand opening — you'll be first to know."
                }
                action={
                  canBook ? (
                    <Button asChild>
                      <Link href="/book">Book Your First Session</Link>
                    </Button>
                  ) : undefined
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Membership */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Medal aria-hidden className="h-5 w-5 text-gold-dark" /> Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membership?.plan ? (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-charcoal">
                    {membership.plan.name}
                  </p>
                  <Badge
                    variant={membership.status === "active" ? "success" : "warning"}
                  >
                    {membership.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-charcoal-muted">
                  {formatDuration(membership.included_minutes_remaining)} of included
                  time remaining this period
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/account/memberships">Manage membership</Link>
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-charcoal-muted">
                  No membership yet. Members get included monthly bay time, earlier
                  booking windows and discounts.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/memberships">See membership plans</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wallet aria-hidden className="h-5 w-5 text-gold-dark" /> Account credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl font-semibold text-primary">
              {formatCents(credit)}
            </p>
            <p className="mt-1 text-sm text-charcoal-muted">
              Credits apply automatically at checkout.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/account/credits">View history</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Leagues */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users aria-hidden className="h-5 w-5 text-gold-dark" /> Leagues &amp;
              programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeLeagues.length > 0 ? (
              <ul className="divide-y divide-border/40">
                {activeLeagues.map((reg) => (
                  <li key={reg.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-charcoal">
                        {reg.league?.name ?? "League"}
                      </p>
                      <p className="text-sm text-charcoal-muted">{reg.league?.season}</p>
                    </div>
                    <Badge variant={reg.status === "confirmed" ? "success" : "warning"}>
                      {reg.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="League registration has not opened yet."
                description="Tell us which leagues you're interested in and we'll save your spot in line."
                action={
                  <Button asChild variant="outline">
                    <Link href="/leagues">Browse Leagues</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
