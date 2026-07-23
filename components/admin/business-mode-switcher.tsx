"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { setBusinessMode } from "@/features/admin/actions";
import type { BusinessMode } from "@/types";
import { cn } from "@/lib/utils";

const MODES: Array<{ value: BusinessMode; label: string; hint: string }> = [
  {
    value: "pre_opening",
    label: "Pre-opening",
    hint: "Interest collection only; no booking",
  },
  {
    value: "reservations_open",
    label: "Reservations open",
    hint: "Booking live ahead of opening day",
  },
  {
    value: "fully_operational",
    label: "Fully operational",
    hint: "Everything on",
  },
  {
    value: "temporarily_closed",
    label: "Temporarily closed",
    hint: "Pause booking with a notice",
  },
];

export function BusinessModeSwitcher({ current }: { current: BusinessMode }) {
  const [mode, setMode] = React.useState<BusinessMode>(current);
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);

  function choose(next: BusinessMode) {
    if (next === mode) return;
    const modeCfg = MODES.find((m) => m.value === next);
    if (
      !window.confirm(
        `Switch the whole site to "${modeCfg?.label}"? This changes what customers see immediately.`,
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await setBusinessMode(next);
      setMessage(res.message);
      if (res.ok) setMode(next);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-charcoal">Business mode:</span>
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => choose(m.value)}
            disabled={pending}
            title={m.hint}
            aria-pressed={mode === m.value}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60",
              mode === m.value
                ? "border-primary bg-primary text-cream"
                : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40",
            )}
          >
            {m.label}
          </button>
        ))}
        {pending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
        ) : null}
      </div>
      {message ? (
        <p role="status" className="mt-2 text-xs text-charcoal-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
