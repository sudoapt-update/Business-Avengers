import { addDays, diffDays, type Day } from "./date";
import type { DemoData, Expense, Leak, Order } from "./types";

// Every number on the dashboard comes from here. Nothing derived is stored:
// the score, profit bridge, runway and leak totals are recomputed from the
// tables each time, so any edit or simulated order moves them through the math.

export const orderNet = (o: Order) => o.gross - o.platformFee - o.paymentFee - o.shipping;
export const orderProfit = (o: Order) => orderNet(o) - o.cogs;

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

/** Cash today = account balances + every live order and one-off since the seed snapshot. */
export function cashNow(data: DemoData) {
  let c = data.cash.reduce((s, a) => s + a.balance, 0);
  for (const o of data.orders) if (o.live) c += orderProfit(o);
  for (const e of data.expenses) if (e.live && e.cadence === "one-off") c -= e.amount;
  return c;
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

export function computeMetrics(data: DemoData, day: Day, today: Day): Metrics {
  const from = addDays(day, -30);
  let revenue = 0, cogs = 0, platformFees = 0, paymentFees = 0, shipping = 0, count = 0;
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

  const cash = cashAt(data, day, today);
  const weeklyFixed = ((exp.monthly + data.ownerDrawMonthly) * 12) / 52;
  const runwayWeeks = weeklyFixed > 0 ? Math.max(0, cash / weeklyFixed) : 52;

  const feeLoad = revenue > 0 ? (platformFees + paymentFees) / revenue : 0;

  const leaks = leaksFor(data, day).filter((l) => l.saving > 0);
  const leakMonthly = leaks.reduce((s, l) => s + l.saving, 0);
  const leakRatio = tools > 0 ? leakMonthly / tools : 0;

  const lastTouch = data.bookTouches.filter((t) => t <= day).sort().at(-1);
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
