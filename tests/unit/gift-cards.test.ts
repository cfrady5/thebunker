import { describe, expect, it } from "vitest";
import {
  applyGiftCard,
  generateGiftCardCode,
  giftCardLast4,
  hashGiftCardCode,
  normalizeGiftCardCode,
} from "@/lib/gift-cards/logic";

describe("gift card codes", () => {
  it("generates well-formed codes", () => {
    const code = generateGiftCardCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    // Ambiguous characters excluded
    expect(code).not.toMatch(/[01OI]/);
  });

  it("hashes consistently regardless of formatting", () => {
    const code = generateGiftCardCode();
    expect(hashGiftCardCode(code)).toBe(hashGiftCardCode(code.toLowerCase()));
    expect(hashGiftCardCode(code)).toBe(hashGiftCardCode(code.replace(/-/g, " ")));
  });

  it("normalizes user input", () => {
    expect(normalizeGiftCardCode("ab-cd ef")).toBe("ABCDEF");
  });

  it("extracts the last four characters", () => {
    expect(giftCardLast4("ABCD-EFGH-JKLM-NPQR")).toBe("NPQR");
  });
});

describe("applyGiftCard", () => {
  it("fully covers a smaller charge", () => {
    const result = applyGiftCard({ remainingBalanceCents: 5000, amountDueCents: 3000 });
    expect(result).toEqual({
      amountUsedCents: 3000,
      remainingBalanceCents: 2000,
      fullyDepleted: false,
    });
  });

  it("partially covers a larger charge and depletes", () => {
    const result = applyGiftCard({ remainingBalanceCents: 2000, amountDueCents: 3000 });
    expect(result).toEqual({
      amountUsedCents: 2000,
      remainingBalanceCents: 0,
      fullyDepleted: true,
    });
  });

  it("handles zero-balance cards", () => {
    const result = applyGiftCard({ remainingBalanceCents: 0, amountDueCents: 3000 });
    expect(result.amountUsedCents).toBe(0);
  });

  it("rejects negative amounts", () => {
    expect(() =>
      applyGiftCard({ remainingBalanceCents: -1, amountDueCents: 100 }),
    ).toThrow();
  });
});
