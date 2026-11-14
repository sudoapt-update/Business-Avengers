import { addDays, diffDays, type Day } from "./date";
import type { Channel, DemoData, Expense, Leak, Order } from "./types";

// Every number on the dashboard comes from here. Nothing derived is stored:
// the score, profit bridge, runway and leak totals are recomputed from the
// tables each time, so any edit or simulated order moves them through the math.

export const orderNet = (o: Order) => o.gross - o.platformFee - o.paymentFee - o.shipping;
export const orderProfit = (o: Order) => orderNet(o) - o.cogs;

/**
 * Newest first. Rows created during the demo (live) are newer than any seeded row on the
 * same day, because the seed fills today's morning even when the visitor arrives earlier.
 */
export function byNewest(a: Order, b: Order) {
  if (a.day !== b.day) return a.day < b.day ? 1 : -1;
  if (a.live && b.live) return (b.at ?? 0) - (a.at ?? 0);
  if (a.live !== b.live) return a.live ? -1 : 1;
  return a.time < b.time ? 1 : -1;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function effectiveAmount(e: Expense, leaks: Leak[], day: Day): number {
  const leak = leaks.find((l) => l.expenseId === e.id && l.appliedOn && l.appliedOn <= day);
  return leak ? leak.altPrice : e.amount;
}

/** Monthly cost of running the business on `day`: recurring rows plus one-offs in the last 30 days. */
export function expensesFor(data: DemoData, day: Day) {
  const from = addDays(day, -30);
  let monthly = 0;
  let oneOff = 0;
  for (const e of data.expenses) {
    if (e.cadence === "monthly" && e.day <= day) monthly += effectiveAmount(e, data.leaks, day);
    if (e.cadence === "one-off" && e.day > from && e.day <= day) oneOff += e.amount;
  }
  return { monthly, oneOff, total: monthly + oneOff };
}

export interface LeakView {
  leak: Leak;
  expense: Expense;
  current: number;
  saving: number;
  applied: boolean;
}

export function leaksFor(data: DemoData, day: Day): LeakView[] {
  return data.leaks
    .map((leak) => {
      const expense = data.expenses.find((e) => e.id === leak.expenseId)!;
      const applied = !!leak.appliedOn && leak.appliedOn <= day;
      const current = effectiveAmount(expense, data.leaks, day);
      return { leak, expense, current, saving: applied ? 0 : Math.max(0, expense.amount - leak.altPrice), applied };
    })
    .sort((a, b) => b.saving - a.saving);
}

/** Which cash account each channel pays into. Stock is paid for from checking. */
export const PAYOUT_ACCOUNT: Record<Channel, string> = { shopify: "c2", amazon: "c3", market: "c4" };
const CHECKING = "c1";

const after = (at: number | undefined, countedAt: number | undefined) => (at ?? 1) > (countedAt ?? 0);

/** Each account = its last counted balance plus live orders and expenses recorded since that count. */
export function accountBalances(data: DemoData) {
  return data.cash.map((a) => {
    let flows = 0;
    for (const o of data.orders) {
      if (!o.live || !after(o.at, a.countedAt)) continue;
      if (PAYOUT_ACCOUNT[o.channel] === a.id) flows += orderNet(o);
      if (a.id === CHECKING) flows -= o.cogs;
    }
    if (a.id === CHECKING)
      for (const e of data.expenses) if (e.live && e.cadence === "one-off" && after(e.at, a.countedAt)) flows -= e.amount;
    return { account: a, flows, balance: a.balance + flows };
  });
}

export function cashNow(data: DemoData) {
  return accountBalances(data).reduce((s, a) => s + a.balance, 0);
}

/** Stock on hand = last count minus units sold in live orders since that count. */
export function stockLevels(data: DemoData) {
  return data.inventory.map((item) => {
    const sold = data.orders.filter((o) => o.live && o.item === item.name && after(o.at, item.countedAt)).reduce((s, o) => s + o.qty, 0);
    const units = item.units - sold;
    return { item, sold, units, value: units * item.unitCost };
  });
}

/** Cash on an earlier day, walked back from today through the recorded flows. */
export function cashAt(data: DemoData, day: Day, today: Day) {
  let c = cashNow(data);
  if (day >= today) return c;
  for (const o of data.orders) if (o.day > day && o.day <= today) c -= orderProfit(o);
  const days = diffDays(today, day);
  const fixed = expensesFor(data, today).monthly + data.ownerDrawMonthly;
  c += (fixed / 30) * days;
  for (const e of data.expenses) if (e.cadence === "one-off" && e.day > day && e.day <= today) c += e.amount;
  return c;
}

export interface CashWeek {
  /** First and last day of the week, oldest week first. */
  from: Day;
  to: Day;
  in: Record<Channel, number>;
  totalIn: number;
  /** Stock, fees, postage, running costs and owner pay for the week. */
  out: number;
  net: number;
}

/**
 * Money in and out for each of the last `weeks` seven-day blocks, ending today.
 * Uses the same flows as cashAt, so the nets add up to the change in cash.
 */
export function weeklyCashflow(data: DemoData, today: Day, weeks: number): CashWeek[] {
  const out: CashWeek[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const to = addDays(today, -7 * w);
    const from = addDays(to, -6);
    const before = addDays(from, -1);
    const inBy: Record<Channel, number> = { shopify: 0, amazon: 0, market: 0 };
    let spent = 0;
    for (const o of data.orders) {
      if (o.day <= before || o.day > to) continue;
      inBy[o.channel] += o.gross;
      spent += o.cogs + o.platformFee + o.paymentFee + o.shipping;
    }
    spent += ((expensesFor(data, to).monthly + data.ownerDrawMonthly) / 30) * 7;
    for (const e of data.expenses) if (e.cadence === "one-off" && e.day > before && e.day <= to) spent += e.amount;
    const totalIn = inBy.shopify + inBy.amazon + inBy.market;
    out.push({ from, to, in: inBy, totalIn, out: spent, net: totalIn - spent });
  }
  return out;
}

export interface Factor {
  key: "margin" | "runway" | "fees" | "expenses" | "freshness";
  label: string;
  weight: number;
  value: number; // 0..1
  points: number;
  reading: string;
  hint: string;
}

export interface Metrics {
  day: Day;
  revenue: number;
  orders: number;
  cogs: number;
  platformFees: number;
  paymentFees: number;
  shipping: number;
  tools: number;
  trueProfit: number;
  margin: number;
  cash: number;
  weeklyFixed: number;
  runwayWeeks: number;
  feeLoad: number;
  leakMonthly: number;
  leakCount: number;
  largestLeak: number;
  freshnessDays: number;
  factors: Factor[];
  score: number;
}

/**
 * `opts.cash` replaces the cash balance. The Time Machine uses it to replay the last 30 days with a
 * change: the cash today then differs from the real balance by the change in profit.
 */
export function computeMetrics(data: DemoData, day: Day, today: Day, opts: { cash?: number } = {}): Metrics {
  const from = addDays(day, -30);
  let revenue = 0,
    cogs = 0,
    platformFees = 0,
    paymentFees = 0,
    shipping = 0,
    count = 0;
  for (const o of data.orders) {
    if (o.day <= from || o.day > day) continue;
    revenue += o.gross;
    cogs += o.cogs;
    platformFees += o.platformFee;
    paymentFees += o.paymentFee;
    shipping += o.shipping;
    count++;
  }
  const exp = expensesFor(data, day);
  const tools = exp.total;
  const trueProfit = revenue - cogs - platformFees - paymentFees - shipping - tools;
  const margin = revenue > 0 ? trueProfit / revenue : 0;

  const cash = opts.cash ?? cashAt(data, day, today);
  const weeklyFixed = ((exp.monthly + data.ownerDrawMonthly) * 12) / 52;
  const runwayWeeks = weeklyFixed > 0 ? Math.max(0, cash / weeklyFixed) : 52;

  const feeLoad = revenue > 0 ? (platformFees + paymentFees) / revenue : 0;

  const leaks = leaksFor(data, day).filter((l) => l.saving > 0);
  const leakMonthly = leaks.reduce((s, l) => s + l.saving, 0);
  const leakRatio = tools > 0 ? leakMonthly / tools : 0;

  const lastTouch = data.bookTouches
    .filter((t) => t <= day)
    .sort()
    .at(-1);
  const freshnessDays = lastTouch ? diffDays(day, lastTouch) : 30;

  const factors: Factor[] = [
    {
      key: "margin",
      label: "Profit margin",
      weight: 30,
      value: clamp01(margin / 0.3),
      points: 0,
      reading: `${(margin * 100).toFixed(1)}% kept`,
      hint: "Full marks at 30% of sales kept as profit.",
    },
    {
      key: "runway",
      label: "Cash runway",
      weight: 25,
      value: clamp01(runwayWeeks / 16),
      points: 0,
      reading: `${runwayWeeks.toFixed(1)} weeks`,
      hint: "Full marks at 16 weeks of fixed costs in the bank.",
    },
    {
      key: "fees",
      label: "Fee load",
      weight: 20,
      value: clamp01((0.22 - feeLoad) / 0.16),
      points: 0,
      reading: `${(feeLoad * 100).toFixed(1)}% of sales`,
      hint: "Platform and payment fees as a share of sales. Full marks at 6% or less.",
    },
    {
      key: "expenses",
      label: "Expense control",
      weight: 15,
      value: clamp01(1 - leakRatio / 0.15),
      points: 0,
      reading: `${(leakRatio * 100).toFixed(1)}% leaking`,
      hint: "Money lost to leaks as a share of running costs. Full marks at zero.",
    },
    {
      key: "freshness",
      label: "Books up to date",
      weight: 10,
      value: clamp01(1 - freshnessDays / 7),
      points: 0,
      reading: freshnessDays === 0 ? "Updated today" : `${freshnessDays} day${freshnessDays === 1 ? "" : "s"} old`,
      hint: "Full marks when you review or update your books today.",
    },
  ];
  for (const f of factors) f.points = f.value * f.weight;
  const score = Math.round(factors.reduce((s, f) => s + f.points, 0) * 10) / 10;

  return {
    day,
    revenue,
    orders: count,
    cogs,
    platformFees,
    paymentFees,
    shipping,
    tools,
    trueProfit,
    margin,
    cash,
    weeklyFixed,
    runwayWeeks,
    feeLoad,
    leakMonthly,
    leakCount: leaks.length,
    largestLeak: leaks[0]?.saving ?? 0,
    freshnessDays,
    factors,
    score,
  };
}

/** Metrics for each of the last `days` days, oldest first. */
export function history(data: DemoData, today: Day, days: number): Metrics[] {
  const out: Metrics[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(computeMetrics(data, addDays(today, -i), today));
  return out;
}

export function scoreBand(score: number) {
  if (score >= 85) return { label: "Excellent", tone: "good" as const };
  if (score >= 70) return { label: "Strong", tone: "good" as const };
  if (score >= 50) return { label: "Fair", tone: "warn" as const };
  return { label: "At risk", tone: "bad" as const };
}
