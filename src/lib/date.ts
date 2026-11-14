// Calendar days are stored as local "YYYY-MM-DD" strings so streaks follow the
// seller's own date, not UTC.

export type Day = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDay(d: Date): Day {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDay(day: Day): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day: Day, n: number): Day {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export function diffDays(a: Day, b: Day): number {
  return Math.round((fromDay(a).getTime() - fromDay(b).getTime()) / 86_400_000);
}

export function realToday(): Day {
  return toDay(new Date());
}

export function formatDay(day: Day, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return fromDay(day).toLocaleDateString("en-US", opts);
}

export function longDay(day: Day) {
  return formatDay(day, { weekday: "long", month: "long", day: "numeric" });
}
