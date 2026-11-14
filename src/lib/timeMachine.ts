import { addDays, type Day } from "./date";
import { computeMetrics, type Metrics } from "./engine";
import type { DemoData, Order } from "./types";

// The Time Machine replays the last 30 days with a change applied, then runs the same score formula
// as the rest of the app. Nothing is stored: the store's data is copied, never edited.
// Simplifications, stated on the page: a price change keeps the same number of orders, and ad spend
// is a cost only (sales are held steady).

export type LeverId = "price" | "ads" | "move" | "leaks";
export interface Levers {
  /** Price change in percent, -10 to +20. */
  price: number;
  /** Monthly ad spend in dollars. */
  ads: number;
  /** Percent of Amazon orders moved to the seller's own store, 0 to 50. */
  move: number;
  /** Switch every open leak to its cheaper option. */
  leaks: boolean;
}

export const LEVER_ORDER: LeverId[] = ["price", "ads", "move", "leaks"];
export const PRICE_RANGE = { min: -10, max: 20, step: 1 };
export const MOVE_RANGE = { min: 0, max: 50, step: 5 };

/** Fee rates from the seed's fee model (illustrative, not real platform rates). */
const AMAZON_REFERRAL = 0.15;
const STORE_CARD_RATE = 0.029;
const STORE_CARD_FIXED = 0.3;
const MARKET_CARD_RATE = 0.026;
const storePostage = (gross: number) => (gross >= 50 ? 8.4 : 4.2);

export function adSpend(data: DemoData, day: Day) {
  return data.expenses
    .filter((e) => e.category === "Advertising" && e.cadence === "monthly" && e.day <= day)
    .reduce((s, e) => s + e.amount, 0);
}

export function adsRange(base: number) {
  return { min: 0, max: Math.max(4000, Math.ceil((base * 2) / 500) * 500), step: 100 };
}

export function baseLevers(data: DemoData, day: Day): Levers {
  return { price: 0, ads: adSpend(data, day), move: 0, leaks: false };
}

export function isActive(l: Levers, base: Levers, id: LeverId) {
  return l[id] !== base[id];
}

export function activeLevers(l: Levers, base: Levers): LeverId[] {
  return LEVER_ORDER.filter((id) => isActive(l, base, id));
}

/** One order as it would have gone with the price change and the channel move applied. */
function replayOrder(o: Order, price: number, move: number): Order {
  let gross = o.gross;
  let platformFee = o.platformFee;
  let paymentFee = o.paymentFee;
  let shipping = o.shipping;
  // Share of this order that now goes through the seller's own store (Amazon orders only).
  const moved = o.channel === "amazon" ? move : 0;

  if (moved > 0) {
    // The moved share pays card fees and postage instead of Amazon's referral and fulfilment fees.
    platformFee *= 1 - moved;
    paymentFee = paymentFee * (1 - moved) + (gross * STORE_CARD_RATE + STORE_CARD_FIXED) * moved;
    shipping = shipping * (1 - moved) + storePostage(gross) * moved;
  }

  if (price !== 0) {
    const extra = gross * price;
    // Percentage fees grow with the price; fixed fees, postage and the product's cost do not.
    if (o.channel === "amazon") {
      platformFee += extra * AMAZON_REFERRAL * (1 - moved);
      paymentFee += extra * STORE_CARD_RATE * moved;
    } else if (o.channel === "shopify") {
      paymentFee += extra * STORE_CARD_RATE;
    } else if (o.paymentFee > 0) {
      paymentFee += extra * MARKET_CARD_RATE;
    }
    gross += extra;
  }

  return { ...o, gross, platformFee, paymentFee, shipping };
}

export interface Scenario {
  now: Metrics;
  after: Metrics;
  /** Extra (or lost) profit over the last 30 days. */
  profitDelta: number;
  leaksFixed: number;
}

export function simulate(data: DemoData, today: Day, l: Levers): Scenario {
  const now = computeMetrics(data, today, today);
  const from = addDays(today, -30);
  const price = l.price / 100;
  const move = l.move / 100;

  const orders =
    price === 0 && move === 0 ? data.orders : data.orders.map((o) => (o.day > from && o.day <= today ? replayOrder(o, price, move) : o));

  const currentAds = adSpend(data, today);
  const adScale = currentAds > 0 ? l.ads / currentAds : 1;
  const expenses =
    adScale === 1
      ? data.expenses
      : data.expenses.map((e) =>
          e.category === "Advertising" && e.cadence === "monthly" && e.day <= today ? { ...e, amount: e.amount * adScale } : e,
        );

  const open = data.leaks.filter((x) => !x.appliedOn);
  const leaks = l.leaks ? data.leaks.map((x) => (x.appliedOn ? x : { ...x, appliedOn: today })) : data.leaks;

  const replay: DemoData = { ...data, orders, expenses, leaks };
  // First pass for the change in profit, second pass with cash moved by that change.
  const first = computeMetrics(replay, today, today, { cash: now.cash });
  const profitDelta = first.trueProfit - now.trueProfit;
  const after = computeMetrics(replay, today, today, { cash: now.cash + profitDelta });

  return { now, after, profitDelta, leaksFixed: l.leaks ? open.length : 0 };
}
