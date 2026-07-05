export const accountTypeValues = ["asset", "liability"] as const;
export type AccountType = (typeof accountTypeValues)[number];

export const accountCategoryValues = [
  "cash",
  "debit_card",
  "credit_card",
  "virtual_account",
  "investment",
  "liability_account",
  "bond",
] as const;
export type AccountCategory = (typeof accountCategoryValues)[number];

export const changeTypeValues = [
  "initial",
  "increase",
  "decrease",
  "set",
  "correction",
] as const;
export type ChangeType = (typeof changeTypeValues)[number];

export const accountTypeLabels: Record<AccountType, string> = {
  asset: "资产",
  liability: "负债",
};

export const accountCategoryLabels: Record<AccountCategory, string> = {
  cash: "现金",
  debit_card: "借记卡",
  credit_card: "信用卡",
  virtual_account: "虚拟账户",
  investment: "投资账户",
  liability_account: "负债账户",
  bond: "债券账户",
};

export const changeTypeLabels: Record<ChangeType, string> = {
  initial: "初始金额",
  increase: "增加",
  decrease: "减少",
  set: "设为",
  correction: "校正",
};
