import dayjs from "dayjs";

export function formatDate(value: Date | string) {
  return dayjs(value).format("YYYY-MM-DD");
}

export function formatDateTime(value: Date | string) {
  return dayjs(value).format("YYYY-MM-DD HH:mm");
}

export function monthKey(value: Date | string) {
  return dayjs(value).format("YYYY-MM");
}
