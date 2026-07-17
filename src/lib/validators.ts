import { z } from "zod";

import {
  accountCategoryValues,
  accountIconValues,
  changeTypeValues,
} from "@/types/domain";

const moneyString = z
  .string()
  .trim()
  .min(1, "请输入金额")
  .regex(/^-?\d+(\.\d{0,2})?$/, "金额最多保留两位小数");

export const accountSchema = z.object({
  name: z.string().trim().min(1, "请输入账户名称"),
  category: z.enum(accountCategoryValues),
  iconKey: z.enum(accountIconValues).optional(),
  currentAmount: moneyString,
  includeInStats: z.boolean().default(true),
  note: z.string().trim().optional(),
});

export const accountUpdateSchema = z.object({
  accountId: z.string().min(1, "请选择账户"),
  name: z.string().trim().min(1, "请输入账户名称"),
  category: z.enum(accountCategoryValues),
  iconKey: z.enum(accountIconValues).optional(),
  currentAmount: moneyString,
  includeInStats: z.boolean().default(true),
  note: z.string().trim().optional(),
});

export const accountDeleteSchema = z.object({
  accountId: z.string().min(1, "请选择账户"),
});

export const accountChangeSchema = z.object({
  accountId: z.string().min(1, "请选择账户"),
  type: z.enum(changeTypeValues),
  amount: moneyString,
  changedAt: z.string().min(1, "请选择变更时间"),
  note: z.string().trim().optional(),
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, "请输入目标名称"),
  targetAmount: moneyString,
  oneTimeIncome: moneyString,
  oneTimeExpense: moneyString,
  accountIds: z.array(z.string().min(1)).max(100, "关联账户数量过多"),
  note: z.string().trim().optional(),
});

export const goalUpdateSchema = goalSchema.extend({
  goalId: z.string().min(1, "请选择目标"),
});

export const goalDeleteSchema = z.object({
  goalId: z.string().min(1, "请选择目标"),
});

export const goalBudgetSchema = z.object({
  monthlyIncome: moneyString,
  monthlyRent: moneyString,
  monthlyFood: moneyString,
  monthlyLiving: moneyString,
  monthlyOtherExpense: moneyString,
  monthlyOtherIncome: moneyString,
});
