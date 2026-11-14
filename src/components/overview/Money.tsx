"use client";

import Link from "next/link";
import { ArrowRight, Lock, RefreshCw } from "lucide-react";
import { leakUnlocked, useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { byNewest } from "@/lib/engine";
import { cn, money, money2, pct } from "@/lib/format";
import { Button, Card, CardHeader, Pill, dotTone, type Tone } from "@/components/ui/primitives";
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
        title="Live order sync"
        sub="Demo connection — no real account is accessed."
        right={
          <Button variant="primary" size="sm" onClick={simulateOrder} className="shrink-0">
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

export function ProfitBridge() {
  const d = useDerived();
  const m = d.metrics;
  const rows: {
    label: string;
    sub: string;
    value: number;
    tone: Tone | "ink";
    kind?: "start" | "end";
  }[] = [
    {
      label: "Sales",
      sub: `${m.orders} orders across 3 channels`,
      value: m.revenue,
      tone: "good",
      kind: "start",
    },
    {
      label: "Cost of goods",
      sub: "What the products cost you to make",
      value: -m.cogs,
      tone: "neutral",
    },
    {
      label: "Marketplace fees",
      sub: "Referral and fulfilment fees",
      value: -m.platformFees,
      tone: "neutral",
    },
    {
      label: "Card and payment fees",
      sub: "Your own checkout and card reader",
      value: -m.paymentFees,
      tone: "neutral",
    },
    {
      label: "Shipping labels",
      sub: "Postage you paid on free-shipping orders",
      value: -m.shipping,
      tone: "neutral",
    },
    {
      label: "Tools and running costs",
      sub: "Subscriptions, ads, booth, storage",
      value: -m.tools,
      tone: "neutral",
    },
    {
      label: "True profit",
      sub: "What the business actually kept",
      value: m.trueProfit,
      tone: "ink",
      kind: "end",
    },
  ];

  return (
    <Card>
      <CardHeader title="Where your sales went" sub="The last 30 days, from money in to what you kept." />
      <ul className="mt-2 px-5">
        {rows.map((r) => (
          <li key={r.label} className={cn("flex items-center gap-3 py-2.5", r.kind === "end" && "border-line mt-1 border-t pt-3.5")}>
            <span className={cn("size-2 shrink-0 rounded-full", r.tone === "ink" ? "bg-ink" : dotTone[r.tone as Tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className={cn("text-sm", r.kind ? "font-medium" : "text-ink-2")}>{r.label}</div>
              <div className="text-muted text-xs">{r.sub}</div>
            </div>
            <div className="hidden w-28 sm:block" aria-hidden>
              <div className="bg-hover h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", r.kind ? "bg-ink" : "bg-faint")}
                  style={{
                    width: `${Math.min(100, (Math.abs(r.value) / m.revenue) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className={cn("tnum w-24 text-right font-mono text-sm", r.kind && "font-semibold")}>
              {r.value < 0 ? `−${money(-r.value)}` : money(r.value)}
            </div>
          </li>
        ))}
      </ul>
      <div className="bg-canvas text-ink-2 mx-5 mt-2 mb-5 rounded-lg px-4 py-3 text-[13px]">
        Out of every $100 of sales, you keep <span className="tnum text-ink font-mono font-medium">${(m.margin * 100).toFixed(2)}</span>.
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
