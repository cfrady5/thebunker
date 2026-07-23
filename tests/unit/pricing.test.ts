import { describe, expect, it } from "vitest";
import {
  computeQuote,
  resolvePricingRule,
  validateDiscountCode,
  type DiscountCodeLike,
} from "@/lib/pricing/engine";
import type { PricingRule } from "@/types";

function rule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: "r1",
    name: "Standard",
    service_type: "bay_rental",
    day_of_week: null,
    starts_at: null,
    ends_at: null,
    price_per_unit_cents: 2000,
    billing_unit_minutes: 30,
    membership_plan_id: null,
    effective_from: null,
    effective_to: null,
    priority: 0,
    active: true,
    ...overrides,
  };
}

describe("resolvePricingRule", () => {
  const standard = rule();
  const offPeak = rule({
    id: "r2",
    name: "Off-peak",
    day_of_week: 2,
    starts_at: "09:00",
    ends_at: "16:00",
    price_per_unit_cents: 1500,
    priority: 10,
  });

  const ctx = {
    date: "2026-11-10", // a Tuesday
    serviceType: "bay_rental" as const,
  };

  it("picks the highest-priority matching rule", () => {
    const result = resolvePricingRule([standard, offPeak], {
      ...ctx,
      dayOfWeek: 2,
      startTime: "10:00",
    });
    expect(result?.id).toBe("r2");
  });

  it("falls back to the standard rule outside the window", () => {
    const result = resolvePricingRule([standard, offPeak], {
      ...ctx,
      dayOfWeek: 2,
      startTime: "18:00",
    });
    expect(result?.id).toBe("r1");
  });

  it("ignores inactive rules", () => {
    const result = resolvePricingRule([rule({ active: false })], {
      ...ctx,
      dayOfWeek: 2,
      startTime: "10:00",
    });
    expect(result).toBeNull();
  });

  it("respects effective date ranges", () => {
    const seasonal = rule({ id: "r3", effective_from: "2027-01-01", priority: 50 });
    const result = resolvePricingRule([standard, seasonal], {
      ...ctx,
      dayOfWeek: 2,
      startTime: "10:00",
    });
    expect(result?.id).toBe("r1");
  });
});

describe("computeQuote", () => {
  it("bills whole units, rounded up", () => {
    const quote = computeQuote({ rule: rule(), durationMinutes: 45, taxRate: 0 });
    expect(quote.units).toBe(2);
    expect(quote.subtotalCents).toBe(4000);
  });

  it("computes tax after discount", () => {
    const quote = computeQuote({
      rule: rule(),
      durationMinutes: 60,
      taxRate: 0.07,
      discountCents: 1000,
    });
    expect(quote.subtotalCents).toBe(4000);
    expect(quote.discountCents).toBe(1000);
    expect(quote.taxCents).toBe(Math.round(3000 * 0.07));
    expect(quote.totalCents).toBe(3000 + Math.round(3000 * 0.07));
  });

  it("applies membership percentage discounts", () => {
    const quote = computeQuote({
      rule: rule(),
      durationMinutes: 60,
      taxRate: 0,
      membershipDiscountPercent: 15,
    });
    expect(quote.discountCents).toBe(600);
    expect(quote.totalCents).toBe(3400);
  });

  it("caps credits at the amount due and never goes negative", () => {
    const quote = computeQuote({
      rule: rule(),
      durationMinutes: 30,
      taxRate: 0,
      creditCents: 99999,
    });
    expect(quote.creditAppliedCents).toBe(2000);
    expect(quote.totalCents).toBe(0);
  });

  it("rejects non-positive durations", () => {
    expect(() =>
      computeQuote({ rule: rule(), durationMinutes: 0, taxRate: 0 }),
    ).toThrow();
  });
});

describe("validateDiscountCode", () => {
  const base: DiscountCodeLike = {
    discount_type: "percentage",
    value: 20,
    starts_at: null,
    expires_at: null,
    usage_limit: null,
    usage_count: 0,
    active: true,
  };
  const now = new Date("2026-10-01T12:00:00Z");

  it("computes percentage discounts", () => {
    const result = validateDiscountCode(base, 5000, now);
    expect(result).toEqual({ valid: true, discountCents: 1000 });
  });

  it("caps fixed discounts at the subtotal", () => {
    const result = validateDiscountCode(
      { ...base, discount_type: "fixed_amount", value: 10000 },
      5000,
      now,
    );
    expect(result).toEqual({ valid: true, discountCents: 5000 });
  });

  it("rejects expired codes", () => {
    const result = validateDiscountCode(
      { ...base, expires_at: "2026-09-01T00:00:00Z" },
      5000,
      now,
    );
    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects exhausted codes", () => {
    const result = validateDiscountCode(
      { ...base, usage_limit: 5, usage_count: 5 },
      5000,
      now,
    );
    expect(result).toEqual({ valid: false, reason: "exhausted" });
  });

  it("rejects inactive codes", () => {
    const result = validateDiscountCode({ ...base, active: false }, 5000, now);
    expect(result).toEqual({ valid: false, reason: "inactive" });
  });
});
