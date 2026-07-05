import type { AccountCategory, AccountType } from "@/types/domain";

export const chartModeValues = ["asset", "liability", "net"] as const;
export type ChartMode = (typeof chartModeValues)[number];

export const chartRangeValues = ["3m", "6m", "12m", "all"] as const;
export type ChartRange = (typeof chartRangeValues)[number];

export type ChartAccount = {
  id: string;
  name: string;
  category: AccountCategory;
  type: AccountType;
  currentAmount: number;
  iconKey: string | null;
};

export type ChartMonthSnapshot = {
  key: string;
  label: string;
  accountAmounts: Record<string, number>;
};

export type ChartsData = {
  generatedAt: string;
  accounts: ChartAccount[];
  months: ChartMonthSnapshot[];
};
