import type { PricingRule } from "@/types";

/**
 * Pure pricing engine. All inputs are explicit so the logic is
 * unit-testable and independent of the database.
 * Money is always integer cents.
 */

export interface PriceContext {
  /** Local facility date pieces for the booking start. */
  dayOfWeek: number; // 0 = Sunday
  /** "HH:MM" local start time */
  startTime: string;
  /** ISO date (YYYY-MM-DD) local */
  date: string;
  serviceType: PricingRule["service_type"];
  membershipPlanId?: string | null;
}

function timeToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

function ruleMatches(rule: PricingRule, ctx: PriceContext): boolean {
  if (!rule.active) return false;
  if (rule.service_type !== ctx.serviceType) return false;
  if (rule.day_of_week !== null && rule.day_of_week !== ctx.dayOfWeek) return false;
  if (rule.membership_plan_id && rule.membership_plan_id !== ctx.membershipPlanId) {
    return false;
  }
  if (rule.effective_from && ctx.date < rule.effective_from) return false;
  if (rule.effective_to && ctx.date > rule.effective_to) return false;
  if (rule.starts_at && rule.ends_at) {
    const start = timeToMinutes(ctx.startTime);
    if (start < timeToMinutes(rule.starts_at) || start >= timeToMinutes(rule.ends_at)) {
      return false;
    }
  }
  return true;
}

/**
 * Picks the applicable rule: highest priority wins; membership-
 * specific rules beat general rules at equal priority.
 */
export function resolvePricingRule(
  rules: PricingRule[],
  ctx: PriceContext,
): PricingRule | null {
  const matches = rules.filter((r) => ruleMatches(r, ctx));
  if (matches.length === 0) return null;
  matches.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aMember = a.membership_plan_id ? 1 : 0;
    const bMember = b.membership_plan_id ? 1 : 0;
    return bMember - aMember;
  });
  return matches[0] ?? null;
}

export interface QuoteInput {
  rule: PricingRule;
  durationMinutes: number;
  taxRate: number; // e.g. 0.07
  discountCents?: number;
  creditCents?: number;
  membershipDiscountPercent?: number;
}

export interface Quote {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  creditAppliedCents: number;
  totalCents: number;
  units: number;
}

/**
 * Computes a booking quote. Duration is billed in whole billing
 * units (rounded up). Discounts apply before tax; credits apply
 * after tax and never drive the total below zero.
 */
export function computeQuote(input: QuoteInput): Quote {
  const {
    rule,
    durationMinutes,
    taxRate,
    discountCents = 0,
    creditCents = 0,
    membershipDiscountPercent = 0,
  } = input;

  if (durationMinutes <= 0) {
    throw new Error("Duration must be positive");
  }

  const units = Math.ceil(durationMinutes / rule.billing_unit_minutes);
  const gross = units * rule.price_per_unit_cents;

  const membershipDiscount = Math.round((gross * membershipDiscountPercent) / 100);
  const totalDiscount = Math.min(gross, membershipDiscount + discountCents);

  const taxable = gross - totalDiscount;
  const tax = Math.round(taxable * taxRate);

  const beforeCredit = taxable + tax;
  const creditApplied = Math.min(beforeCredit, Math.max(0, creditCents));

  return {
    subtotalCents: gross,
    discountCents: totalDiscount,
    taxCents: tax,
    creditAppliedCents: creditApplied,
    totalCents: beforeCredit - creditApplied,
    units,
  };
}

export interface DiscountCodeLike {
  discount_type: "percentage" | "fixed_amount";
  value: number;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
}

export type DiscountValidation =
  | { valid: true; discountCents: number }
  | { valid: false; reason: "inactive" | "not_started" | "expired" | "exhausted" };

/** Validates a discount code against a subtotal at a point in time. */
export function validateDiscountCode(
  code: DiscountCodeLike,
  subtotalCents: number,
  now: Date,
): DiscountValidation {
  if (!code.active) return { valid: false, reason: "inactive" };
  if (code.starts_at && now < new Date(code.starts_at)) {
    return { valid: false, reason: "not_started" };
  }
  if (code.expires_at && now > new Date(code.expires_at)) {
    return { valid: false, reason: "expired" };
  }
  if (code.usage_limit !== null && code.usage_count >= code.usage_limit) {
    return { valid: false, reason: "exhausted" };
  }
  const discountCents =
    code.discount_type === "percentage"
      ? Math.round((subtotalCents * Math.min(code.value, 100)) / 100)
      : Math.min(code.value, subtotalCents);
  return { valid: true, discountCents };
}
