import type { AccountCategory, AccountType } from "@/types/domain";

const MONEY_PATTERN = /^-?\d+(\.\d{0,2})?$/;
const negativeAssetCategories = new Set<AccountCategory>([
  "credit_card",
  "liability_account",
]);

export function yuanToCents(value: string | number): bigint {
  const normalized =
    typeof value === "number" ? value.toFixed(2) : value.trim().replaceAll(",", "");

  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error(`Invalid money value: ${value}`);
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [yuan, fraction = ""] = unsigned.split(".");
  const cents = BigInt(yuan) * 100n + BigInt(fraction.padEnd(2, "0"));

  return negative ? -cents : cents;
}

export function formatCents(
  value: bigint | number,
  options: { signed?: boolean } = {},
) {
  const cents = typeof value === "bigint" ? value : BigInt(value);
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const yuan = (absolute + 50n) / 100n;
  const sign = negative ? "-" : options.signed && cents > 0n ? "+" : "";

  return `${sign}¥${yuan.toLocaleString("zh-CN")}`;
}

export function toAccountDisplayCents(
  value: bigint | number,
  account: { category?: AccountCategory; type?: AccountType },
) {
  const cents = typeof value === "bigint" ? value : BigInt(value);
  const isNegativeAsset =
    account.type === "liability" ||
    (account.category ? negativeAssetCategories.has(account.category) : false);

  return isNegativeAsset ? -cents : cents;
}

export function formatAccountCents(
  value: bigint | number,
  account: { category?: AccountCategory; type?: AccountType },
  options: { signed?: boolean } = {},
) {
  return formatCents(toAccountDisplayCents(value, account), options);
}
