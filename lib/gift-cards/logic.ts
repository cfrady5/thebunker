import { createHash, randomBytes } from "crypto";

/**
 * Gift card code + balance logic. Raw codes are never stored:
 * only a SHA-256 hash and the last 4 characters for display.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateGiftCardCode(): string {
  const bytes = randomBytes(16);
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += CODE_ALPHABET[(bytes[i] ?? 0) % CODE_ALPHABET.length];
    if (i % 4 === 3 && i < 15) code += "-";
  }
  return code; // e.g. XXXX-XXXX-XXXX-XXXX
}

export function hashGiftCardCode(code: string): string {
  return createHash("sha256").update(normalizeGiftCardCode(code)).digest("hex");
}

export function normalizeGiftCardCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function giftCardLast4(code: string): string {
  return normalizeGiftCardCode(code).slice(-4);
}

export interface RedemptionResult {
  amountUsedCents: number;
  remainingBalanceCents: number;
  fullyDepleted: boolean;
}

/**
 * Applies a gift card to an amount due. Partial redemption is
 * supported; the card can never go negative.
 */
export function applyGiftCard(params: {
  remainingBalanceCents: number;
  amountDueCents: number;
}): RedemptionResult {
  const { remainingBalanceCents, amountDueCents } = params;
  if (remainingBalanceCents < 0 || amountDueCents < 0) {
    throw new Error("Amounts must be non-negative");
  }
  const used = Math.min(remainingBalanceCents, amountDueCents);
  const remaining = remainingBalanceCents - used;
  return {
    amountUsedCents: used,
    remainingBalanceCents: remaining,
    fullyDepleted: remaining === 0,
  };
}
