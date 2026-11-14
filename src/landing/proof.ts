// The landing page's live numbers, computed by the same engine as the app (src/lib).
// Bundled to public/landing/proof.js by `npm run build:landing`.
//
// Every element with data-fp="<key>" gets that figure from the sample store as of today;
// the proof widget adds a sample order exactly as the app's "Simulate new order" does.

import { realToday } from "@/lib/date";
import { computeMetrics, orderProfit, scoreBand, type Metrics } from "@/lib/engine";
import { buildOrder, createSeed, pickChannel, rng, CHANNEL_LABEL } from "@/lib/seed";
import type { DemoData } from "@/lib/types";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const today = realToday();
let data: DemoData = createSeed(today);
let metrics = computeMetrics(data, today, today);
let added = 0;

function figures(m: Metrics): Record<string, string> {
  const factor = (k: string) => m.factors.find((f) => f.key === k)!;
  return {
    score: m.score.toFixed(1),
    band: scoreBand(m.score).label,
    revenue: usd0.format(m.revenue),
    orders: String(m.orders),
    cogs: `−${usd0.format(m.cogs)}`,
    platformFees: `−${usd0.format(m.platformFees)}`,
    paymentFees: `−${usd0.format(m.paymentFees)}`,
    shipping: `−${usd0.format(m.shipping)}`,
    tools: `−${usd0.format(m.tools)}`,
    toolsPlain: usd0.format(m.tools),
    profit: usd0.format(m.trueProfit),
    margin: `${(m.margin * 100).toFixed(1)}%`,
    marginRound: `${Math.round(m.margin * 100)}%`,
    feeLoad: `${(m.feeLoad * 100).toFixed(1)}%`,
    feeRound: `${Math.round(m.feeLoad * 100)}%`,
    cash: usd0.format(m.cash),
    runway: m.runwayWeeks.toFixed(1),
    leaks: usd0.format(m.leakMonthly),
    "f-margin": factor("margin").points.toFixed(1),
    "f-runway": factor("runway").points.toFixed(1),
    "f-fees": factor("fees").points.toFixed(1),
    "f-expenses": factor("expenses").points.toFixed(1),
    "f-freshness": factor("freshness").points.toFixed(1),
  };
}

function paint(m: Metrics) {
  const f = figures(m);
  document.querySelectorAll<HTMLElement>("[data-fp]").forEach((el) => {
    const v = f[el.dataset.fp!];
    if (v !== undefined && el.textContent !== v) el.textContent = v;
  });
  // Factor bars: width = points / weight.
  document.querySelectorAll<HTMLElement>("[data-fp-bar]").forEach((el) => {
    const factor = m.factors.find((x) => x.key === el.dataset.fpBar);
    if (factor) el.style.setProperty("--v", String(factor.value));
  });
}

function addOrder(button: HTMLButtonElement) {
  const seq = data.orderSeq;
  const rand = rng(seq * 97 + 13);
  const channel = pickChannel(rand, today);
  const now = new Date();
  const order = buildOrder(rand, channel === "market" ? "shopify" : channel, today, seq, {
    live: true,
    at: Date.now(),
    source: "synced",
    id: `o${seq}-landing`,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  });
  const before = metrics;
  data = { ...data, orders: [...data.orders, order], orderSeq: seq + 1 };
  metrics = computeMetrics(data, today, today);
  added++;
  paint(metrics);

  const keep = orderProfit(order);
  const set = (key: string, value: string) => {
    const el = document.querySelector<HTMLElement>(`[data-fp-order="${key}"]`);
    if (el) el.textContent = value;
  };
  set("item", `${order.item} ×${order.qty}`);
  set("meta", `${order.ref} · ${CHANNEL_LABEL[order.channel]} · ${order.time}`);
  set("gross", usd2.format(order.gross));
  set("fees", `−${usd2.format(order.platformFee + order.paymentFee + order.shipping)}`);
  set("cost", `−${usd2.format(order.cogs)}`);
  set("keep", usd2.format(keep));
  set("delta", `Score ${before.score.toFixed(1)} → ${metrics.score.toFixed(1)}`);
  set("count", added === 1 ? "1 order added" : `${added} orders added`);

  const row = document.querySelector<HTMLElement>("[data-fp-order-row]");
  const empty = document.querySelector<HTMLElement>("[data-fp-empty]");
  if (empty) empty.hidden = true;
  if (row) {
    row.hidden = false;
    row.classList.remove("fp-flash");
    void row.offsetWidth; // restart the highlight
    row.classList.add("fp-flash");
  }
  button.blur();
  button.focus();
}

function init() {
  paint(metrics);
  document.querySelectorAll<HTMLButtonElement>("[data-fp-add]").forEach((b) => b.addEventListener("click", () => addOrder(b)));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
