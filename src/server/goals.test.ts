import { describe, expect, it } from "vitest";

import { calculateGoalProjection } from "@/server/goals";

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
