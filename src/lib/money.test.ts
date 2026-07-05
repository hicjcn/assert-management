import { describe, expect, it } from "vitest";

import {
  formatAccountCents,
  formatAccountChangeCents,
  formatCents,
  yuanToCents,
} from "@/lib/money";

describe("money helpers", () => {
  it("converts yuan strings to integer cents", () => {
    expect(yuanToCents("123.45")).toBe(12345n);
    expect(yuanToCents("-8.5")).toBe(-850n);
  });

  it("formats cents as whole-yuan CNY", () => {
    expect(formatCents(1234567n)).toBe("¥12,346");
    expect(formatCents(500n, { signed: true })).toBe("+¥5");
    expect(formatCents(-12345n)).toBe("-¥123");
  });

  it("formats negative asset account amounts as negative", () => {
    expect(formatAccountCents(30000n, { category: "credit_card" })).toBe(
      "-¥300",
    );
    expect(formatAccountCents(100000n, { category: "liability_account" })).toBe(
      "-¥1,000",
    );
    expect(formatAccountCents(100000n, { type: "liability" })).toBe("-¥1,000");
    expect(formatAccountCents(100000n, { category: "debit_card" })).toBe(
      "¥1,000",
    );
  });

  it("formats set changes as the resulting balance and delta changes as signed amounts", () => {
    expect(
      formatAccountChangeCents(
        { type: "set", changeAmount: -20000n, afterAmount: 80000n },
        { category: "debit_card" },
      ),
    ).toBe("¥800");
    expect(
      formatAccountChangeCents(
        { type: "increase", changeAmount: 2500n, afterAmount: 102500n },
        { category: "debit_card" },
      ),
    ).toBe("+¥25");
  });
});
