import { createSeed } from "../src/lib/seed";
import { computeMetrics, history } from "../src/lib/engine";
const today = "2026-11-14";
const d = createSeed(today);
const m = computeMetrics(d, today, today);
console.log({rev:m.revenue.toFixed(0), orders:m.orders, cogs:m.cogs.toFixed(0), plat:m.platformFees.toFixed(0), pay:m.paymentFees.toFixed(0), ship:m.shipping.toFixed(0), tools:m.tools, profit:m.trueProfit.toFixed(0), margin:m.margin.toFixed(3), cash:m.cash.toFixed(0), runway:m.runwayWeeks.toFixed(1), fee:m.feeLoad.toFixed(3), leak:m.leakMonthly, score:m.score});
console.log(m.factors.map(f=>`${f.key} ${f.points.toFixed(1)} (${f.reading})`).join("\n"));
console.log(history(d,today,90).filter((_,i)=>i%10==0||i==89).map(x=>x.score).join(" "));
