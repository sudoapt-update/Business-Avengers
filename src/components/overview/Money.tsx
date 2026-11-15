"use client";

import Link from "next/link";
import {
  ArrowDownUp,
  ArrowRight,
  CreditCard,
  Droplets,
  Lock,
  Package,
  PiggyBank,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { leakUnlocked, useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { byNewest, weeklyCashflow } from "@/lib/engine";
import { cn, money, money2, pct, signedMoney } from "@/lib/format";
import { Button, Card, CardHeader, Caps, IconTile, Pill, type TileTone } from "@/components/ui/primitives";
import { CashFlowChart } from "@/components/ui/charts";
import { OrderList } from "@/components/orders/OrderList";

export function OrderFeed() {
  const d = useDerived();
  const simulateOrder = useStore((s) => s.simulateOrder);
  const lastOrderId = useStore((s) => s.lastOrderId);
  const recent = [...d.data.orders].sort(byNewest).slice(0, 5);
  const todayCount = d.data.orders.filter((o) => o.day === d.today).length;

  return (
    <Card>
      <span id="order-feed" className="block scroll-mt-24" />
      <CardHeader
        icon={
          <IconTile tone="violet">
            <RefreshCw />
          </IconTile>
        }
        title="Live order sync"
        sub="Demo connection — no real account is accessed."
        right={
          <Button variant="primary" size="sm" onClick={() => simulateOrder()} className="shrink-0">
            <RefreshCw className="size-3.5" /> Simulate new order
          </Button>
        }
      />
      <div className="mt-3">
        <OrderList orders={recent} today={d.today} highlightId={lastOrderId} />
      </div>
      <SyncImpact todayCount={todayCount} />
    </Card>
  );
}

/** What the last synced order changed, or a plain note when nothing has synced yet. */
export function SyncImpact({ todayCount }: { todayCount: number }) {
  const impact = useStore((s) => s.lastImpact);
  return (
    <div className="border-line text-muted flex flex-wrap items-center gap-2 border-t px-5 py-3 text-[13px]">
      {impact ? (
        <>
          <Pill tone="good" className="tnum font-mono">
            Score {impact.scoreFrom.toFixed(1)} → {impact.scoreTo.toFixed(1)}
          </Pill>
          <Pill tone="neutral" className="tnum font-mono">
            Cash +{money2(impact.cash)}
          </Pill>
          <span>Revenue, cash, score and Books updated from one order.</span>
        </>
      ) : (
        <span>{todayCount} orders synced today. &ldquo;You keep&rdquo; is the sale minus fees, shipping and the cost of the product.</span>
      )}
    </div>
  );
}

/** Money in against money out, week by week, with the totals for the period above the chart. */
export function CashFlowCard({
  weeks = 8,
  booksLink = true,
}: {
  weeks?: number;
  /** Off when the card already sits on the Books page. */ booksLink?: boolean;
}) {
  const d = useDerived();
  const rows = weeklyCashflow(d.data, d.today, weeks);
  const totalIn = rows.reduce((s, w) => s + w.totalIn, 0);
  const totalOut = rows.reduce((s, w) => s + w.out, 0);
  const net = totalIn - totalOut;
  const up = rows.filter((w) => w.net >= 0).length;

  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="info">
            <ArrowDownUp />
          </IconTile>
        }
        title="Cash flow"
        sub={`Money in and money out, last ${weeks} weeks. Hover a week for its figures.`}
        right={
          booksLink ? (
            <Link href="/app/books" className="text-muted hover:text-ink shrink-0 text-[13px]">
              Open Books
            </Link>
          ) : undefined
        }
      />
      <dl className="border-line mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--color-line)] rounded-lg border">
        {[
          { k: "Money in", v: money(totalIn), c: "" },
          { k: "Money out", v: `−${money(totalOut)}`, c: "" },
          { k: "Net", v: signedMoney(net), c: net >= 0 ? "text-good" : "text-bad" },
        ].map((x) => (
          <div key={x.k} className="px-3 py-2.5 sm:px-4">
            <dt>
              <Caps>{x.k}</Caps>
            </dt>
            <dd className={cn("tnum mt-1 text-base font-semibold tracking-tight sm:text-xl", x.c)}>{x.v}</dd>
          </div>
        ))}
      </dl>
      <div className="px-5 pt-4">
        <CashFlowChart weeks={rows} />
      </div>
      <p className="border-line text-muted mt-3 border-t px-5 py-3 text-[13px]">
        {up} of {weeks} weeks brought in more than went out. Money out counts stock, fees, postage, running costs and your own pay.
      </p>
    </Card>
  );
}

export function ProfitBridge() {
  const d = useDerived();
  const m = d.metrics;
  const rows: { label: string; sub: string; value: number; icon: LucideIcon; tile: TileTone; kind?: "start" | "end" }[] = [
    { label: "Sales", sub: `${m.orders} orders, 3 channels`, value: m.revenue, icon: ShoppingBag, tile: "info", kind: "start" },
    { label: "Cost of goods", sub: "What the products cost to make", value: -m.cogs, icon: Package, tile: "neutral" },
    { label: "Marketplace fees", sub: "Referral and fulfilment", value: -m.platformFees, icon: Store, tile: "neutral" },
    { label: "Card fees", sub: "Checkout and card reader", value: -m.paymentFees, icon: CreditCard, tile: "neutral" },
    { label: "Shipping labels", sub: "Postage on free-shipping orders", value: -m.shipping, icon: Truck, tile: "neutral" },
    { label: "Running costs", sub: "Subscriptions, ads, booth", value: -m.tools, icon: Wrench, tile: "neutral" },
    { label: "True profit", sub: "What the business kept", value: m.trueProfit, icon: PiggyBank, tile: "good", kind: "end" },
  ];
  // Waterfall: each cost starts where the one before it ended, so the bars step down from sales to profit.
  let left = m.revenue;
  const bars = rows.map((r) => {
    if (r.kind) return { from: 0, width: Math.max(0, r.value) };
    left += r.value;
    return { from: Math.max(0, left), width: -r.value };
  });
  const scale = (n: number) => `${Math.min(100, (n / Math.max(1, m.revenue)) * 100)}%`;

  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="good">
            <PiggyBank />
          </IconTile>
        }
        title="Where your sales went"
        sub="The last 30 days, from money in to what you kept."
      />
      <ul className="mt-3 px-5">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={r.label} className={cn("flex items-center gap-3 py-2", r.kind === "end" && "border-line mt-1 border-t pt-3")}>
              <IconTile tone={r.tile} size="sm">
                <Icon />
              </IconTile>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-sm", r.kind ? "font-medium" : "text-ink-2")} title={r.sub}>
                    {r.label}
                  </span>
                  <span className={cn("tnum font-mono text-sm", r.kind && "font-semibold", r.kind === "end" && "text-good")}>
                    {r.value < 0 ? `−${money(-r.value)}` : money(r.value)}
                  </span>
                </div>
                <div className="bg-hover relative mt-1.5 h-2 overflow-hidden rounded-full" aria-hidden>
                  <span
                    className={cn(
                      "absolute inset-y-0 rounded-full transition-[left,width] duration-500",
                      r.kind === "start" ? "bg-info-dot" : r.kind === "end" ? "bg-good-dot" : "bg-ch-out",
                    )}
                    style={{ left: scale(bars[i].from), width: scale(bars[i].width) }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="bg-good-bg text-ink-2 mx-5 mt-3 mb-5 rounded-lg px-4 py-3 text-[13px]">
        Out of every $100 of sales, you keep <span className="tnum text-good font-mono font-semibold">${(m.margin * 100).toFixed(2)}</span>.
        Fees take <span className="tnum font-mono">{pct(m.feeLoad)}</span>, more than shipping.
      </div>
    </Card>
  );
}

export function TopLeaks() {
  const d = useDerived();
  const tier = useStore((s) => s.tier);
  const { openSheet, unlockLeak, openUpgrade } = useStore.getState();
  const open = d.leaks.filter((l) => !l.applied);
  const first = open[0];
  const locked = open[1];

  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="bad">
            <Droplets />
          </IconTile>
        }
        title="Top money leaks"
        sub={open.length ? `${money(d.metrics.leakMonthly)}/mo across ${open.length} leaks` : "No open leaks"}
        right={
          <Link href="/app/leaks" className="text-muted hover:text-ink shrink-0 text-[13px]">
            All leaks
          </Link>
        }
      />
      <ul className="divide-line border-line mt-3 divide-y border-t">
        {first && (
          <li>
            <button
              className="hover:bg-canvas block w-full px-5 py-4 text-left"
              onClick={() => openSheet({ kind: "leak", leakId: first.leak.id })}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{first.leak.title}</span>
                <Pill tone="good" className="tnum font-mono">
                  −{money(first.saving)}/mo
                </Pill>
              </div>
              <div className="tnum text-muted mt-2 font-mono text-[12px]">
                {money(first.expense.amount)}/mo → {money(first.leak.altPrice)}
                /mo
              </div>
              <div className="text-ink-2 mt-1 text-[13px]">{first.leak.alternative}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium">
                {leakUnlocked(tier, first.leak) ? "See the steps" : "Preview"} <ArrowRight className="size-3.5" />
              </div>
            </button>
          </li>
        )}
        {locked && (
          <li className="px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium">{locked.leak.title}</span>
              <Pill tone="good" className="tnum font-mono">
                −{money(locked.saving)}/mo
              </Pill>
            </div>
            {leakUnlocked(tier, locked.leak) ? (
              <Button size="sm" className="mt-3" onClick={() => openSheet({ kind: "leak", leakId: locked.leak.id })}>
                See the steps
              </Button>
            ) : (
              <>
                <div className="text-muted mt-2 flex items-center gap-1.5 text-[13px]">
                  <Lock className="size-3.5" /> Cheaper option and steps are on Growth
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => unlockLeak(locked.leak.id) && openSheet({ kind: "leak", leakId: locked.leak.id })}>
                    Unlock · {locked.leak.unlockCost} tokens
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      openUpgrade({
                        title: "See every leak on Growth",
                        body: `Growth shows all ${open.length} leaks with step-by-step fixes, worth ${money(d.metrics.leakMonthly)}/mo here.`,
                      })
                    }
                  >
                    Growth plan
                  </Button>
                </div>
              </>
            )}
          </li>
        )}
        {!first && (
          <li className="text-muted px-5 py-4 text-sm">Every leak we found is fixed. We check again when your expenses change.</li>
        )}
      </ul>
      <p className="border-line text-muted border-t px-5 py-2.5 text-xs">
        Example tool categories and prices, not real brands&apos; pricing.
      </p>
    </Card>
  );
}
