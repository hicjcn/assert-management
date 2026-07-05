import "server-only";

import { AccountType, ChangeType } from "@/generated/prisma/enums";
import { yuanToCents } from "@/lib/money";
import {
  accountChangeSchema,
  accountDeleteSchema,
  accountSchema,
  accountUpdateSchema,
} from "@/lib/validators";
import { prisma } from "@/server/db/prisma";
import {
  accountCategoryFromPrisma,
  accountCategoryToPrisma,
  accountTypeFromPrisma,
  changeTypeFromPrisma,
  changeTypeToPrisma,
} from "@/server/domain-mapping";
import type { AccountCategory } from "@/types/domain";

const liabilityCategories = new Set<AccountCategory>([
  "credit_card",
  "liability_account",
]);

function inferAccountType(category: AccountCategory) {
  return liabilityCategories.has(category)
    ? AccountType.LIABILITY
    : AccountType.ASSET;
}

export async function getDashboard(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [accounts, monthChanges, recentChanges] = await Promise.all([
    prisma.account.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountChange.findMany({
      where: {
        userId,
        changedAt: { gte: monthStart },
        account: { includeInStats: true, archived: false },
      },
      select: { changeAmount: true },
    }),
    prisma.accountChange.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { changedAt: "desc" },
      take: 5,
    }),
  ]);

  const includedAccounts = accounts.filter((account) => account.includeInStats);
  const assets = includedAccounts
    .filter((account) => account.type === AccountType.ASSET)
    .reduce((sum, account) => sum + account.currentAmount, 0n);
  const liabilities = includedAccounts
    .filter((account) => account.type === AccountType.LIABILITY)
    .reduce((sum, account) => sum + account.currentAmount, 0n);
  const monthlyChange = monthChanges.reduce(
    (sum, change) => sum + change.changeAmount,
    0n,
  );

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    monthlyChange,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      category: accountCategoryFromPrisma[account.category],
      type: accountTypeFromPrisma[account.type],
      currentAmount: account.currentAmount,
      includeInStats: account.includeInStats,
      iconKey: account.iconKey,
    })),
    recentChanges: recentChanges.map((change) => ({
      id: change.id,
      accountName: change.accountNameSnapshot,
      category: accountCategoryFromPrisma[change.categorySnapshot],
      type: changeTypeFromPrisma[change.type],
      changeAmount: change.changeAmount,
      afterAmount: change.afterAmount,
      changedAt: change.changedAt,
    })),
  };
}

export async function listAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, archived: false },
    orderBy: [{ includeInStats: "desc" }, { createdAt: "desc" }],
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    category: accountCategoryFromPrisma[account.category],
    type: accountTypeFromPrisma[account.type],
    currentAmount: account.currentAmount,
    includeInStats: account.includeInStats,
    iconKey: account.iconKey,
    note: account.note,
  }));
}

export async function getAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, archived: false },
  });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    category: accountCategoryFromPrisma[account.category],
    type: accountTypeFromPrisma[account.type],
    currentAmount: account.currentAmount,
    includeInStats: account.includeInStats,
    iconKey: account.iconKey,
    note: account.note,
  };
}

export async function listAccountChanges(userId: string, accountId?: string) {
  const changes = await prisma.accountChange.findMany({
    where: { userId, ...(accountId ? { accountId } : {}) },
    orderBy: { changedAt: "desc" },
    take: accountId ? 100 : 30,
  });

  return changes.map((change) => ({
    id: change.id,
    accountId: change.accountId,
    accountName: change.accountNameSnapshot,
    category: accountCategoryFromPrisma[change.categorySnapshot],
    type: changeTypeFromPrisma[change.type],
    beforeAmount: change.beforeAmount,
    changeAmount: change.changeAmount,
    afterAmount: change.afterAmount,
    note: change.note,
    changedAt: change.changedAt,
  }));
}

export async function createAccount(userId: string, formData: FormData) {
  const parsed = accountSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    iconKey: formData.get("iconKey") || undefined,
    currentAmount: formData.get("currentAmount"),
    includeInStats: formData.get("includeInStats") === "on",
    note: formData.get("note") || undefined,
  });
  const currentAmount = yuanToCents(parsed.currentAmount);
  const accountType = inferAccountType(parsed.category);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        userId,
        name: parsed.name,
        category: accountCategoryToPrisma[parsed.category],
        type: accountType,
        iconKey: parsed.iconKey ?? null,
        currentAmount,
        includeInStats: parsed.includeInStats,
        note: parsed.note,
      },
    });

    await tx.accountChange.create({
      data: {
        userId,
        accountId: account.id,
        accountNameSnapshot: account.name,
        categorySnapshot: account.category,
        type: ChangeType.INITIAL,
        beforeAmount: 0n,
        changeAmount: currentAmount,
        afterAmount: currentAmount,
        note: "创建账户",
        changedAt: now,
      },
    });
  });
}

export async function updateAccount(userId: string, formData: FormData) {
  const parsed = accountUpdateSchema.parse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    category: formData.get("category"),
    iconKey: formData.get("iconKey") || undefined,
    currentAmount: formData.get("currentAmount"),
    includeInStats: formData.get("includeInStats") === "on",
    note: formData.get("note") || undefined,
  });
  const currentAmount = yuanToCents(parsed.currentAmount);
  const accountCategory = accountCategoryToPrisma[parsed.category];
  const accountType = inferAccountType(parsed.category);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: parsed.accountId, userId, archived: false },
    });

    if (!account) {
      throw new Error("账户不存在");
    }

    const changeAmount = currentAmount - account.currentAmount;

    await tx.account.update({
      where: { id: account.id },
      data: {
        name: parsed.name,
        category: accountCategory,
        type: accountType,
        iconKey: parsed.iconKey ?? null,
        currentAmount,
        includeInStats: parsed.includeInStats,
        note: parsed.note,
      },
    });

    if (changeAmount !== 0n) {
      await tx.accountChange.create({
        data: {
          userId,
          accountId: account.id,
          accountNameSnapshot: parsed.name,
          categorySnapshot: accountCategory,
          type: ChangeType.SET,
          beforeAmount: account.currentAmount,
          changeAmount,
          afterAmount: currentAmount,
          note: "更新账户金额",
          changedAt: now,
        },
      });
    }
  });
}

export async function deleteAccount(userId: string, formData: FormData) {
  const parsed = accountDeleteSchema.parse({
    accountId: formData.get("accountId"),
  });

  const account = await prisma.account.findFirst({
    where: { id: parsed.accountId, userId, archived: false },
  });

  if (!account) {
    throw new Error("账户不存在");
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { archived: true, includeInStats: false },
  });
}

export async function createAccountChange(userId: string, formData: FormData) {
  const parsed = accountChangeSchema.parse({
    accountId: formData.get("accountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    changedAt: formData.get("changedAt"),
    note: formData.get("note") || undefined,
  });
  const amount = yuanToCents(parsed.amount);
  const changedAt = new Date(parsed.changedAt);

  if (Number.isNaN(changedAt.getTime())) {
    throw new Error("请选择有效的变更时间");
  }

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: parsed.accountId, userId, archived: false },
    });

    if (!account) {
      throw new Error("账户不存在");
    }

    const beforeAmount = account.currentAmount;
    let changeAmount = amount;

    if (parsed.type === "increase") {
      if (amount <= 0n) {
        throw new Error("增加金额必须大于 0");
      }
      changeAmount = amount;
    }

    if (parsed.type === "decrease") {
      if (amount <= 0n) {
        throw new Error("减少金额必须大于 0");
      }
      changeAmount = -amount;
    }

    if (parsed.type === "set") {
      changeAmount = amount - beforeAmount;
    }

    if (parsed.type === "correction" && amount === 0n) {
      throw new Error("校正金额不能为 0");
    }

    const afterAmount = beforeAmount + changeAmount;

    await tx.account.update({
      where: { id: account.id },
      data: { currentAmount: afterAmount },
    });

    await tx.accountChange.create({
      data: {
        userId,
        accountId: account.id,
        accountNameSnapshot: account.name,
        categorySnapshot: account.category,
        type: changeTypeToPrisma[parsed.type],
        beforeAmount,
        changeAmount,
        afterAmount,
        note: parsed.note,
        changedAt,
      },
    });
  });
}
