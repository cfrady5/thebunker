/**
 * Membership included-minutes math (pure, unit-tested).
 */

export interface MinutesApplication {
  minutesApplied: number;
  minutesRemaining: number;
  /** Portion of the booking (in minutes) still payable in cash. */
  billableMinutes: number;
}

/** Applies included membership minutes to a booking duration. */
export function applyIncludedMinutes(params: {
  minutesRemaining: number;
  bookingMinutes: number;
}): MinutesApplication {
  const { minutesRemaining, bookingMinutes } = params;
  if (minutesRemaining < 0 || bookingMinutes <= 0) {
    throw new Error("Invalid minutes input");
  }
  const applied = Math.min(minutesRemaining, bookingMinutes);
  return {
    minutesApplied: applied,
    minutesRemaining: minutesRemaining - applied,
    billableMinutes: bookingMinutes - applied,
  };
}

/**
 * Computes the minutes balance for a new billing period given the
 * plan's rollover rule.
 */
export function renewIncludedMinutes(params: {
  currentRemaining: number;
  planIncludedMinutes: number;
  rolloverRule: "none" | "one_period" | "unlimited";
}): number {
  const { currentRemaining, planIncludedMinutes, rolloverRule } = params;
  switch (rolloverRule) {
    case "none":
      return planIncludedMinutes;
    case "one_period":
      // Carry at most one period's worth forward.
      return Math.min(currentRemaining, planIncludedMinutes) + planIncludedMinutes;
    case "unlimited":
      return currentRemaining + planIncludedMinutes;
  }
}
