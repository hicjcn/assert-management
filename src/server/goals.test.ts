import { describe, expect, it } from "vitest";

import {
  AccountCategory,
  AccountType,
  ChangeType,
} from "@/generated/prisma/enums";
import {
  calculateGoalCurrentAmount,
  calculateGoalProjection,
  calculateGoalTrendProjection,
} from "@/server/goals";

const baseGoal = {
  targetAmount: 1200000n,
  currentAmount: 200000n,
  monthlyIncome: 100000n,
  monthlyRent: 20000n,
  monthlyFood: 15000n,
  monthlyLiving: 10000n,
  monthlyOtherExpense: 5000n,
  monthlyOtherIncome: 10000n,
  oneTimeIncome: 0n,
  oneTimeExpense: 0n,
};

describe("goal projections", () => {
  it("calculates progress, monthly net amount, and estimated reach date", () => {
    const projection = calculateGoalProjection(
      baseGoal,
      new Date("2026-07-05T00:00:00.000Z"),
    );

    expect(projection.effectiveCurrentAmount).toBe(200000n);
    expect(projection.monthlyNetAmount).toBe(60000n);
    expect(projection.remainingAmount).toBe(1000000n);
    expect(projection.progressPercent).toBe(16.66);
    expect(projection.monthsToReach).toBe(17);
    expect(projection.estimatedReachDate?.toISOString()).toBe(
      "2027-12-05T00:00:00.000Z",
    );
  });

  it("marks a goal as reached when current and one-time income cover it", () => {
    const projection = calculateGoalProjection({
      ...baseGoal,
      targetAmount: 300000n,
      oneTimeIncome: 100000n,
    });

    expect(projection.remainingAmount).toBe(0n);
    expect(projection.progressPercent).toBe(100);
    expect(projection.monthsToReach).toBe(0);
    expect(projection.estimatedReachDate).toBeInstanceOf(Date);
  });

  it("returns no estimated date when monthly net amount is not positive", () => {
    const projection = calculateGoalProjection({
      ...baseGoal,
      monthlyIncome: 10000n,
      monthlyOtherIncome: 0n,
    });

    expect(projection.monthlyNetAmount).toBe(-40000n);
    expect(projection.monthsToReach).toBeNull();
    expect(projection.estimatedReachDate).toBeNull();
  });
});

describe("goal current amount", () => {
  const accounts = [
    {
      id: "asset-included",
      type: AccountType.ASSET,
      currentAmount: 500000n,
      includeInStats: true,
      archived: false,
    },
    {
      id: "asset-excluded",
      type: AccountType.ASSET,
      currentAmount: 200000n,
      includeInStats: false,
      archived: false,
    },
    {
      id: "liability-included",
      type: AccountType.LIABILITY,
      currentAmount: 120000n,
      includeInStats: true,
      archived: false,
    },
    {
      id: "asset-archived",
      type: AccountType.ASSET,
      currentAmount: 900000n,
      includeInStats: true,
      archived: true,
    },
  ];

  it("uses dashboard net worth when no accounts are linked", () => {
    expect(calculateGoalCurrentAmount(accounts, [])).toBe(380000n);
  });

  it("sums linked active asset accounts regardless of dashboard inclusion", () => {
    expect(
      calculateGoalCurrentAmount(accounts, [
        "asset-included",
        "asset-excluded",
      ]),
    ).toBe(700000n);
  });

  it("does not fall back to net worth when linked accounts are unavailable", () => {
    expect(
      calculateGoalCurrentAmount(accounts, ["asset-archived"]),
    ).toBe(0n);
  });
});

describe("goal trend projection", () => {
  const baseDate = new Date("2026-07-17T00:00:00.000Z");
  const accounts = [
    {
      id: "saving",
      type: AccountType.ASSET,
      currentAmount: 60000n,
      includeInStats: true,
      archived: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    {
      id: "other-asset",
      type: AccountType.ASSET,
      currentAmount: 900000n,
      includeInStats: true,
      archived: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    {
      id: "liability",
      type: AccountType.LIABILITY,
      currentAmount: 12000n,
      includeInStats: true,
      archived: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ];
  const changes = [
    {
      accountId: "saving",
      type: ChangeType.INITIAL,
      categorySnapshot: AccountCategory.DEBIT_CARD,
      changeAmount: 500000n,
      changedAt: new Date("2026-02-02T00:00:00.000Z"),
    },
    {
      accountId: "saving",
      type: ChangeType.INCREASE,
      categorySnapshot: AccountCategory.DEBIT_CARD,
      changeAmount: 30000n,
      changedAt: new Date("2026-03-02T00:00:00.000Z"),
    },
    {
      accountId: "saving",
      type: ChangeType.INCREASE,
      categorySnapshot: AccountCategory.DEBIT_CARD,
      changeAmount: 30000n,
      changedAt: new Date("2026-06-02T00:00:00.000Z"),
    },
    {
      accountId: "other-asset",
      type: ChangeType.INCREASE,
      categorySnapshot: AccountCategory.INVESTMENT,
      changeAmount: 60000n,
      changedAt: new Date("2026-05-02T00:00:00.000Z"),
    },
    {
      accountId: "liability",
      type: ChangeType.INCREASE,
      categorySnapshot: AccountCategory.CREDIT_CARD,
      changeAmount: 12000n,
      changedAt: new Date("2026-05-03T00:00:00.000Z"),
    },
  ];

  it("counts initial registered assets in the account creation month", () => {
    const trend = calculateGoalTrendProjection(
      { targetAmount: 120000n, currentAmount: 60000n },
      accounts,
      ["saving"],
      changes,
      baseDate,
    );

    expect(trend.observedMonths).toBe(6);
    expect(trend.changeCount).toBe(3);
    expect(trend.monthlyTrendAmount).toBe(93333n);
    expect(trend.monthlyBreakdown).toEqual([
      { month: "2026-02", amount: 500000n, changeCount: 1 },
      { month: "2026-03", amount: 30000n, changeCount: 1 },
      { month: "2026-04", amount: 0n, changeCount: 0 },
      { month: "2026-05", amount: 0n, changeCount: 0 },
      { month: "2026-06", amount: 30000n, changeCount: 1 },
      { month: "2026-07", amount: 0n, changeCount: 0 },
    ]);
    expect(trend.monthsToReach).toBe(1);
    expect(trend.estimatedReachDate?.toISOString()).toBe(
      "2026-08-17T00:00:00.000Z",
    );
  });

  it("uses net-worth direction when no accounts are linked", () => {
    const trend = calculateGoalTrendProjection(
      { targetAmount: 156000n, currentAmount: 108000n },
      accounts,
      [],
      changes,
      baseDate,
    );

    expect(trend.monthlyTrendAmount).toBe(101333n);
    expect(trend.changeCount).toBe(5);
    expect(trend.monthlyBreakdown.map((month) => month.amount)).toEqual([
      500000n,
      30000n,
      0n,
      48000n,
      30000n,
      0n,
    ]);
  });

  it("reports insufficient data when there are no account changes", () => {
    const trend = calculateGoalTrendProjection(
      { targetAmount: 120000n, currentAmount: 60000n },
      accounts,
      ["saving"],
      [],
      baseDate,
    );

    expect(trend.changeCount).toBe(0);
    expect(trend.monthlyTrendAmount).toBe(0n);
    expect(trend.monthsToReach).toBeNull();
    expect(trend.estimatedReachDate).toBeNull();
  });

  it("uses only available months for a newly created account", () => {
    const newAccount = {
      ...accounts[0],
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    };
    const trend = calculateGoalTrendProjection(
      { targetAmount: 70000n, currentAmount: 60000n },
      [newAccount],
      ["saving"],
      [
        {
          accountId: "saving",
          type: ChangeType.INCREASE,
          categorySnapshot: AccountCategory.DEBIT_CARD,
          changeAmount: 10000n,
          changedAt: new Date("2026-07-10T00:00:00.000Z"),
        },
      ],
      baseDate,
    );

    expect(trend.observedMonths).toBe(1);
    expect(trend.monthlyTrendAmount).toBe(10000n);
    expect(trend.monthsToReach).toBe(1);
  });
});
