import { describe, expect, it } from "vitest";
import { assessCancellation, canCustomerReschedule } from "@/lib/bookings/cancellation";

const startsAt = new Date("2026-11-10T18:00:00Z");

describe("assessCancellation", () => {
  it("refunds in full outside the window", () => {
    const result = assessCancellation({
      startsAt,
      now: new Date("2026-11-08T18:00:00Z"), // 48h before
      windowHours: 24,
      totalPaidCents: 4280,
    });
    expect(result.beforeDeadline).toBe(true);
    expect(result.refundEligibleCents).toBe(4280);
  });

  it("offers credit only inside the window", () => {
    const result = assessCancellation({
      startsAt,
      now: new Date("2026-11-10T06:00:00Z"), // 12h before
      windowHours: 24,
      totalPaidCents: 4280,
    });
    expect(result.beforeDeadline).toBe(false);
    expect(result.refundEligibleCents).toBe(0);
    expect(result.creditEligibleCents).toBe(4280);
  });

  it("computes the exact deadline", () => {
    const result = assessCancellation({
      startsAt,
      now: new Date("2026-11-01T00:00:00Z"),
      windowHours: 24,
      totalPaidCents: 0,
    });
    expect(result.deadline.toISOString()).toBe("2026-11-09T18:00:00.000Z");
  });

  it("treats exactly-at-deadline as inside the window", () => {
    const result = assessCancellation({
      startsAt,
      now: new Date("2026-11-09T18:00:00Z"),
      windowHours: 24,
      totalPaidCents: 100,
    });
    expect(result.beforeDeadline).toBe(false);
  });
});

describe("canCustomerReschedule", () => {
  it("allows rescheduling a confirmed booking more than 2h out", () => {
    expect(
      canCustomerReschedule({
        startsAt,
        now: new Date("2026-11-10T15:00:00Z"),
        status: "confirmed",
      }),
    ).toBe(true);
  });

  it("blocks rescheduling within 2 hours", () => {
    expect(
      canCustomerReschedule({
        startsAt,
        now: new Date("2026-11-10T16:30:00Z"),
        status: "confirmed",
      }),
    ).toBe(false);
  });

  it("blocks rescheduling non-confirmed bookings", () => {
    expect(
      canCustomerReschedule({
        startsAt,
        now: new Date("2026-11-08T00:00:00Z"),
        status: "cancelled_by_customer",
      }),
    ).toBe(false);
  });
});
