import {
  AccountCategory as PrismaAccountCategory,
  AccountType as PrismaAccountType,
  ChangeType as PrismaChangeType,
} from "@/generated/prisma/enums";
import type {
  AccountCategory,
  AccountType,
  ChangeType,
} from "@/types/domain";

export const accountTypeToPrisma: Record<AccountType, PrismaAccountType> = {
  asset: PrismaAccountType.ASSET,
  liability: PrismaAccountType.LIABILITY,
};

export const accountCategoryToPrisma: Record<
  AccountCategory,
  PrismaAccountCategory
> = {
  cash: PrismaAccountCategory.CASH,
  debit_card: PrismaAccountCategory.DEBIT_CARD,
  credit_card: PrismaAccountCategory.CREDIT_CARD,
  virtual_account: PrismaAccountCategory.VIRTUAL_ACCOUNT,
  investment: PrismaAccountCategory.INVESTMENT,
  liability_account: PrismaAccountCategory.LIABILITY_ACCOUNT,
  bond: PrismaAccountCategory.BOND,
};

export const changeTypeToPrisma: Record<ChangeType, PrismaChangeType> = {
  initial: PrismaChangeType.INITIAL,
  increase: PrismaChangeType.INCREASE,
  decrease: PrismaChangeType.DECREASE,
  set: PrismaChangeType.SET,
  correction: PrismaChangeType.CORRECTION,
};

export const accountTypeFromPrisma: Record<PrismaAccountType, AccountType> = {
  [PrismaAccountType.ASSET]: "asset",
  [PrismaAccountType.LIABILITY]: "liability",
};

export const accountCategoryFromPrisma: Record<
  PrismaAccountCategory,
  AccountCategory
> = {
  [PrismaAccountCategory.CASH]: "cash",
  [PrismaAccountCategory.DEBIT_CARD]: "debit_card",
  [PrismaAccountCategory.CREDIT_CARD]: "credit_card",
  [PrismaAccountCategory.VIRTUAL_ACCOUNT]: "virtual_account",
  [PrismaAccountCategory.INVESTMENT]: "investment",
  [PrismaAccountCategory.LIABILITY_ACCOUNT]: "liability_account",
  [PrismaAccountCategory.BOND]: "bond",
};

export const changeTypeFromPrisma: Record<PrismaChangeType, ChangeType> = {
  [PrismaChangeType.INITIAL]: "initial",
  [PrismaChangeType.INCREASE]: "increase",
  [PrismaChangeType.DECREASE]: "decrease",
  [PrismaChangeType.SET]: "set",
  [PrismaChangeType.CORRECTION]: "correction",
};
