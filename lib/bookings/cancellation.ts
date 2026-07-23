/**
 * Cancellation policy logic (pure, unit-tested).
 *
 * Policy: cancellations made at least `windowHours` before the
 * session start receive a full refund (or full credit). Inside the
 * window, customers may reschedule or receive account credit at
 * staff discretion; card refunds are not automatic.
 */

export interface CancellationAssessment {
  deadline: Date;
  beforeDeadline: boolean;
  refundEligibleCents: number;
  creditEligibleCents: number;
}

export function assessCancellation(params: {
  startsAt: Date;
  now: Date;
  windowHours: number;
  totalPaidCents: number;
}): CancellationAssessment {
  const { startsAt, now, windowHours, totalPaidCents } = params;
  const deadline = new Date(startsAt.getTime() - windowHours * 3_600_000);
  const beforeDeadline = now < deadline;

  return {
    deadline,
    beforeDeadline,
    refundEligibleCents: beforeDeadline ? totalPaidCents : 0,
    creditEligibleCents: totalPaidCents,
  };
}

/** True when the booking can still be rescheduled by the customer. */
export function canCustomerReschedule(params: {
  startsAt: Date;
  now: Date;
  status: string;
}): boolean {
  const { startsAt, now, status } = params;
  if (status !== "confirmed") return false;
  // Reschedules allowed until 2 hours before start.
  return now < new Date(startsAt.getTime() - 2 * 3_600_000);
}
