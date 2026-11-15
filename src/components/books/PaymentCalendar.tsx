"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Download, ExternalLink, Scale, UserRound } from "lucide-react";
import { useDerived } from "@/store/derived";
import { addDays, formatDay, fromDay } from "@/lib/date";
import { eventLabel, googleCalendarLink, paymentEvents, toICS, weekStart, type PayEvent } from "@/lib/calendar";
import { cn, money, signedMoney } from "@/lib/format";
import type { Channel, ExpenseCategory } from "@/lib/types";
import { Button, Card, CardHeader, Caps, IconTile } from "@/components/ui/primitives";
import { BrandIcon } from "@/components/ui/brand";
import { CATEGORY_ICON } from "@/components/ui/icons";

const DAYS = 30;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHANNELS: Channel[] = ["shopify", "amazon", "market"];

export function PaymentCalendar() {
  const d = useDerived();
  const events = useMemo(() => paymentEvents(d.data, d.today, DAYS), [d.data, d.today]);
  const end = addDays(d.today, DAYS - 1);

  const payouts = events.filter((e) => e.kind === "payout");
  const bills = events.filter((e) => e.kind === "bill");
  const inTotal = payouts.reduce((s, e) => s + e.amount, 0);
  const outTotal = bills.reduce((s, e) => s - e.amount, 0);
  const net = inTotal - outTotal;

  const download = () => {
    const blob = new Blob([toICS(events)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finpath-payments.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Whole weeks, Monday to Sunday, covering today and the next 29 days.
  const cells: string[] = [];
  for (let day = weekStart(d.today); day <= end || fromDay(day).getDay() !== 1; day = addDays(day, 1)) cells.push(day);
  const byDay = new Map<string, PayEvent[]>();
  for (const e of events) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  const next14 = events.filter((e) => e.day <= addDays(d.today, 13));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          icon={
            <IconTile tone="warn">
              <CalendarDays />
            </IconTile>
          }
          title="Payment calendar"
          sub={`Payouts coming in and bills going out, ${formatDay(d.today)} to ${formatDay(end)}.`}
          right={
            <Button variant="primary" size="sm" onClick={download} className="shrink-0">
              <Download className="size-3.5" /> Export .ics (Apple / Outlook)
            </Button>
          }
        />
        <dl className="border-line mx-5 mt-4 grid grid-cols-3 divide-x divide-[var(--color-line)] rounded-lg border">
          <Summary
            icon={<ArrowDownLeft />}
            tone="good"
            label="Upcoming payouts"
            value={`+${money(inTotal)}`}
            sub={`${payouts.length} payouts`}
          />
          <Summary
            icon={<ArrowUpRight />}
            tone="bad"
            label="Upcoming bills"
            value={`−${money(outTotal)}`}
            sub={`${bills.length} payments`}
          />
          <Summary
            icon={<Scale />}
            tone={net >= 0 ? "good" : "bad"}
            label="Net cash impact"
            value={signedMoney(net)}
            sub="payouts minus bills"
            strong
          />
        </dl>

        <div className="px-5 pt-5 pb-5">
          <div className="text-muted grid grid-cols-7 gap-1.5 pb-2 text-xs font-medium" aria-hidden>
            {WEEKDAYS.map((w) => (
              <span key={w} className="px-2">
                {w}
              </span>
            ))}
          </div>
          <ol className="grid grid-cols-7 gap-1.5" aria-label="Next 30 days">
            {cells.map((day) => {
              const inRange = day >= d.today && day <= end;
              const list = inRange ? (byDay.get(day) ?? []) : [];
              const date = fromDay(day);
              const isToday = day === d.today;
              const showMonth = date.getDate() === 1 || day === cells[0];
              return (
                <li
                  key={day}
                  className={cn(
                    "min-h-24 rounded-lg border p-1.5",
                    inRange ? "border-line bg-panel" : "bg-canvas border-transparent",
                    isToday && "border-ink ring-ink ring-1",
                  )}
                  aria-label={
                    inRange
                      ? `${formatDay(day, { weekday: "long", month: "long", day: "numeric" })}: ${list.length ? list.map(eventLabel).join(", ") : "nothing due"}`
                      : undefined
                  }
                  aria-hidden={inRange ? undefined : true}
                >
                  <div className={cn("flex items-baseline justify-between px-0.5 text-xs", inRange ? "text-ink-2" : "text-faint")}>
                    <span className={cn("tnum font-mono", isToday && "text-ink font-semibold")}>
                      {showMonth ? formatDay(day, { month: "short", day: "numeric" }) : date.getDate()}
                    </span>
                    {isToday && <span className="text-ink text-[10px] font-medium">Today</span>}
                  </div>
                  <ul className="mt-1 space-y-1">
                    {list.slice(0, 3).map((e) => (
                      <li
                        key={e.id}
                        title={`${eventLabel(e)}${e.estimate ? " (estimate)" : ""}`}
                        className={cn(
                          "tnum truncate rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-4 font-medium",
                          e.kind === "payout" ? "bg-good-bg text-good" : "bg-bad-bg text-bad",
                        )}
                      >
                        {e.amount > 0 ? "+" : "−"}
                        {money(Math.abs(e.amount))}
                        <span className="text-ink-2 ml-1 font-sans font-normal">{shortName(e)}</span>
                      </li>
                    ))}
                    {list.length > 3 && <li className="text-muted px-1.5 text-[11px]">+{list.length - 3} more</li>}
                  </ul>
                </li>
              );
            })}
          </ol>
          <div className="text-muted mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-good-bg border-good-dot/40 size-2.5 rounded-[3px] border" aria-hidden /> Money in
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-bad-bg border-bad-dot/40 size-2.5 rounded-[3px] border" aria-hidden /> Money out
            </span>
            <span>Payouts after the first are estimates from your last 30 days of sales. Bill dates are sample dates.</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={
            <IconTile tone="info">
              <CalendarDays />
            </IconTile>
          }
          title="Next 14 days"
          sub="In date order. Add any payment to Google Calendar, or export them all above."
        />
        <ul className="divide-line border-line mt-3 divide-y border-t">
          {next14.map((e) => (
            <li key={e.id} className="grid grid-cols-[4.5rem_auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-3">
              <div className="leading-tight">
                <div className="text-muted text-xs">{formatDay(e.day, { weekday: "short" })}</div>
                <div className="tnum text-sm font-medium">{formatDay(e.day)}</div>
              </div>
              <SourceIcon e={e} />
              <div className="min-w-0">
                <div className="text-sm">{e.title}</div>
                <div className="text-muted text-xs">
                  {e.kind === "payout" ? "Payout" : "Bill"}
                  {e.estimate ? ", estimated" : ""}
                </div>
              </div>
              <span className={cn("tnum text-right font-mono text-sm font-semibold", e.amount > 0 ? "text-good" : "text-bad")}>
                {e.amount > 0 ? "+" : "−"}
                {money(Math.abs(e.amount))}
              </span>
              <a
                href={googleCalendarLink(e)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 hover:bg-hover hover:text-ink inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium whitespace-nowrap"
                aria-label={`Add ${eventLabel(e)} on ${formatDay(e.day)} to Google Calendar (opens in a new tab)`}
              >
                <BrandIcon id="googlecalendar" size="xs" className="border-0" /> Add to Google Calendar
                <ExternalLink className="text-muted size-3" aria-hidden />
              </a>
            </li>
          ))}
          {next14.length === 0 && <li className="text-muted px-5 py-6 text-sm">Nothing due in the next 14 days.</li>}
        </ul>
      </Card>
    </div>
  );
}

function Summary({
  icon,
  tone,
  label,
  value,
  sub,
  strong = false,
}: {
  icon: React.ReactNode;
  tone: "good" | "bad";
  label: string;
  value: string;
  sub: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <div className="min-w-0">
        <dt>
          <Caps>{label}</Caps>
        </dt>
        <dd className={cn("tnum mt-0.5 text-xl font-semibold tracking-tight", strong && (tone === "good" ? "text-good" : "text-bad"))}>
          {value}
        </dd>
        <dd className="text-muted text-xs">{sub}</dd>
      </div>
    </div>
  );
}

/** A short name for a calendar pill, where space is tight. */
function shortName(e: PayEvent) {
  if (e.kind === "payout") return e.source === "amazon" ? "Amazon" : "Shopify";
  if (e.source === "owner") return "Your pay";
  return e.title.split(/[ ,]/)[0];
}

function SourceIcon({ e }: { e: PayEvent }) {
  if (CHANNELS.includes(e.source as Channel)) return <BrandIcon id={e.source as Channel} size="sm" />;
  if (e.source === "owner")
    return (
      <IconTile tone="neutral" size="sm">
        <UserRound />
      </IconTile>
    );
  const Icon = CATEGORY_ICON[e.source as ExpenseCategory];
  return (
    <IconTile tone="bad" size="sm">
      <Icon />
    </IconTile>
  );
}
