import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountCategory,
  AccountType,
  ChangeType,
} from "@/generated/prisma/enums";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  account: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  accountChange: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: prismaMock,
}));

import {
  createAccount,
  createAccountChange,
  deleteAccount,
  getAccount,
  getDashboard,
  listAccountChanges,
  listAccounts,
  updateAccount,
} from "@/server/assets";

function formData(values: Record<string, string | undefined>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      data.set(key, value);
    }
  }

  return data;
}

describe("asset services", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("createAccount", () => {
    it("creates an asset account and an initial change record", async () => {
      const now = new Date("2026-07-05T10:20:30.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const tx = {
        account: {
          create: vi.fn().mockResolvedValue({
            id: "account-1",
            name: "现金钱包",
            category: AccountCategory.CASH,
          }),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      await createAccount(
        "user-1",
        formData({
          name: "现金钱包",
          category: "cash",
          currentAmount: "1234.56",
          includeInStats: "on",
          note: "备用金",
        }),
      );

      expect(tx.account.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          name: "现金钱包",
          category: AccountCategory.CASH,
          type: AccountType.ASSET,
          currentAmount: 123456n,
          includeInStats: true,
          note: "备用金",
        },
      });
      expect(tx.accountChange.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          accountId: "account-1",
          accountNameSnapshot: "现金钱包",
          categorySnapshot: AccountCategory.CASH,
          type: ChangeType.INITIAL,
          beforeAmount: 0n,
          changeAmount: 123456n,
          afterAmount: 123456n,
          note: "创建账户",
          changedAt: now,
        },
      });
    });

    it("infers liability type for credit card accounts", async () => {
      const tx = {
        account: {
          create: vi.fn().mockResolvedValue({
            id: "account-2",
            name: "信用卡",
            category: AccountCategory.CREDIT_CARD,
          }),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      await createAccount(
        "user-1",
        formData({
          name: "信用卡",
          category: "credit_card",
          currentAmount: "300.00",
        }),
      );

      expect(tx.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: AccountType.LIABILITY,
            includeInStats: false,
          }),
        }),
      );
    });
  });

  describe("createAccountChange", () => {
    const baseAccount = {
      id: "account-1",
      userId: "user-1",
      name: "工资卡",
      category: AccountCategory.DEBIT_CARD,
      type: AccountType.ASSET,
      currentAmount: 100000n,
      includeInStats: true,
      archived: false,
      note: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    };

    function mockChangeTransaction(account = baseAccount) {
      const tx = {
        account: {
          findFirst: vi.fn().mockResolvedValue(account),
          update: vi.fn(),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      return tx;
    }

    it.each([
      ["increase", "25.50", 2550n, 102550n, ChangeType.INCREASE],
      ["decrease", "25.50", -2550n, 97450n, ChangeType.DECREASE],
      ["set", "800.00", -20000n, 80000n, ChangeType.SET],
      ["correction", "-10.00", -1000n, 99000n, ChangeType.CORRECTION],
    ])(
      "calculates %s changes and records the before/after amounts",
      async (type, amount, changeAmount, afterAmount, prismaType) => {
        const tx = mockChangeTransaction();
        const changedAt = "2026-07-05T12:00:00.000Z";

        await createAccountChange(
          "user-1",
          formData({
            accountId: "account-1",
            type,
            amount,
            changedAt,
            note: "手工调整",
          }),
        );

        expect(tx.account.findFirst).toHaveBeenCalledWith({
          where: { id: "account-1", userId: "user-1", archived: false },
        });
        expect(tx.account.update).toHaveBeenCalledWith({
          where: { id: "account-1" },
          data: { currentAmount: afterAmount },
        });
        expect(tx.accountChange.create).toHaveBeenCalledWith({
          data: {
            userId: "user-1",
            accountId: "account-1",
            accountNameSnapshot: "工资卡",
            categorySnapshot: AccountCategory.DEBIT_CARD,
            type: prismaType,
            beforeAmount: 100000n,
            changeAmount,
            afterAmount,
            note: "手工调整",
            changedAt: new Date(changedAt),
          },
        });
      },
    );

    it("rejects missing accounts without writing a change record", async () => {
      const tx = mockChangeTransaction(null);

      await expect(
        createAccountChange(
          "user-1",
          formData({
            accountId: "missing",
            type: "increase",
            amount: "1.00",
            changedAt: "2026-07-05T12:00:00.000Z",
          }),
        ),
      ).rejects.toThrow("账户不存在");

      expect(tx.account.update).not.toHaveBeenCalled();
      expect(tx.accountChange.create).not.toHaveBeenCalled();
    });

    it("rejects zero correction changes", async () => {
      const tx = mockChangeTransaction();

      await expect(
        createAccountChange(
          "user-1",
          formData({
            accountId: "account-1",
            type: "correction",
            amount: "0",
            changedAt: "2026-07-05T12:00:00.000Z",
          }),
        ),
      ).rejects.toThrow("校正金额不能为 0");

      expect(tx.account.update).not.toHaveBeenCalled();
      expect(tx.accountChange.create).not.toHaveBeenCalled();
    });
  });

  describe("updateAccount", () => {
    it("updates account details and records a set change when amount changes", async () => {
      const now = new Date("2026-07-05T14:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const account = {
        id: "account-1",
        userId: "user-1",
        name: "旧工资卡",
        category: AccountCategory.DEBIT_CARD,
        type: AccountType.ASSET,
        currentAmount: 100000n,
        includeInStats: true,
        archived: false,
        note: null,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      };
      const tx = {
        account: {
          findFirst: vi.fn().mockResolvedValue(account),
          update: vi.fn(),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      await updateAccount(
        "user-1",
        formData({
          accountId: "account-1",
          name: "工资卡",
          category: "debit_card",
          currentAmount: "1200",
          includeInStats: "on",
          note: "主账户",
        }),
      );

      expect(tx.account.findFirst).toHaveBeenCalledWith({
        where: { id: "account-1", userId: "user-1", archived: false },
      });
      expect(tx.account.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: {
          name: "工资卡",
          category: AccountCategory.DEBIT_CARD,
          type: AccountType.ASSET,
          currentAmount: 120000n,
          includeInStats: true,
          note: "主账户",
        },
      });
      expect(tx.accountChange.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          accountId: "account-1",
          accountNameSnapshot: "工资卡",
          categorySnapshot: AccountCategory.DEBIT_CARD,
          type: ChangeType.SET,
          beforeAmount: 100000n,
          changeAmount: 20000n,
          afterAmount: 120000n,
          note: "更新账户金额",
          changedAt: now,
        },
      });
    });

    it("updates account details without a change record when amount is unchanged", async () => {
      const tx = {
        account: {
          findFirst: vi.fn().mockResolvedValue({
            id: "account-1",
            userId: "user-1",
            name: "旧名称",
            category: AccountCategory.CASH,
            type: AccountType.ASSET,
            currentAmount: 100000n,
            includeInStats: true,
            archived: false,
            note: null,
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          }),
          update: vi.fn(),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      await updateAccount(
        "user-1",
        formData({
          accountId: "account-1",
          name: "新名称",
          category: "cash",
          currentAmount: "1000",
        }),
      );

      expect(tx.account.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: {
          name: "新名称",
          category: AccountCategory.CASH,
          type: AccountType.ASSET,
          currentAmount: 100000n,
          includeInStats: false,
          note: undefined,
        },
      });
      expect(tx.accountChange.create).not.toHaveBeenCalled();
    });

    it("updates account category and infers the account type", async () => {
      const tx = {
        account: {
          findFirst: vi.fn().mockResolvedValue({
            id: "account-1",
            userId: "user-1",
            name: "消费账户",
            category: AccountCategory.DEBIT_CARD,
            type: AccountType.ASSET,
            currentAmount: 100000n,
            includeInStats: true,
            archived: false,
            note: null,
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          }),
          update: vi.fn(),
        },
        accountChange: {
          create: vi.fn(),
        },
      };
      prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

      await updateAccount(
        "user-1",
        formData({
          accountId: "account-1",
          name: "信用卡",
          category: "credit_card",
          currentAmount: "1000",
          includeInStats: "on",
        }),
      );

      expect(tx.account.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: {
          name: "信用卡",
          category: AccountCategory.CREDIT_CARD,
          type: AccountType.LIABILITY,
          currentAmount: 100000n,
          includeInStats: true,
          note: undefined,
        },
      });
      expect(tx.accountChange.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("archives active accounts instead of removing their history", async () => {
      prismaMock.account.findFirst.mockResolvedValue({
        id: "account-1",
        userId: "user-1",
        name: "工资卡",
        category: AccountCategory.DEBIT_CARD,
        type: AccountType.ASSET,
        currentAmount: 100000n,
        includeInStats: true,
        archived: false,
        note: null,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      });

      await deleteAccount(
        "user-1",
        formData({
          accountId: "account-1",
        }),
      );

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: "account-1", userId: "user-1", archived: false },
      });
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { archived: true, includeInStats: false },
      });
    });
  });

  describe("read services", () => {
    it("maps accounts for the account list with included accounts first", async () => {
      prismaMock.account.findMany.mockResolvedValue([
        {
          id: "account-1",
          name: "工资卡",
          category: AccountCategory.DEBIT_CARD,
          type: AccountType.ASSET,
          currentAmount: 200000n,
          includeInStats: true,
          note: "主账户",
        },
      ]);

      await expect(listAccounts("user-1")).resolves.toEqual([
        {
          id: "account-1",
          name: "工资卡",
          category: "debit_card",
          type: "asset",
          currentAmount: 200000n,
          includeInStats: true,
          note: "主账户",
        },
      ]);
      expect(prismaMock.account.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", archived: false },
        orderBy: [{ includeInStats: "desc" }, { createdAt: "desc" }],
      });
    });

    it("maps a single account detail", async () => {
      prismaMock.account.findFirst.mockResolvedValue({
        id: "account-1",
        name: "工资卡",
        category: AccountCategory.DEBIT_CARD,
        type: AccountType.ASSET,
        currentAmount: 200000n,
        includeInStats: true,
        note: "主账户",
      });

      await expect(getAccount("user-1", "account-1")).resolves.toEqual({
        id: "account-1",
        name: "工资卡",
        category: "debit_card",
        type: "asset",
        currentAmount: 200000n,
        includeInStats: true,
        note: "主账户",
      });
      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: "account-1", userId: "user-1", archived: false },
      });
    });

    it("maps the latest account changes", async () => {
      const changedAt = new Date("2026-07-05T12:00:00.000Z");
      prismaMock.accountChange.findMany.mockResolvedValue([
        {
          id: "change-1",
          accountId: "account-1",
          accountNameSnapshot: "工资卡",
          categorySnapshot: AccountCategory.DEBIT_CARD,
          type: ChangeType.INCREASE,
          beforeAmount: 100000n,
          changeAmount: 5000n,
          afterAmount: 105000n,
          note: null,
          changedAt,
        },
      ]);

      await expect(listAccountChanges("user-1")).resolves.toEqual([
        {
          id: "change-1",
          accountId: "account-1",
          accountName: "工资卡",
          category: "debit_card",
          type: "increase",
          beforeAmount: 100000n,
          changeAmount: 5000n,
          afterAmount: 105000n,
          note: null,
          changedAt,
        },
      ]);
      expect(prismaMock.accountChange.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { changedAt: "desc" },
        take: 30,
      });
    });

    it("can list changes for one account", async () => {
      prismaMock.accountChange.findMany.mockResolvedValue([]);

      await expect(
        listAccountChanges("user-1", "account-1"),
      ).resolves.toEqual([]);
      expect(prismaMock.accountChange.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", accountId: "account-1" },
        orderBy: { changedAt: "desc" },
        take: 100,
      });
    });

    it("aggregates dashboard totals from included active accounts and current-month changes", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-05T08:00:00.000Z"));

      const accountRows = [
        {
          id: "asset-1",
          name: "工资卡",
          category: AccountCategory.DEBIT_CARD,
          type: AccountType.ASSET,
          currentAmount: 500000n,
          includeInStats: true,
        },
        {
          id: "asset-2",
          name: "股票",
          category: AccountCategory.INVESTMENT,
          type: AccountType.ASSET,
          currentAmount: 300000n,
          includeInStats: false,
        },
        {
          id: "liability-1",
          name: "信用卡",
          category: AccountCategory.CREDIT_CARD,
          type: AccountType.LIABILITY,
          currentAmount: 120000n,
          includeInStats: true,
        },
      ];
      const recentChangedAt = new Date("2026-07-04T12:00:00.000Z");
      prismaMock.account.findMany.mockResolvedValue(accountRows);
      prismaMock.accountChange.findMany
        .mockResolvedValueOnce([{ changeAmount: 10000n }, { changeAmount: -2500n }])
        .mockResolvedValueOnce([
          {
            id: "change-1",
            accountNameSnapshot: "工资卡",
            categorySnapshot: AccountCategory.DEBIT_CARD,
            type: ChangeType.INCREASE,
            changeAmount: 10000n,
            afterAmount: 510000n,
            changedAt: recentChangedAt,
          },
        ]);

      await expect(getDashboard("user-1")).resolves.toEqual({
        assets: 500000n,
        liabilities: 120000n,
        netWorth: 380000n,
        monthlyChange: 7500n,
        accounts: [
          {
            id: "asset-1",
            name: "工资卡",
            category: "debit_card",
            type: "asset",
            currentAmount: 500000n,
            includeInStats: true,
          },
          {
            id: "asset-2",
            name: "股票",
            category: "investment",
            type: "asset",
            currentAmount: 300000n,
            includeInStats: false,
          },
          {
            id: "liability-1",
            name: "信用卡",
            category: "credit_card",
            type: "liability",
            currentAmount: 120000n,
            includeInStats: true,
          },
        ],
        recentChanges: [
          {
            id: "change-1",
            accountName: "工资卡",
            category: "debit_card",
            type: "increase",
            changeAmount: 10000n,
            afterAmount: 510000n,
            changedAt: recentChangedAt,
          },
        ],
      });
      expect(prismaMock.accountChange.findMany).toHaveBeenNthCalledWith(1, {
        where: {
          userId: "user-1",
          changedAt: { gte: new Date(2026, 6, 1) },
          account: { includeInStats: true, archived: false },
        },
        select: { changeAmount: true },
      });
      expect(prismaMock.accountChange.findMany).toHaveBeenNthCalledWith(2, {
        where: { userId: "user-1" },
        include: { account: true },
        orderBy: { changedAt: "desc" },
        take: 5,
      });
    });
  });
});
