const MONEY_PATTERN = /^-?\d+(\.\d{0,2})?$/;

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
  const yuan = absolute / 100n;
  const fraction = absolute % 100n;
  const sign = negative ? "-" : options.signed && cents > 0n ? "+" : "";

  return `${sign}¥${yuan.toLocaleString("zh-CN")}.${fraction
    .toString()
    .padStart(2, "0")}`;
}
