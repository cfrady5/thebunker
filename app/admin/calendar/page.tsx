import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { facilityLocalToUtc, facilityToday, formatTime } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/ui";
import { WalkInDialog } from "@/components/admin/walk-in-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Booking, SimulatorBay } from "@/types";

export const metadata: Metadata = { title: "Calendar" };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-success/15 border-success/40 text-success",
  checked_in: "bg-thistle/15 border-thistle/40 text-thistle",
  payment_pending: "bg-warning/15 border-warning/40 text-warning",
  completed: "bg-border/30 border-border text-charcoal-muted",
};

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

  if (supabase) {
    const dayStart = facilityLocalToUtc(date, "00:00").toISOString();
    const dayEnd = facilityLocalToUtc(date, "23:59").toISOString();
    const [baysRes, bookingsRes] = await Promise.all([
      supabase.from("simulator_bays").select("*").order("sort_order"),
      supabase
        .from("bookings")
        .select("*")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .in("status", ["confirmed", "checked_in", "payment_pending", "completed"])
        .order("starts_at"),
    ]);
    bays = (baysRes.data ?? []) as SimulatorBay[];
    bookings = (bookingsRes.data ?? []) as Booking[];
  }

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

      {bays.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No bays configured yet — seed the database or add bays in Facility → Bays.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bays.map((bay) => {
            const bayBookings = bookings.filter((b) => b.bay_id === bay.id);
            return (
              <div
                key={bay.id}
                className="rounded-lg border border-border/40 bg-surface"
              >
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                  <h2 className="font-serif font-semibold text-primary">{bay.name}</h2>
                  {bay.maintenance_status !== "operational" ? (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                      {bay.maintenance_status}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  {bayBookings.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Open all day
                    </p>
                  ) : (
                    bayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={cn(
                          "rounded-md border px-3 py-2 text-xs",
                          STATUS_COLORS[b.status] ?? "border-border/40 bg-surface-muted",
                        )}
                      >
                        <p className="font-semibold">
                          {formatTime(b.starts_at)} – {formatTime(b.ends_at)}
                        </p>
                        <p className="mt-0.5 truncate">
                          {b.booking_number} · {b.player_count}p
                          {b.notes ? ` · ${b.notes}` : ""}
                        </p>
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
