/**
 * Pure availability engine. Given facility hours, existing
 * reservations, blackouts and booking rules, computes the open
 * start times for a given date/duration. Runs server-side only —
 * the client never computes availability itself.
 *
 * All timestamps are handled as epoch milliseconds internally to
 * keep the math timezone-explicit and unit-testable.
 */

export interface Interval {
  startMs: number;
  endMs: number;
}

export interface BayInput {
  id: string;
  name: string;
  capacity: number;
  active: boolean;
  maintenanceStatus: string;
}

export interface AvailabilityInput {
  /** Facility open window for the requested date (local), as epoch ms. Null = closed. */
  openWindow: Interval | null;
  bays: BayInput[];
  /** Busy intervals per bay id (bookings in live statuses + active holds). */
  busyByBay: Record<string, Interval[]>;
  /** Blackouts; bayId null applies to all bays. */
  blackouts: Array<Interval & { bayId: string | null }>;
  durationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  /** Current time (epoch ms) — slots starting before this + leadTime are hidden. */
  nowMs: number;
  sameDayCutoffMinutes: number;
}

export interface Slot {
  startMs: number;
  endMs: number;
  bayId: string;
  bayName: string;
  capacity: number;
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

export function computeAvailableSlots(input: AvailabilityInput): Slot[] {
  const {
    openWindow,
    bays,
    busyByBay,
    blackouts,
    durationMinutes,
    bufferMinutes,
    slotIntervalMinutes,
    nowMs,
    sameDayCutoffMinutes,
  } = input;

  if (!openWindow) return [];
  if (durationMinutes <= 0) return [];

  const durMs = durationMinutes * 60_000;
  const bufMs = bufferMinutes * 60_000;
  const stepMs = slotIntervalMinutes * 60_000;
  const earliestStart = nowMs + sameDayCutoffMinutes * 60_000;

  const slots: Slot[] = [];

  for (const bay of bays) {
    if (!bay.active || bay.maintenanceStatus === "offline") continue;

    const busy = [
      ...(busyByBay[bay.id] ?? []),
      ...blackouts
        .filter((b) => b.bayId === null || b.bayId === bay.id)
        .map((b) => ({ startMs: b.startMs, endMs: b.endMs })),
    ];

    for (
      let start = openWindow.startMs;
      start + durMs <= openWindow.endMs;
      start += stepMs
    ) {
      if (start < earliestStart) continue;
      // The buffer extends the occupied window so back-to-back
      // groups get turnaround time.
      const candidate: Interval = { startMs: start - bufMs, endMs: start + durMs + bufMs };
      const conflict = busy.some((b) => overlaps(candidate, b));
      if (!conflict) {
        slots.push({
          startMs: start,
          endMs: start + durMs,
          bayId: bay.id,
          bayName: bay.name,
          capacity: bay.capacity,
        });
      }
    }
  }

  slots.sort((a, b) => a.startMs - b.startMs);
  return slots;
}

/**
 * Groups per-bay slots into unique start times for the customer UI.
 * Customers pick a time; the system assigns a bay (fewest-capacity
 * fit first, so large bays stay open for large groups).
 */
export interface TimeOption {
  startMs: number;
  endMs: number;
  bayIds: string[];
  /** Bay chosen for this option given the requested player count. */
  assignedBayId: string | null;
}

export function groupSlotsByTime(slots: Slot[], playerCount: number): TimeOption[] {
  const byTime = new Map<number, Slot[]>();
  for (const slot of slots) {
    const list = byTime.get(slot.startMs) ?? [];
    list.push(slot);
    byTime.set(slot.startMs, list);
  }

  const options: TimeOption[] = [];
  for (const [startMs, group] of byTime) {
    const fitting = group
      .filter((s) => s.capacity >= playerCount)
      .sort((a, b) => a.capacity - b.capacity);
    options.push({
      startMs,
      endMs: group[0]?.endMs ?? startMs,
      bayIds: group.map((s) => s.bayId),
      assignedBayId: fitting[0]?.bayId ?? null,
    });
  }

  return options
    .filter((o) => o.assignedBayId !== null)
    .sort((a, b) => a.startMs - b.startMs);
}
