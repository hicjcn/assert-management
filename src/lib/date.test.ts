import { describe, expect, it } from "vitest";

import {
  chinaMonthEnd,
  chinaMonthStart,
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatShortDateTime,
  monthKey,
  parseChinaDateTimeLocal,
  toDateTimeLocalValue,
} from "@/lib/date";

describe("china timezone date helpers", () => {
  it("formats instants in UTC+8 instead of the server timezone", () => {
    const value = new Date("2026-06-30T16:05:00.000Z");

    expect(formatDate(value)).toBe("2026-07-01");
    expect(formatDateTime(value)).toBe("2026-07-01 00:05");
    expect(formatShortDateTime(value)).toBe("07/01 00:05");
    expect(formatMonthYear(value)).toBe("2026年7月");
    expect(monthKey(value)).toBe("2026-07");
  });

  it("serializes and parses datetime-local values as UTC+8 wall time", () => {
    const value = new Date("2026-07-05T04:30:00.000Z");

    expect(toDateTimeLocalValue(value)).toBe("2026-07-05T12:30");
    expect(parseChinaDateTimeLocal("2026-07-05T12:30").toISOString()).toBe(
      "2026-07-05T04:30:00.000Z",
    );
    expect(
      parseChinaDateTimeLocal("2026-07-05T04:30:00.000Z").toISOString(),
    ).toBe("2026-07-05T04:30:00.000Z");
  });

  it("calculates month boundaries in UTC+8", () => {
    const value = new Date("2026-07-15T10:00:00.000Z");

    expect(chinaMonthStart(value).toISOString()).toBe(
      "2026-06-30T16:00:00.000Z",
    );
    expect(chinaMonthEnd(value).toISOString()).toBe(
      "2026-07-31T15:59:59.999Z",
    );
    expect(chinaMonthEnd("2026-01-31T20:00:00.000Z").toISOString()).toBe(
      "2026-02-28T15:59:59.999Z",
    );
  });
});
