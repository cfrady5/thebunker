import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  facilityDateKey,
  facilityDayOfWeek,
  facilityLocalToUtc,
  facilityToday,
  formatTime,
} from "@/lib/dates";
import { computeOpenWindows, type Interval } from "@/lib/availability/engine";
import { AdminPageHeader, MetricCard } from "@/components/admin/ui";
import { CalendarMonthPicker } from "@/components/admin/calendar-month-picker";
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

const LIVE_STATUSES = ["confirmed", "checked_in", "payment_pending"];

/**
 * Days in the given month where open bay time is effectively gone
 * (< 30 minutes remaining across all active bays) — rendered red in
 * the date picker. Days the facility is closed are not counted.
 */
function computeFullyBooked(params: {
  year: number;
  month: number; // 0-based
  bays: SimulatorBay[];
  weeklyHours: BusinessHoursRow[];
  specials: SpecialHoursRow[];
  bookings: Booking[];
  blackouts: BayBlackout[];
}): string[] {
  const { year, month, bays, weeklyHours, specials, bookings, blackouts } = params;
  const activeBays = bays.filter((b) => b.active && b.maintenance_status !== "offline");
  if (activeBays.length === 0) return [];

  const specialByDate = new Map(specials.map((s) => [s.date, s]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const fully: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    let openWindow: Interval | null = null;
    const special = specialByDate.get(ds);
    if (special?.closed) {
      openWindow = null;
    } else if (special?.opens_at && special?.closes_at) {
      openWindow = {
        startMs: facilityLocalToUtc(ds, special.opens_at).getTime(),
        endMs: facilityLocalToUtc(ds, special.closes_at).getTime(),
      };
    } else {
      const dow = facilityDayOfWeek(ds);
      const row = weeklyHours.find(
        (h) =>
          h.day_of_week === dow &&
          (!h.effective_from || h.effective_from <= ds) &&
          (!h.effective_to || h.effective_to >= ds),
      );
      if (row) {
        openWindow = {
          startMs: facilityLocalToUtc(ds, row.opens_at).getTime(),
          endMs: facilityLocalToUtc(ds, row.closes_at).getTime(),
        };
      }
    }
    if (!openWindow || openWindow.endMs <= openWindow.startMs) continue;

    const dayBookings = bookings.filter(
      (b) => facilityDateKey(b.starts_at) === ds && LIVE_STATUSES.includes(b.status),
    );
    const dayBlackouts = blackouts.filter(
      (b) =>
        new Date(b.starts_at).getTime() < openWindow!.endMs &&
        new Date(b.ends_at).getTime() > openWindow!.startMs,
    );

    let remainingMin = 0;
    for (const bay of activeBays) {
      const busy = [
        ...dayBookings
          .filter((b) => b.bay_id === bay.id)
          .map((b) => ({
            startMs: new Date(b.starts_at).getTime(),
            endMs: new Date(b.ends_at).getTime(),
          })),
        ...dayBlackouts
          .filter((b) => b.bay_id === null || b.bay_id === bay.id)
          .map((b) => ({
            startMs: new Date(b.starts_at).getTime(),
            endMs: new Date(b.ends_at).getTime(),
          })),
      ];
      for (const gap of computeOpenWindows(openWindow, busy)) {
        remainingMin += (gap.endMs - gap.startMs) / 60_000;
      }
    }
    if (remainingMin < 30) fully.push(ds);
  }
  return fully;
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
  let fullyBooked: string[] = [];

  const viewDate = new Date(`${date}T12:00:00`);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

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

    // Fully-booked days across the visible month, for the date picker.
    const mm = String(viewMonth + 1).padStart(2, "0");
    const lastDay = String(new Date(viewYear, viewMonth + 1, 0).getDate()).padStart(2, "0");
    const monthStartUtc = facilityLocalToUtc(`${viewYear}-${mm}-01`, "00:00").toISOString();
    const monthEndUtc = facilityLocalToUtc(`${viewYear}-${mm}-${lastDay}`, "23:59").toISOString();
    const [monthBookingsRes, monthBlackoutsRes, monthSpecialsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .gte("starts_at", monthStartUtc)
        .lte("starts_at", monthEndUtc)
        .in("status", ["confirmed", "checked_in", "payment_pending"]),
      supabase
        .from("bay_blackouts")
        .select("*")
        .gte("ends_at", monthStartUtc)
        .lte("starts_at", monthEndUtc),
      supabase
        .from("special_hours")
        .select("*")
        .gte("date", `${viewYear}-${mm}-01`)
        .lte("date", `${viewYear}-${mm}-${lastDay}`),
    ]);
    fullyBooked = computeFullyBooked({
      year: viewYear,
      month: viewMonth,
      bays,
      weeklyHours: (hoursRes.data ?? []) as BusinessHoursRow[],
      specials: (monthSpecialsRes.data ?? []) as SpecialHoursRow[],
      bookings: (monthBookingsRes.data ?? []) as Booking[],
      blackouts: (monthBlackoutsRes.data ?? []) as BayBlackout[],
    });
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
            <CalendarMonthPicker
              year={viewYear}
              month={viewMonth}
              selected={date}
              today={facilityToday()}
              fullyBooked={fullyBooked}
            />
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
