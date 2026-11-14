"use client";

import { Trash2 } from "lucide-react";
import type { Day } from "@/lib/date";
import { formatDay } from "@/lib/date";
import { orderProfit } from "@/lib/engine";
import { CHANNEL_LABEL } from "@/lib/seed";
import { cn, money2 } from "@/lib/format";
import type { Channel, Order } from "@/lib/types";
import { Pill, dotTone, type Tone } from "@/components/ui/primitives";

export const CHANNEL_TONE: Record<Channel, Tone> = { shopify: "good", amazon: "warn", market: "info" };

export function ChannelLabel({ channel }: { channel: Channel }) {
  return (
    <span className="text-ink-2 inline-flex items-center gap-1.5 text-[13px]">
      <span className={cn("size-1.5 rounded-full", dotTone[CHANNEL_TONE[channel]])} aria-hidden />
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

const when = (o: Order, today: Day) => (o.day === today ? o.time : formatDay(o.day));

/**
 * Orders as a table on desktop and a two-line list on phones.
 * "You keep" is the sale minus fees, shipping and the product's cost.
 */
export function OrderList({
  orders,
  today,
  highlightId,
  showSource = false,
  onDelete,
}: {
  orders: Order[];
  today: Day;
  highlightId?: string | null;
  showSource?: boolean;
  onDelete?: (o: Order) => void;
}) {
  const cols = showSource
    ? "md:grid-cols-[72px_minmax(0,1fr)_104px_84px_84px_90px_96px]"
    : "md:grid-cols-[64px_minmax(0,1fr)_104px_84px_84px_90px]";

  return (
    <>
      <div
        className={cn(
          "border-line bg-canvas text-muted hidden gap-3 border-y px-5 py-2 text-[11px] font-medium tracking-[0.08em] uppercase md:grid",
          cols,
        )}
      >
        <span>{showSource ? "Date" : "Time"}</span>
        <span>Order</span>
        <span>Channel</span>
        <span className="text-right">Sale</span>
        <span className="text-right">Fees</span>
        <span className="text-right">You keep</span>
        {showSource && <span className="text-right">Source</span>}
      </div>
      <ul className="divide-line border-line divide-y border-t md:border-t-0" aria-live="polite">
        {orders.map((o) => {
          const fees = o.platformFee + o.paymentFee + o.shipping;
          return (
            <li
              key={o.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-5 py-3 text-sm md:items-center",
                cols,
                o.id === highlightId && "animate-row-in",
              )}
            >
              <span className="tnum text-muted hidden font-mono text-[12px] md:block">{when(o, today)}</span>
              <div className="min-w-0">
                <div className="truncate">
                  {o.item} <span className="text-muted">×{o.qty}</span>
                </div>
                <div className="text-muted truncate font-mono text-xs">
                  {o.ref}
                  <span className="md:hidden">
                    {" "}
                    · {when(o, today)} · {CHANNEL_LABEL[o.channel]}
                    {showSource && ` · ${o.source}`}
                  </span>
                </div>
              </div>
              <span className="hidden md:block">
                <ChannelLabel channel={o.channel} />
              </span>
              <span className="tnum hidden text-right font-mono md:block">{money2(o.gross)}</span>
              <span className="tnum text-muted hidden text-right font-mono md:block">−{money2(fees)}</span>
              <span className="tnum text-right font-mono font-medium">
                <span className="text-muted mr-2 font-normal md:hidden">{money2(o.gross)} →</span>
                {money2(orderProfit(o))}
              </span>
              {showSource && (
                <span className="hidden items-center justify-end gap-1 md:flex">
                  <Pill tone={o.source === "synced" ? "info" : "neutral"}>{o.source}</Pill>
                  {onDelete && o.source === "manual" && o.live && (
                    <button
                      className="text-faint hover:bg-hover hover:text-bad grid size-7 place-items-center rounded-md"
                      onClick={() => onDelete(o)}
                      aria-label={`Remove sale ${o.ref}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </span>
              )}
            </li>
          );
        })}
        {orders.length === 0 && <li className="text-muted px-5 py-8 text-center text-sm">No orders match this filter.</li>}
      </ul>
    </>
  );
}
