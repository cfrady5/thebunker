"use client";

import * as React from "react";

/** Live countdown to an event start, announced politely. */
export function EventCountdown({ startsAtIso }: { startsAtIso: string }) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const diff = new Date(startsAtIso).getTime() - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  const parts =
    days > 0
      ? [
          [days, days === 1 ? "day" : "days"],
          [hours, days < 7 ? (hours === 1 ? "hour" : "hours") : null],
        ]
      : [
          [hours, hours === 1 ? "hour" : "hours"],
          [minutes, minutes === 1 ? "minute" : "minutes"],
        ];

  return (
    <p className="flex items-baseline gap-3 font-serif text-cream" aria-live="off">
      {parts
        .filter(([, label]) => label)
        .map(([value, label]) => (
          <span key={String(label)} className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-gold">{value}</span>
            <span className="text-sm uppercase tracking-widest text-cream/60">
              {label}
            </span>
          </span>
        ))}
    </p>
  );
}
