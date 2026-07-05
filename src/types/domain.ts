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

export const accountIconValues = [
  "china_construction_bank",
  "bank_of_china",
  "china_merchants_bank",
  "alipay",
  "wechat",
] as const;
export type AccountIconKey = (typeof accountIconValues)[number];

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
  liability_account: "借贷",
  bond: "债权",
};

export const accountCategoryDescriptions: Partial<
  Record<AccountCategory, string>
> = {
  credit_card: "信用卡、蚂蚁花呗、京东白条",
  virtual_account: "支付宝、微信",
  investment: "股票、基金、p2p",
  liability_account: "贷款、借入",
  bond: "应收、借出",
};

export const accountIconLabels: Record<AccountIconKey, string> = {
  china_construction_bank: "建设银行",
  bank_of_china: "中国银行",
  china_merchants_bank: "招商银行",
  alipay: "支付宝",
  wechat: "微信",
};

export const changeTypeLabels: Record<ChangeType, string> = {
  initial: "初始金额",
  increase: "增加",
  decrease: "减少",
  set: "设为",
  correction: "校正",
};
