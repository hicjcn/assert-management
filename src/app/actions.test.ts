import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAccount: vi.fn(),
  createAccountChange: vi.fn(),
  createGoal: vi.fn(),
  deleteAccount: vi.fn(),
  deleteGoal: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  redirect: vi.fn(),
  requireSession: vi.fn().mockResolvedValue({
    userId: "user-1",
    username: "owner",
  }),
  updateAccount: vi.fn(),
  updateGoal: vi.fn(),
  updateGoalBudget: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/assets", () => ({
  createAccount: mocks.createAccount,
  createAccountChange: mocks.createAccountChange,
  deleteAccount: mocks.deleteAccount,
  updateAccount: mocks.updateAccount,
}));
vi.mock("@/server/auth", () => ({
  login: mocks.login,
  logout: mocks.logout,
  requireSession: mocks.requireSession,
}));
vi.mock("@/server/goals", () => ({
  createGoal: mocks.createGoal,
  deleteGoal: mocks.deleteGoal,
  updateGoal: mocks.updateGoal,
  updateGoalBudget: mocks.updateGoalBudget,
}));
vi.mock("@/server/cache", () => ({
  assetDataCacheTag: (userId: string) => `user:${userId}:assets`,
  goalDataCacheTag: (userId: string) => `user:${userId}:goals`,
}));

import {
  createAccountAction,
  createAccountChangeAction,
  createGoalAction,
  deleteAccountAction,
  deleteGoalAction,
  updateAccountAction,
  updateGoalAction,
  updateGoalBudgetAction,
} from "@/app/actions";

describe("server action cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["create account", createAccountAction, mocks.createAccount],
    ["update account", updateAccountAction, mocks.updateAccount],
    ["delete account", deleteAccountAction, mocks.deleteAccount],
    ["create account change", createAccountChangeAction, mocks.createAccountChange],
  ])("invalidates asset data after %s", async (_name, action, mutation) => {
    const data = new FormData();

    await action(data);

    expect(mutation).toHaveBeenCalledWith("user-1", data);
    expect(mocks.updateTag).toHaveBeenCalledWith("user:user-1:assets");
  });

  it.each([
    ["create goal", createGoalAction, mocks.createGoal],
    ["update goal", updateGoalAction, mocks.updateGoal],
    ["delete goal", deleteGoalAction, mocks.deleteGoal],
    ["update goal budget", updateGoalBudgetAction, mocks.updateGoalBudget],
  ])("invalidates goal data after %s", async (_name, action, mutation) => {
    const data = new FormData();

    await action(data);

    expect(mutation).toHaveBeenCalledWith("user-1", data);
    expect(mocks.updateTag).toHaveBeenCalledWith("user:user-1:goals");
  });
});
