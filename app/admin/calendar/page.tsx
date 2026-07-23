import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  facilityDayOfWeek,
  facilityLocalToUtc,
  facilityToday,
  formatTime,
} from "@/lib/dates";
import { computeOpenWindows, type Interval } from "@/lib/availability/engine";
import { AdminPageHeader, MetricCard } from "@/components/admin/ui";
import { WalkInDialog } from "@/components/admin/walk-in-dialog";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import type {
  BayBlackout,
  Booking,
  BusinessHoursRow,
  SimulatorBay,
  SpecialHoursRow,
} from "@/types";

export const metadata: Metadata = { title: "Calendar" };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-success/15 border-success/40 text-success",
  checked_in: "bg-thistle/15 border-thistle/40 text-thistle",
  payment_pending: "bg-warning/15 border-warning/40 text-warning",
  completed: "bg-border/30 border-border text-charcoal-muted",
};

interface TimelineEntry {
  kind: "booking" | "open" | "blackout";
  startMs: number;
  endMs: number;
  booking?: Booking;
  reason?: string;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? params.date!
    : facilityToday();

  const supabase = await createSupabaseServerClient();
  let bays: SimulatorBay[] = [];
  let bookings: Booking[] = [];
  let blackouts: BayBlackout[] = [];
  let openWindow: Interval | null = null;

  if (supabase) {
    const dayStart = facilityLocalToUtc(date, "00:00").toISOString();
    const dayEnd = facilityLocalToUtc(date, "23:59").toISOString();
    const [baysRes, bookingsRes, blackoutsRes, hoursRes, specialRes] = await Promise.all([
      supabase.from("simulator_bays").select("*").order("sort_order"),
      supabase
        .from("bookings")
        .select("*")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .in("status", ["confirmed", "checked_in", "payment_pending", "completed"])
        .order("starts_at"),
      supabase
        .from("bay_blackouts")
        .select("*")
        .gte("ends_at", dayStart)
        .lte("starts_at", dayEnd),
      supabase.from("business_hours").select("*").eq("active", true),
      supabase.from("special_hours").select("*").eq("date", date),
    ]);
    bays = (baysRes.data ?? []) as SimulatorBay[];
    bookings = (bookingsRes.data ?? []) as Booking[];
    blackouts = (blackoutsRes.data ?? []) as BayBlackout[];

    const special = ((specialRes.data ?? []) as SpecialHoursRow[])[0];
    if (special?.closed) {
      openWindow = null;
    } else if (special?.opens_at && special?.closes_at) {
      openWindow = {
        startMs: facilityLocalToUtc(date, special.opens_at).getTime(),
        endMs: facilityLocalToUtc(date, special.closes_at).getTime(),
      };
    } else {
      const dow = facilityDayOfWeek(date);
      const row = ((hoursRes.data ?? []) as BusinessHoursRow[]).find(
        (h) =>
          h.day_of_week === dow &&
          (!h.effective_from || h.effective_from <= date) &&
          (!h.effective_to || h.effective_to >= date),
      );
      if (row) {
        openWindow = {
          startMs: facilityLocalToUtc(date, row.opens_at).getTime(),
          endMs: facilityLocalToUtc(date, row.closes_at).getTime(),
        };
      }
    }
  }

  // Build a per-bay timeline interleaving bookings, blackouts and openings.
  const liveStatuses = ["confirmed", "checked_in", "payment_pending"];
  function bayTimeline(bay: SimulatorBay): TimelineEntry[] {
    const bayBookings = bookings.filter((b) => b.bay_id === bay.id);
    const bayBlackouts = blackouts.filter(
      (b) => b.bay_id === null || b.bay_id === bay.id,
    );
    const entries: TimelineEntry[] = [
      ...bayBookings.map<TimelineEntry>((b) => ({
        kind: "booking",
        startMs: new Date(b.starts_at).getTime(),
        endMs: new Date(b.ends_at).getTime(),
        booking: b,
      })),
      ...bayBlackouts.map<TimelineEntry>((b) => ({
        kind: "blackout",
        startMs: new Date(b.starts_at).getTime(),
        endMs: new Date(b.ends_at).getTime(),
        reason: b.reason ?? b.blackout_type.replace(/_/g, " "),
      })),
    ];

    if (openWindow && bay.active && bay.maintenance_status !== "offline") {
      const busy = entries
        .filter((e) => e.kind === "blackout" || liveStatuses.includes(e.booking?.status ?? ""))
        .map((e) => ({ startMs: e.startMs, endMs: e.endMs }));
      for (const gap of computeOpenWindows(openWindow, busy)) {
        if (gap.endMs - gap.startMs >= 15 * 60_000) {
          entries.push({ kind: "open", startMs: gap.startMs, endMs: gap.endMs });
        }
      }
    }

    return entries.sort((a, b) => a.startMs - b.startMs);
  }

  const liveBookings = bookings.filter((b) => liveStatuses.includes(b.status));
  const totalOpenMinutes = bays
    .filter((b) => b.active && b.maintenance_status !== "offline")
    .flatMap((bay) => bayTimeline(bay))
    .filter((e) => e.kind === "open")
    .reduce((sum, e) => sum + (e.endMs - e.startMs) / 60_000, 0);

  const prev = new Date(`${date}T12:00:00`);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-CA");

  return (
    <div>
      <AdminPageHeader
        title="Bay Calendar"
        description={new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/calendar?date=${fmt(prev)}`}>← Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/calendar?date=${facilityToday()}`}>Today</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/calendar?date=${fmt(next)}`}>Next →</Link>
            </Button>
            <WalkInDialog bays={bays.map((b) => ({ id: b.id, name: b.name }))} date={date} />
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Reservations" value={String(liveBookings.length)} />
        <MetricCard
          label="Open bay time"
          value={openWindow ? formatDuration(Math.round(totalOpenMinutes)) : "Closed"}
          hint={openWindow ? "Total unbooked time across bays" : "No hours set for this date"}
        />
        <MetricCard
          label="Facility hours"
          value={
            openWindow
              ? `${formatTime(new Date(openWindow.startMs))} – ${formatTime(new Date(openWindow.endMs))}`
              : "—"
          }
        />
      </div>

      {bays.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No bays configured yet — seed the database or add bays in Facility → Bays.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bays.map((bay) => {
            const timeline = bayTimeline(bay);
            return (
              <div key={bay.id} className="rounded-lg border border-border/40 bg-surface">
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                  <h2 className="font-serif font-semibold text-primary">{bay.name}</h2>
                  {bay.maintenance_status !== "operational" ? (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                      {bay.maintenance_status}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  {timeline.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      {openWindow ? "No activity" : "Closed"}
                    </p>
                  ) : (
                    timeline.map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-md border px-3 py-2 text-xs",
                          entry.kind === "open" &&
                            "border-dashed border-success/50 bg-success/5 text-success",
                          entry.kind === "blackout" &&
                            "border-danger/40 bg-danger/10 text-danger",
                          entry.kind === "booking" &&
                            (STATUS_COLORS[entry.booking!.status] ??
                              "border-border/40 bg-surface-muted"),
                        )}
                      >
                        <p className="font-semibold">
                          {formatTime(new Date(entry.startMs))} –{" "}
                          {formatTime(new Date(entry.endMs))}
                        </p>
                        {entry.kind === "open" ? (
                          <p className="mt-0.5">
                            Open · {formatDuration((entry.endMs - entry.startMs) / 60_000)}
                          </p>
                        ) : entry.kind === "blackout" ? (
                          <p className="mt-0.5 truncate">Blocked · {entry.reason}</p>
                        ) : (
                          <p className="mt-0.5 truncate">
                            {entry.booking!.booking_number} · {entry.booking!.player_count}p
                            {entry.booking!.notes ? ` · ${entry.booking!.notes}` : ""}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
