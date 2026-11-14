import { addDays, type Day } from "./date";
import { leaksFor, orderProfit, stockLevels, type Metrics } from "./engine";
import { CHANNEL_LABEL, STORE } from "./seed";
import type { Channel, DemoData } from "./types";

// Shared by the browser and the /api/adviser route: the numbers the adviser may
// use, and the answer computed from them when the model can't be reached.

export const ADVISER_COST = 5;
export const MAX_QUESTION = 400;

export const SUGGESTED_QUESTIONS = [
  "Can I afford a part-time packer?",
  "Why is my margin where it is, and how do I raise it?",
  "Should I sell more on my own store or the marketplace?",
  "Which money leak should I fix first?",
  "Is my cash enough to restock for the holidays?",
];

export interface AdviserContext {
  store: string;
  today: Day;
  healthScore: number;
  scoreParts: { part: string; points: number; outOf: number; reading: string }[];
  last30Days: {
    sales: number;
    orders: number;
    costOfGoods: number;
    marketplaceFees: number;
    paymentFees: number;
    shippingLabels: number;
    toolsAndRunningCosts: number;
    trueProfit: number;
    marginPct: number;
    feesPctOfSales: number;
  };
  cash: { total: number; weeklyFixedCostsAndOwnerPay: number; runwayWeeks: number; ownerPayMonthly: number };
  channels: { channel: string; sales: number; orders: number; keepPer100: number }[];
  openLeaks: { title: string; payingNow: number; cheaperOption: string; cheaperPrice: number; savingPerMonth: number }[];
  lowStock: { product: string; units: number }[];
}

const r = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A compact, plain-number summary of the store for the model's context. */
export function buildContext(data: DemoData, m: Metrics, today: Day): AdviserContext {
  const from = addDays(today, -30);
  const recent = data.orders.filter((o) => o.day > from && o.day <= today);
  const channels = (["shopify", "amazon", "market"] as Channel[]).map((c) => {
    const os = recent.filter((o) => o.channel === c);
    const sales = os.reduce((s, o) => s + o.gross, 0);
    const keep = os.reduce((s, o) => s + orderProfit(o), 0);
    return { channel: CHANNEL_LABEL[c], sales: r(sales), orders: os.length, keepPer100: sales ? r1((keep / sales) * 100) : 0 };
  });

  return {
    store: STORE.name,
    today,
    healthScore: m.score,
    scoreParts: m.factors.map((f) => ({ part: f.label, points: r1(f.points), outOf: f.weight, reading: f.reading })),
    last30Days: {
      sales: r(m.revenue),
      orders: m.orders,
      costOfGoods: r(m.cogs),
      marketplaceFees: r(m.platformFees),
      paymentFees: r(m.paymentFees),
      shippingLabels: r(m.shipping),
      toolsAndRunningCosts: r(m.tools),
      trueProfit: r(m.trueProfit),
      marginPct: r1(m.margin * 100),
      feesPctOfSales: r1(m.feeLoad * 100),
    },
    cash: {
      total: r(m.cash),
      weeklyFixedCostsAndOwnerPay: r(m.weeklyFixed),
      runwayWeeks: r1(m.runwayWeeks),
      ownerPayMonthly: data.ownerDrawMonthly,
    },
    channels,
    openLeaks: leaksFor(data, today)
      .filter((l) => l.saving > 0)
      .map((l) => ({
        title: l.leak.title,
        payingNow: l.expense.amount,
        cheaperOption: l.leak.alternative,
        cheaperPrice: l.leak.altPrice,
        savingPerMonth: l.saving,
      })),
    lowStock: stockLevels(data)
      .filter((s) => s.units < 20)
      .map((s) => ({ product: s.item.name, units: s.units })),
  };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * An answer computed from the store's own numbers. Used when the model call
 * fails, is rate-limited or isn't configured, so the chat never shows an error.
 */
export function fallbackAnswer(question: string, c: AdviserContext): string {
  const q = question.toLowerCase();
  const p = c.last30Days;
  const own = c.channels.find((x) => x.channel === "Shopify");
  const mkt = c.channels.find((x) => x.channel === "Amazon");
  const leak = c.openLeaks[0];
  const weakest = [...c.scoreParts].sort((a, b) => b.outOf - b.points - (a.outOf - a.points))[0];

  if (/hire|packer|employee|staff|helper|assistant|afford/.test(q)) {
    const cost = 15 * 17 * 4.33; // 15 hours a week at $17/hour, an example US rate
    const left = p.trueProfit - cost;
    return [
      `A packer for 15 hours a week at about $17 an hour costs roughly ${usd(cost)} a month.`,
      `Last month the shop kept ${usd(p.trueProfit)} after every cost, so hiring would leave ${usd(left)}${left < 0 ? ", a loss" : ""}.`,
      `Cash covers ${c.cash.runwayWeeks} weeks of fixed costs; a new monthly cost shortens that.`,
      left > 500
        ? "Next step: try 8 hours a week for a month and check whether you sell more with the time you free up."
        : `Next step: fix the open leaks first (${usd(c.openLeaks.reduce((s, l) => s + l.savingPerMonth, 0))}/mo) and revisit once profit is above ${usd(cost + 500)}.`,
    ].join(" ");
  }

  if (/channel|amazon|marketplace|shopify|own store|etsy|where.*sell/.test(q) && own && mkt) {
    return [
      `On every $100 sold you keep $${own.keepPer100} on your own store and $${mkt.keepPer100} on the marketplace, after fees, postage and product cost.`,
      `The marketplace brought ${usd(mkt.sales)} from ${mkt.orders} orders, so it is worth keeping for new buyers.`,
      "Next step: put a card in every marketplace parcel inviting repeat buyers to your store with a small discount.",
    ].join(" ");
  }

  if (/leak|save|saving|cut|subscription|tool|expense/.test(q)) {
    if (!leak) return "Every leak we found is fixed. Next step: review your monthly costs in Books once a month so new ones don't stack up.";
    return [
      `Start with "${leak.title.toLowerCase()}": you pay ${usd(leak.payingNow)}/mo and ${leak.cheaperOption.toLowerCase()} costs ${usd(leak.cheaperPrice)}, saving ${usd(leak.savingPerMonth)} a month.`,
      `All ${c.openLeaks.length} open leaks together come to ${usd(c.openLeaks.reduce((s, l) => s + l.savingPerMonth, 0))} a month, about ${Math.round((c.openLeaks.reduce((s, l) => s + l.savingPerMonth, 0) / Math.max(1, p.trueProfit)) * 100)}% of last month's profit.`,
      "Next step: make that one change today and mark it done on the Leaks page.",
    ].join(" ");
  }

  if (/cash|runway|restock|reorder|stock|inventory|holiday/.test(q)) {
    return [
      `You have ${usd(c.cash.total)} in cash, which covers ${c.cash.runwayWeeks} weeks of fixed costs and your own pay (${usd(c.cash.weeklyFixedCostsAndOwnerPay)} a week).`,
      c.lowStock.length
        ? `Running low: ${c.lowStock.map((s) => `${s.product} (${s.units} left)`).join(", ")}.`
        : "No product is below 20 units.",
      c.cash.runwayWeeks >= 12
        ? "Next step: you can restock without borrowing; order the low items first."
        : `Next step: keep at least 12 weeks in reserve, so limit a restock to about ${usd(Math.max(0, c.cash.total - 12 * c.cash.weeklyFixedCostsAndOwnerPay))} for now.`,
    ].join(" ");
  }

  if (/price|pricing|raise|charge/.test(q)) {
    const extra = p.sales * 0.05;
    return [
      `A 5% price rise on the same number of orders adds about ${usd(extra)} a month, all of it profit.`,
      `That would take your margin from ${p.marginPct}% to about ${Math.round(((p.trueProfit + extra) / (p.sales + extra)) * 1000) / 10}%.`,
      "Next step: raise the price of your best seller first and watch orders for two weeks.",
    ].join(" ");
  }

  if (/margin|profit|making money|earn/.test(q)) {
    const costs = [
      ["product costs", p.costOfGoods],
      ["tools and running costs", p.toolsAndRunningCosts],
      ["marketplace fees", p.marketplaceFees],
      ["shipping labels", p.shippingLabels],
    ] as const;
    const top = [...costs].sort((a, b) => b[1] - a[1]);
    return [
      `Your margin is ${p.marginPct}%: from ${usd(p.sales)} of sales you kept ${usd(p.trueProfit)}.`,
      `The biggest costs are ${top[0][0]} (${usd(top[0][1])}) and ${top[1][0]} (${usd(top[1][1])}); fees take ${p.feesPctOfSales}% of sales.`,
      leak
        ? `Next step: fixing the open leaks adds ${usd(c.openLeaks.reduce((s, l) => s + l.savingPerMonth, 0))} a month straight to profit.`
        : "Next step: move repeat buyers to your own store, where fees are lowest.",
    ].join(" ");
  }

  return [
    `Your Health Score is ${c.healthScore} out of 100. Last month you kept ${usd(p.trueProfit)} from ${usd(p.sales)} of sales, and cash covers ${c.cash.runwayWeeks} weeks.`,
    `The biggest gap is ${weakest.part.toLowerCase()} (${weakest.points} of ${weakest.outOf}, ${weakest.reading}).`,
    leak ? `Next step: fix "${leak.title.toLowerCase()}" to save ${usd(leak.savingPerMonth)} a month.` : "Next step: do today's missions to keep your books current.",
  ].join(" ");
}
