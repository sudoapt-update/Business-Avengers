import { addDays, diffDays, fromDay, type Day } from "./date";
import { PAYOUT_ACCOUNT, accountBalances, effectiveAmount, orderNet } from "./engine";
import type { Channel, DemoData, ExpenseCategory } from "./types";

// The payment calendar: money expected in (marketplace and store payouts) and money going out
// (monthly bills and owner pay) over the coming weeks, read from the same tables as Books.
// Payout amounts after the first are estimates from the last 30 days of sales.

export interface PayEvent {
  id: string;
  day: Day;
  title: string;
  /** Positive for money in, negative for money out. */
  amount: number;
  kind: "payout" | "bill";
  /** A sales channel for payouts, an expense category for bills, or the owner's pay. */
  source: Channel | ExpenseCategory | "owner";
  note: string;
  estimate?: boolean;
}

/** The sample data has no billing dates, so each bill gets a fixed day of the month from its id. */
export function billingDay(id: string) {
  // A multiplicative hash, so neighbouring ids (e1, e2, …) land on scattered days rather than consecutive ones.
  let h = 0x811c9dc5;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return ((Math.imul(h, 0x9e3779b1) >>> 0) % 28) + 1;
}

/** Days from `from` to `to`, inclusive. */
function daysBetween(from: Day, to: Day): Day[] {
  const out: Day[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The next business day `n` business days after `day`. */
function addBusinessDays(day: Day, n: number): Day {
  let d = day;
  while (n > 0) {
    d = addDays(d, 1);
    const wd = fromDay(d).getDay();
    if (wd !== 0 && wd !== 6) n--;
  }
  return d;
}

const round = (n: number) => Math.round(n);

export function paymentEvents(data: DemoData, today: Day, days = 30): PayEvent[] {
  const end = addDays(today, days - 1);
  const range = daysBetween(today, end);
  const events: PayEvent[] = [];

  // Average daily payout per channel over the last 30 days: what the platform sends after its fees.
  const from = addDays(today, -30);
  const daily = (c: Channel) =>
    data.orders.filter((o) => o.channel === c && o.day > from && o.day <= today).reduce((s, o) => s + orderNet(o), 0) / 30;
  const balances = new Map(accountBalances(data).map((a) => [a.account.id, a.balance]));

  // Shopify: what is in transit now lands in 2 business days, then a weekly payout every Tuesday.
  const shopifyFirst = addBusinessDays(today, 2);
  const inTransit = balances.get(PAYOUT_ACCOUNT.shopify) ?? 0;
  if (inTransit > 0)
    events.push({
      id: "shopify-transit",
      day: shopifyFirst,
      title: "Shopify payout",
      amount: round(inTransit),
      kind: "payout",
      source: "shopify",
      note: "Payouts in transit, from the Cash table.",
    });
  for (const d of range)
    if (fromDay(d).getDay() === 2 && d > shopifyFirst)
      events.push({
        id: `shopify-${d}`,
        day: d,
        title: "Shopify payout",
        amount: round(daily("shopify") * 7),
        kind: "payout",
        source: "shopify",
        note: "Estimated from your last 30 days of Shopify sales after fees.",
        estimate: true,
      });

  // Amazon: the balance is released every 14 days, counted from the day the sample store started.
  const anchor = addDays(data.seededOn, 3);
  let first = true;
  for (const d of range)
    if (((diffDays(d, anchor) % 14) + 14) % 14 === 0) {
      events.push({
        id: `amazon-${d}`,
        day: d,
        title: "Amazon payout",
        amount: round(first ? (balances.get(PAYOUT_ACCOUNT.amazon) ?? 0) + daily("amazon") * diffDays(d, today) : daily("amazon") * 14),
        kind: "payout",
        source: "amazon",
        note: first
          ? "Your marketplace balance plus sales until the release date."
          : "Estimated from your last 30 days of Amazon sales after fees.",
        estimate: true,
      });
      first = false;
    }

  // Monthly bills on their billing day, at the price after any saving you applied.
  for (const e of data.expenses) {
    if (e.cadence !== "monthly") continue;
    for (const d of range) {
      if (fromDay(d).getDate() !== billingDay(e.id) || e.day > d) continue;
      const amount = effectiveAmount(e, data.leaks, d);
      if (amount <= 0) continue;
      events.push({
        id: `${e.id}-${d}`,
        day: d,
        title: e.name,
        amount: -round(amount),
        kind: "bill",
        source: e.category,
        note: `${e.category}, monthly. From Books → Expenses.`,
      });
    }
  }

  // Owner pay on the 1st.
  for (const d of range)
    if (fromDay(d).getDate() === 1 && data.ownerDrawMonthly > 0)
      events.push({
        id: `owner-${d}`,
        day: d,
        title: "Your pay",
        amount: -round(data.ownerDrawMonthly),
        kind: "bill",
        source: "owner",
        note: "Owner pay, counted in your cash runway.",
      });

  return events.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : b.amount - a.amount));
}

const ymd = (day: Day) => day.replaceAll("-", "");
const usd = (n: number) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US")}`;
export const eventLabel = (e: PayEvent) => `${e.title} ${usd(e.amount)}`;

/** Text values in an iCalendar file escape backslashes, semicolons, commas and newlines. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 bytes are folded: a line break followed by one space. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = "";
      len = 0;
    }
    cur += ch;
    len += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

/** An iCalendar file (Apple Calendar, Outlook, Google import) with a reminder one day before each payment. */
export function toICS(events: PayEvent[], now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FinPath//Payment calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FinPath payments",
  ];
  for (const e of events) {
    const label = eventLabel(e);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@finpath.demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.day)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(e.day, 1))}`,
      `SUMMARY:${esc(label)}`,
      `DESCRIPTION:${esc(`${e.note}${e.estimate ? " Estimated amount." : ""} Sample data from the FinPath demo.`)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`Tomorrow: ${label}`)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** A link that opens Google Calendar's "new event" form with this payment filled in. */
export function googleCalendarLink(e: PayEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventLabel(e),
    dates: `${ymd(e.day)}/${ymd(addDays(e.day, 1))}`,
    details: `${e.note}${e.estimate ? " Estimated amount." : ""} From the FinPath demo.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Monday of the week that holds `day`. */
export function weekStart(day: Day): Day {
  const wd = (fromDay(day).getDay() + 6) % 7;
  return addDays(day, -wd);
}
