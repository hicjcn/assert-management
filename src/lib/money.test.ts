import { describe, expect, it } from "vitest";

import { formatCents, yuanToCents } from "@/lib/money";

describe("money helpers", () => {
  it("converts yuan strings to integer cents", () => {
    expect(yuanToCents("123.45")).toBe(12345n);
    expect(yuanToCents("-8.5")).toBe(-850n);
  });

  it("formats cents as CNY", () => {
    expect(formatCents(1234567n)).toBe("¥12,345.67");
    expect(formatCents(500n, { signed: true })).toBe("+¥5.00");
  });
});
