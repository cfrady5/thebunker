"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Calendar-icon popover for jumping to any date on the bay calendar.
 * Days that are fully booked render red. Day and month links are
 * full-page navigations (the server recomputes fully-booked days for
 * whichever month is in view).
 */
export function CalendarMonthPicker({
  year,
  month, // 0-based
  selected,
  today,
  fullyBooked,
}: {
  year: number;
  month: number;
  selected: string;
  today: string;
  fullyBooked: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const full = React.useMemo(() => new Set(fullyBooked), [fullyBooked]);

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevFirst = ymd(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, 1);
  const nextFirst = ymd(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, 1);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/30 bg-transparent px-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <CalendarDays aria-hidden className="h-4 w-4" />
        Pick a date
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-[320px] rounded-xl border border-border/60 bg-surface p-4 shadow-card-hover">
            <div className="mb-3 flex items-center justify-between">
              <a
                href={`/admin/calendar?date=${prevFirst}`}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal-muted transition-colors hover:bg-primary/5 hover:text-primary"
              >
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </a>
              <p className="font-serif text-base font-semibold text-primary">
                {MONTHS[month]} {year}
              </p>
              <a
                href={`/admin/calendar?date=${nextFirst}`}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal-muted transition-colors hover:bg-primary/5 hover:text-primary"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </a>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {DOW.map((d, i) => (
                <div
                  key={i}
                  className="py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`b-${i}`} />;
                const ds = ymd(year, month, d);
                const isSelected = ds === selected;
                const isToday = ds === today;
                const isFull = full.has(ds);
                return (
                  <a
                    key={ds}
                    href={`/admin/calendar?date=${ds}`}
                    aria-label={`${ds}${isFull ? " — fully booked" : ""}`}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      isSelected
                        ? "bg-primary text-cream"
                        : isFull
                          ? "bg-danger/15 text-danger hover:bg-danger/25"
                          : "text-charcoal hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    <span className="relative z-10">{d}</span>
                    {isToday && !isSelected ? (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                    ) : null}
                  </a>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-danger/40" />
              Fully booked
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
