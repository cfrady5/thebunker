import { describe, expect, it } from "vitest";
import {
  applyIncludedMinutes,
  renewIncludedMinutes,
} from "@/lib/memberships/minutes";

describe("applyIncludedMinutes", () => {
  it("covers a booking fully when enough minutes remain", () => {
    expect(applyIncludedMinutes({ minutesRemaining: 240, bookingMinutes: 60 })).toEqual({
      minutesApplied: 60,
      minutesRemaining: 180,
      billableMinutes: 0,
    });
  });

  it("splits a booking when minutes run short", () => {
    expect(applyIncludedMinutes({ minutesRemaining: 30, bookingMinutes: 90 })).toEqual({
      minutesApplied: 30,
      minutesRemaining: 0,
      billableMinutes: 60,
    });
  });

  it("rejects invalid input", () => {
    expect(() =>
      applyIncludedMinutes({ minutesRemaining: -1, bookingMinutes: 60 }),
    ).toThrow();
    expect(() =>
      applyIncludedMinutes({ minutesRemaining: 60, bookingMinutes: 0 }),
    ).toThrow();
  });
});

describe("renewIncludedMinutes", () => {
  it("resets with no rollover", () => {
    expect(
      renewIncludedMinutes({
        currentRemaining: 100,
        planIncludedMinutes: 240,
        rolloverRule: "none",
      }),
    ).toBe(240);
  });

  it("carries at most one period forward with one_period rollover", () => {
    expect(
      renewIncludedMinutes({
        currentRemaining: 500,
        planIncludedMinutes: 240,
        rolloverRule: "one_period",
      }),
    ).toBe(480);
    expect(
      renewIncludedMinutes({
        currentRemaining: 100,
        planIncludedMinutes: 240,
        rolloverRule: "one_period",
      }),
    ).toBe(340);
  });

  it("accumulates with unlimited rollover", () => {
    expect(
      renewIncludedMinutes({
        currentRemaining: 500,
        planIncludedMinutes: 240,
        rolloverRule: "unlimited",
      }),
    ).toBe(740);
  });
});
