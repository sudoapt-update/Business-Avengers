import { addDays, fromDay, type Day } from "./date";
import type { Channel, DemoData, Expense, Leak, Order } from "./types";

// Sample store: "Emberline Candle Co.", a hybrid seller on Shopify, Amazon
// and a weekend market, at roughly $14k a month in sales.

export const STORE = { name: "Emberline Candle Co.", owner: "Sam Rivera", initials: "SR" };

interface Product {
  name: string;
  price: number;
  cost: number;
}

export const PRODUCTS: Product[] = [
  { name: "Soy candle, 8 oz", price: 28, cost: 10.5 },
  { name: "Candle trio gift set", price: 64, cost: 25 },
  { name: "Ceramic mug candle", price: 36, cost: 14 },
  { name: "Wax melts, 6-pack", price: 16, cost: 5.5 },
  { name: "Reed diffuser", price: 42, cost: 16 },
  { name: "Wick trimmer", price: 18, cost: 6.5 },
];

export const CHANNEL_LABEL: Record<Channel, string> = {
  shopify: "Shopify",
  amazon: "Amazon",
  market: "Market",
};

/** Small deterministic PRNG so the seed is identical on every reset. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Fee and cost model per channel. Prices are illustrative, not real platform rates. */
export function buildOrder(
  rand: () => number,
  channel: Channel,
  day: Day,
  seq: number,
  extra: Partial<Order> = {},
): Order {
  const p = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
  const qty = rand() < 0.68 ? 1 : rand() < 0.75 ? 2 : 3;
  const gross = r2(p.price * qty);
  const cogs = r2(p.cost * qty);
  let platformFee = 0;
  let paymentFee = 0;
  let shipping = 0;
  if (channel === "shopify") {
    paymentFee = r2(gross * 0.029 + 0.3);
    shipping = gross >= 50 ? 8.4 : 4.2;
  } else if (channel === "amazon") {
    platformFee = r2(gross * 0.15 + 4.9 * qty);
  } else {
    paymentFee = rand() < 0.7 ? r2(gross * 0.026 + 0.15) : 0;
  }
  const h = channel === "market" ? 9 + Math.floor(rand() * 7) : 7 + Math.floor(rand() * 15);
  const m = Math.floor(rand() * 60);
  const ref =
    channel === "shopify"
      ? `#${3100 + seq}`
      : channel === "amazon"
        ? `114-${String(2000000 + seq * 7919).slice(-7)}`
        : `MKT-${String(seq).padStart(4, "0")}`;
  return {
    id: `o${seq}`,
    ref,
    day,
    time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    channel,
    item: p.name,
    qty,
    gross,
    cogs,
    platformFee,
    paymentFee,
    shipping,
    source: channel === "market" ? "manual" : "synced",
    ...extra,
  };
}

export function pickChannel(rand: () => number, day: Day): Channel {
  const dow = fromDay(day).getDay();
  const weekend = dow === 0 || dow === 6;
  const x = rand();
  if (weekend && x < 0.3) return "market";
  return x < (weekend ? 0.68 : 0.6) ? "shopify" : "amazon";
}

/** Orders for one calendar day; volume ramps up over the 90 days (growing shop). */
export function ordersForDay(day: Day, seqStart: number, growth: number, seed: number, upToHour = 24) {
  const rand = rng(seed);
  const dow = fromDay(day).getDay();
  const weekend = dow === 0 || dow === 6;
  const base = (weekend ? 11.8 : 7.4) * growth;
  const count = Math.max(1, Math.round(base + (rand() - 0.5) * 3));
  const out: Order[] = [];
  for (let i = 0; i < count; i++) {
    const o = buildOrder(rand, pickChannel(rand, day), day, seqStart + i);
    if (Number(o.time.slice(0, 2)) < upToHour) out.push(o);
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

export function createSeed(today: Day): DemoData {
  const orders: Order[] = [];
  let seq = 1;
  for (let i = 119; i >= 0; i--) {
    const day = addDays(today, -i);
    const growth = 0.84 + 0.26 * ((119 - i) / 119);
    // Today only has the morning's orders so the feed has room to grow.
    const batch = ordersForDay(day, seq, growth, 1000 + i * 31, i === 0 ? 11 : 24);
    seq += batch.length + 3;
    orders.push(...batch);
  }

  const start = addDays(today, -200);
  const exp = (id: string, name: string, category: Expense["category"], amount: number): Expense => ({
    id,
    day: start,
    name,
    category,
    amount,
    cadence: "monthly",
  });

  const expenses: Expense[] = [
    exp("e1", "Online store plan", "Software", 39),
    exp("e2", "Marketplace seller plan", "Software", 40),
    exp("e3", "Email marketing tool, premium tier", "Software", 99),
    exp("e4", "Inventory app, Pro plan", "Software", 89),
    exp("e5", "Shipping label app", "Software", 29),
    exp("e6", "Second shipping label app", "Software", 49),
    exp("e7", "Design tool, extra seat", "Software", 45),
    exp("e8", "Bookkeeping export app", "Software", 15),
    exp("e9", "Social ads", "Advertising", 2100),
    exp("e10", "Packaging and inserts", "Packaging", 310),
    exp("e11", "Weekend market booth", "Market booth", 260),
    exp("e12", "Phone and internet", "Utilities", 95),
    exp("e13", "Storage unit", "Other", 140),
  ];

  const leaks: Leak[] = [
    {
      id: "l1",
      expenseId: "e3",
      title: "Email tool is on a tier you don't use",
      problem: "You pay $99/mo for the premium email tier. Your list is 1,840 contacts and you send 4 campaigns a month.",
      alternative: "Standard tier with the same contact limit",
      altPrice: 29,
      steps: [
        "Export your contact list as a backup.",
        "Switch the plan to the standard tier at the next renewal.",
        "Keep your two automations; both run on the standard tier.",
      ],
      minTier: "starter",
      unlockCost: 3,
    },
    {
      id: "l2",
      expenseId: "e4",
      title: "Inventory app plan is sized for a warehouse",
      problem: "The Pro plan covers 5 locations. You stock 6 products in one storage unit.",
      alternative: "Basic plan, one location",
      altPrice: 39,
      steps: ["Confirm you use one stock location.", "Downgrade to Basic.", "Re-run the low-stock alert setup."],
      minTier: "growth",
      unlockCost: 3,
    },
    {
      id: "l3",
      expenseId: "e6",
      title: "Two shipping label apps doing one job",
      problem: "Both apps printed labels last month; the second handled 9% of shipments.",
      alternative: "Keep the first app only",
      altPrice: 0,
      steps: ["Move saved package sizes to the first app.", "Cancel the second app."],
      minTier: "growth",
      unlockCost: 3,
    },
    {
      id: "l4",
      expenseId: "e7",
      title: "Design seat nobody has opened",
      problem: "The extra seat has not logged in for 47 days.",
      alternative: "Remove the seat",
      altPrice: 0,
      steps: ["Transfer shared files to your own seat.", "Remove the extra seat."],
      minTier: "growth",
      unlockCost: 3,
    },
  ];

  const d = (n: number) => addDays(today, n);

  return {
    version: 1,
    seededOn: today,
    planStart: d(-17),
    ownerDrawMonthly: 2000,
    orders,
    expenses,
    inventory: [
      { id: "i1", sku: "EM-SOY8", name: "Soy candle, 8 oz", units: 214, unitCost: 10.5 },
      { id: "i2", sku: "EM-TRIO", name: "Candle trio gift set", units: 46, unitCost: 25 },
      { id: "i3", sku: "EM-MUG", name: "Ceramic mug candle", units: 58, unitCost: 14 },
      { id: "i4", sku: "EM-MELT", name: "Wax melts, 6-pack", units: 130, unitCost: 5.5 },
      { id: "i5", sku: "EM-REED", name: "Reed diffuser", units: 12, unitCost: 16 },
      { id: "i6", sku: "EM-TRIM", name: "Wick trimmer", units: 75, unitCost: 6.5 },
    ],
    cash: [
      { id: "c1", name: "Business checking", note: "Main operating account", balance: 10900 },
      { id: "c2", name: "Store payouts in transit", note: "Arrive in 2 business days", balance: 1520 },
      { id: "c3", name: "Marketplace balance", note: "Released every 14 days", balance: 940 },
      { id: "c4", name: "Market cash box", note: "Counted last Sunday", balance: 240 },
    ],
    leaks,
    missionLog: [
      { id: "m-3", missionId: "review-fees", day: d(-3), tokens: 10, xp: 30 },
      { id: "m-2", missionId: "add-expenses", day: d(-2), tokens: 15, xp: 50 },
      { id: "m-1", missionId: "simulate-order", day: d(-1), tokens: 20, xp: 60 },
    ],
    tokenLedger: [
      { id: "t1", day: d(-3), amount: 10, reason: "Mission reward" },
      { id: "t2", day: d(-2), amount: 15, reason: "Mission reward" },
      { id: "t3", day: d(-1), amount: 20, reason: "Mission reward" },
      { id: "t4", day: d(-9), amount: -50, reason: "10 AI Adviser questions" },
      { id: "t5", day: d(-6), amount: -3, reason: "Leak explanation" },
    ],
    // Books were last touched four days ago, so freshness is part of today's gap.
    bookTouches: [d(-12), d(-8), d(-4)],
    reviews: [],
    badges: [{ id: "first-sync", day: d(-1) }],
    orderSeq: seq + 10,
  };
}
