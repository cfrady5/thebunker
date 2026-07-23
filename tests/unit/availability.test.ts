import { describe, expect, it } from "vitest";
import {
  computeAvailableSlots,
  computeOpenWindows,
  groupSlotsByTime,
  type AvailabilityInput,
} from "@/lib/availability/engine";

const HOUR = 3_600_000;
const openStart = Date.parse("2026-11-10T14:00:00Z"); // 9am local (UTC-5)
const openEnd = Date.parse("2026-11-10T22:00:00Z"); // 5pm local

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    openWindow: { startMs: openStart, endMs: openEnd },
    bays: [
      { id: "bay1", name: "Bay 1", capacity: 6, active: true, maintenanceStatus: "operational" },
      { id: "bay2", name: "Bay 2", capacity: 4, active: true, maintenanceStatus: "operational" },
    ],
    busyByBay: {},
    blackouts: [],
    durationMinutes: 60,
    bufferMinutes: 0,
    slotIntervalMinutes: 60,
    nowMs: openStart - 24 * HOUR,
    sameDayCutoffMinutes: 0,
    ...overrides,
  };
}

describe("computeAvailableSlots", () => {
  it("produces slots for every open hour on every bay", () => {
    const slots = computeAvailableSlots(input());
    // 8 open hours, 60-minute sessions => 8 starts per bay
    expect(slots.filter((s) => s.bayId === "bay1")).toHaveLength(8);
    expect(slots.filter((s) => s.bayId === "bay2")).toHaveLength(8);
  });

  it("never overlaps existing bookings", () => {
    const busyStart = openStart + 2 * HOUR;
    const slots = computeAvailableSlots(
      input({
        busyByBay: { bay1: [{ startMs: busyStart, endMs: busyStart + HOUR }] },
      }),
    );
    const bay1Overlaps = slots.filter(
      (s) => s.bayId === "bay1" && s.startMs < busyStart + HOUR && busyStart < s.endMs,
    );
    expect(bay1Overlaps).toHaveLength(0);
    // Other bay unaffected
    expect(slots.filter((s) => s.bayId === "bay2")).toHaveLength(8);
  });

  it("enforces turnaround buffers around bookings", () => {
    const busyStart = openStart + 2 * HOUR;
    const noBuffer = computeAvailableSlots(
      input({ busyByBay: { bay1: [{ startMs: busyStart, endMs: busyStart + HOUR }] } }),
    );
    const withBuffer = computeAvailableSlots(
      input({
        busyByBay: { bay1: [{ startMs: busyStart, endMs: busyStart + HOUR }] },
        bufferMinutes: 15,
      }),
    );
    // The slot immediately after the booking survives without buffer
    expect(noBuffer.some((s) => s.bayId === "bay1" && s.startMs === busyStart + HOUR)).toBe(
      true,
    );
    // ...but is removed once a buffer applies
    expect(
      withBuffer.some((s) => s.bayId === "bay1" && s.startMs === busyStart + HOUR),
    ).toBe(false);
  });

  it("applies facility-wide blackouts to all bays", () => {
    const slots = computeAvailableSlots(
      input({
        blackouts: [{ startMs: openStart, endMs: openEnd, bayId: null }],
      }),
    );
    expect(slots).toHaveLength(0);
  });

  it("excludes offline bays", () => {
    const slots = computeAvailableSlots(
      input({
        bays: [
          { id: "bay1", name: "Bay 1", capacity: 6, active: true, maintenanceStatus: "offline" },
        ],
      }),
    );
    expect(slots).toHaveLength(0);
  });

  it("hides same-day slots inside the cutoff", () => {
    const slots = computeAvailableSlots(
      input({ nowMs: openStart, sameDayCutoffMinutes: 120 }),
    );
    expect(slots.every((s) => s.startMs >= openStart + 2 * HOUR)).toBe(true);
  });

  it("returns nothing when closed", () => {
    expect(computeAvailableSlots(input({ openWindow: null }))).toHaveLength(0);
  });

  it("never emits a slot ending after close", () => {
    const slots = computeAvailableSlots(input({ durationMinutes: 120 }));
    expect(slots.every((s) => s.endMs <= openEnd)).toBe(true);
  });
});

describe("groupSlotsByTime", () => {
  it("assigns the smallest bay that fits the party", () => {
    const slots = computeAvailableSlots(input());
    const options = groupSlotsByTime(slots, 3);
    // Capacity-4 bay preferred for a party of 3, keeping the big bay open
    expect(options[0]?.assignedBayId).toBe("bay2");
  });

  it("uses the larger bay for big groups", () => {
    const slots = computeAvailableSlots(input());
    const options = groupSlotsByTime(slots, 6);
    expect(options[0]?.assignedBayId).toBe("bay1");
  });

  it("drops times where no bay fits the party", () => {
    const slots = computeAvailableSlots(
      input({
        bays: [
          { id: "bay2", name: "Bay 2", capacity: 4, active: true, maintenanceStatus: "operational" },
        ],
      }),
    );
    expect(groupSlotsByTime(slots, 6)).toHaveLength(0);
  });
});

describe("computeOpenWindows", () => {
  const window = { startMs: openStart, endMs: openEnd };

  it("returns the whole window when nothing is booked", () => {
    expect(computeOpenWindows(window, [])).toEqual([window]);
  });

  it("splits around bookings", () => {
    const busy = [
      { startMs: openStart + 2 * HOUR, endMs: openStart + 3 * HOUR },
      { startMs: openStart + 5 * HOUR, endMs: openStart + 6 * HOUR },
    ];
    expect(computeOpenWindows(window, busy)).toEqual([
      { startMs: openStart, endMs: openStart + 2 * HOUR },
      { startMs: openStart + 3 * HOUR, endMs: openStart + 5 * HOUR },
      { startMs: openStart + 6 * HOUR, endMs: openEnd },
    ]);
  });

  it("merges overlapping bookings and clips to the window", () => {
    const busy = [
      { startMs: openStart - HOUR, endMs: openStart + 2 * HOUR },
      { startMs: openStart + HOUR, endMs: openStart + 4 * HOUR },
    ];
    expect(computeOpenWindows(window, busy)).toEqual([
      { startMs: openStart + 4 * HOUR, endMs: openEnd },
    ]);
  });

  it("returns nothing when fully booked", () => {
    expect(
      computeOpenWindows(window, [{ startMs: openStart, endMs: openEnd }]),
    ).toEqual([]);
  });

  it("ignores busy intervals outside the window", () => {
    expect(
      computeOpenWindows(window, [
        { startMs: openEnd + HOUR, endMs: openEnd + 2 * HOUR },
      ]),
    ).toEqual([window]);
  });
});
