const CHINA_TIMEZONE_OFFSET_MINUTES = 8 * 60;
const MINUTE_MS = 60_000;

export function formatDate(value: Date | string) {
  const parts = getChinaDateParts(value);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatDateTime(value: Date | string) {
  const parts = getChinaDateParts(value);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatShortDateTime(value: Date | string) {
  const parts = getChinaDateParts(value);

  return `${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatMonthYear(value: Date | string) {
  const parts = getChinaDateParts(value);

  return `${parts.year}年${parts.month}月`;
}

export function monthKey(value: Date | string) {
  const parts = getChinaDateParts(value);

  return `${parts.year}-${pad(parts.month)}`;
}

export function toDateTimeLocalValue(value: Date | string = new Date()) {
  const parts = getChinaDateParts(value);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function parseChinaDateTimeLocal(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day, hour, minute, second = "0"] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ) -
      CHINA_TIMEZONE_OFFSET_MINUTES * MINUTE_MS,
  );
}

export function chinaMonthStart(value: Date | string) {
  const parts = getChinaDateParts(value);

  return new Date(
    Date.UTC(parts.year, parts.month - 1, 1) -
      CHINA_TIMEZONE_OFFSET_MINUTES * MINUTE_MS,
  );
}

export function chinaMonthEnd(value: Date | string) {
  const start = addChinaMonths(chinaMonthStart(value), 1);

  return new Date(start.getTime() - 1);
}

export function addChinaMonths(value: Date | string, months: number) {
  const parts = getChinaDateParts(value);

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1 + months,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ) -
      CHINA_TIMEZONE_OFFSET_MINUTES * MINUTE_MS,
  );
}

function getChinaDateParts(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const chinaDate = new Date(
    date.getTime() + CHINA_TIMEZONE_OFFSET_MINUTES * MINUTE_MS,
  );

  return {
    year: chinaDate.getUTCFullYear(),
    month: chinaDate.getUTCMonth() + 1,
    day: chinaDate.getUTCDate(),
    hour: chinaDate.getUTCHours(),
    minute: chinaDate.getUTCMinutes(),
    second: chinaDate.getUTCSeconds(),
    millisecond: chinaDate.getUTCMilliseconds(),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
