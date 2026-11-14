"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { addDays } from "@/lib/date";
import { byNewest, orderProfit } from "@/lib/engine";
import { CHANNEL_LABEL } from "@/lib/seed";
import { money, money2, num } from "@/lib/format";
import type { Channel } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, CardHeader, Caps, Pill } from "@/components/ui/primitives";
import { Pager, Segmented } from "@/components/ui/table";
import { SyncImpact } from "@/components/overview/Money";
import { ChannelLabel, OrderList } from "./OrderList";

const CHANNELS: Channel[] = ["shopify", "amazon", "market"];
const PAGE = 6;

type Filter = "all" | Channel;

export function OrdersView() {
  const d = useDerived();
  const simulateOrder = useStore((s) => s.simulateOrder);
  const lastOrderId = useStore((s) => s.lastOrderId);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);

  const from = addDays(d.today, -30);
  const recent = useMemo(
    () => d.data.orders.filter((o) => o.day > from && o.day <= d.today).sort(byNewest),
    [d.data.orders, from, d.today],
  );

  const stats = CHANNELS.map((c) => {
    const os = recent.filter((o) => o.channel === c);
    const gross = os.reduce((s, o) => s + o.gross, 0);
    const fees = os.reduce((s, o) => s + o.platformFee + o.paymentFee + o.shipping, 0);
    const keep = os.reduce((s, o) => s + orderProfit(o), 0);
    return { channel: c, count: os.length, gross, fees, keep, feeShare: gross ? fees / gross : 0, keepPer100: gross ? (keep / gross) * 100 : 0 };
  });
  const own = stats.find((s) => s.channel === "shopify")!;
  const mkt = stats.find((s) => s.channel === "amazon")!;
  const maxFee = Math.max(...stats.map((s) => s.feeShare), 0.01);

  const shown = filter === "all" ? recent : recent.filter((o) => o.channel === filter);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const todayCount = d.data.orders.filter((o) => o.day === d.today).length;

  return (
    <>
      <PageHeader
        title="Orders"
        sub={`Every order from your three channels in the last 30 days · ${num(recent.length)} orders`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              simulateOrder();
              setFilter("all");
              setPage(0);
            }}
          >
            <RefreshCw className="size-3.5" /> Simulate new order
          </Button>
        }
      />
      <div className="space-y-4">
        <Explainer>
          A sale is not what lands in your bank. Each channel keeps a different share before you see the money: marketplace referral and
          fulfilment fees, card fees on your own checkout, and postage on free-shipping orders. This screen shows each order next to{" "}
          <span className="font-medium text-ink">what you keep</span> once those and the product&apos;s cost come off. Shopify and
          Amazon rows sync on their own in the demo; market sales are added by hand in Books.
        </Explainer>

        <div className="grid gap-3 md:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.channel} className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <ChannelLabel channel={s.channel} />
                <Pill tone={s.channel === "market" ? "neutral" : "info"}>{s.channel === "market" ? "Added by hand" : "Demo sync"}</Pill>
              </div>
              <div className="tnum mt-3 text-[26px] leading-none font-semibold tracking-tight">{money(s.gross)}</div>
              <div className="mt-1 text-[13px] text-muted">{s.count} orders · 30 days</div>
              <div className="mt-4 space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted">Fees and postage</span>
                  <span className="tnum font-mono">
                    {money(s.fees)} · {(s.feeShare * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div
                    className={s.feeShare > 0.2 ? "h-full rounded-full bg-bad-dot" : s.feeShare > 0.1 ? "h-full rounded-full bg-warn-dot" : "h-full rounded-full bg-good-dot"}
                    style={{ width: `${(s.feeShare / maxFee) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted">You keep per $100</span>
                  <span className="tnum font-mono font-medium">{money2(s.keepPer100)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {own.gross > 0 && mkt.gross > 0 && (
          <div className="rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-ink-2 sm:px-5">
            On every $100 sold, you keep <span className="tnum font-mono font-medium text-ink">{money2(own.keepPer100)}</span> on your own store and{" "}
            <span className="tnum font-mono font-medium text-ink">{money2(mkt.keepPer100)}</span> on the marketplace. Moving one repeat buyer a
            week to your store is worth about{" "}
            <span className="tnum font-mono font-medium text-ink">
              {money((((own.keepPer100 - mkt.keepPer100) / 100) * (mkt.gross / Math.max(1, mkt.count))) * 52)}
            </span>{" "}
            a year.
          </div>
        )}

        <Card>
          <CardHeader
            title="All orders"
            sub="Newest first. Synced rows also appear in Books → Income."
            right={
              <Segmented
                label="Filter by channel"
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "All" },
                  ...CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })),
                ]}
              />
            }
            className="flex-col sm:flex-row"
          />
          <div className="mt-3">
            <OrderList orders={shown.slice(safePage * PAGE, safePage * PAGE + PAGE)} today={d.today} highlightId={lastOrderId} showSource />
          </div>
          <Pager page={safePage} size={PAGE} total={shown.length} onPage={setPage} />
          <SyncImpact todayCount={todayCount} />
        </Card>

        <Card className="p-4 sm:p-5">
          <Caps>Connections</Caps>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {CHANNELS.map((c) => (
              <li key={c} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[13px]">
                <ChannelLabel channel={c} />
                <span className="font-mono text-[11px] text-muted">{c === "market" ? "manual" : "demo · live"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Demo connection — no real account is accessed.</p>
        </Card>
      </div>
    </>
  );
}
