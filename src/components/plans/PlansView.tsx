"use client";

import { Check, Coins, Minus } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { formatDay } from "@/lib/date";
import { TIERS, tierInfo, type TierInfo } from "@/lib/tiers";
import { cn, money, num } from "@/lib/format";
import type { Tier } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, CardHeader, Caps, Pill } from "@/components/ui/primitives";
import { Td, Th } from "@/components/ui/table";

type Cell = string | boolean;
interface Row {
  label: string;
  soon?: boolean;
  values: Record<Tier, Cell>;
}

const ROWS: Row[] = [
  { label: "Business Health Score", values: { starter: "Today's score", growth: "With 90-day history", pro: "With 90-day history", scale: "With 90-day history" } },
  { label: "Missions a day", values: { starter: "3", growth: "5", pro: "5", scale: "5" } },
  { label: "Mission rewards", values: { starter: "1×", growth: "1.25×", pro: "1.5×", scale: "2×" } },
  { label: "AI tokens a month", values: { starter: "50", growth: "500", pro: "2,000", scale: "8,000" } },
  { label: "Money Leak Detector", values: { starter: "Largest leak", growth: "Every leak, with steps", pro: "Every leak, with steps", scale: "Every leak, with steps" } },
  { label: "Books: income, expenses, stock, cash", values: { starter: true, growth: true, pro: true, scale: true } },
  { label: "Order sync (demo connections)", values: { starter: true, growth: true, pro: true, scale: true } },
  { label: "Time Machine what-ifs", soon: true, values: { starter: false, growth: "Limited", pro: "Unlimited", scale: "Unlimited" } },
  { label: "Entrepreneur Wrapped", soon: true, values: { starter: false, growth: false, pro: true, scale: true } },
  { label: "Export to your accountant", soon: true, values: { starter: false, growth: false, pro: true, scale: true } },
  { label: "Multi-store", soon: true, values: { starter: false, growth: false, pro: false, scale: true } },
  { label: "Advanced modeling", soon: true, values: { starter: false, growth: false, pro: false, scale: true } },
  { label: "Token packs", soon: true, values: { starter: "Add-on", growth: "Add-on", pro: "Add-on", scale: "Add-on" } },
];

export function PlansView() {
  const d = useDerived();
  const setTier = useStore((s) => s.setTier);
  const leaksFound = d.leaks.reduce((s, l) => s + (l.expense.amount - l.leak.altPrice), 0);

  return (
    <>
      <PageHeader title="Plans" sub="What each plan includes, and how your AI tokens are going this month." />
      <div className="space-y-4">
        <TokenPanel />

        <div className="rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-ink-2 sm:px-5">
          The leaks found in this store are worth <span className="tnum font-mono font-medium text-ink">{money(leaksFound)}/mo</span>, more than{" "}
          {Math.floor(leaksFound / tierInfo("pro").price)} times the Pro plan. Demo only: no payment is taken, and &ldquo;Preview&rdquo; switches the app to that
          plan&apos;s real limits.
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((t) => (
            <TierCard key={t.id} t={t} current={d.tier.id === t.id} onPick={() => setTier(t.id)} />
          ))}
        </div>

        <Card>
          <CardHeader title="Compare plans" sub="Rows marked Soon are on the roadmap and not in this demo yet." />
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-y border-line bg-canvas text-left">
                <tr>
                  <Th>Feature</Th>
                  {TIERS.map((t) => (
                    <Th key={t.id} className={cn(d.tier.id === t.id && "text-ink")}>
                      {t.name}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ROWS.map((r) => (
                  <tr key={r.label} className={cn(r.soon && "text-muted")}>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        {r.label}
                        {r.soon && <Pill tone="neutral">Soon</Pill>}
                      </span>
                    </Td>
                    {TIERS.map((t) => (
                      <Td key={t.id} className={cn(d.tier.id === t.id && "bg-canvas")}>
                        <CellValue v={r.values[t.id]} />
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function CellValue({ v }: { v: Cell }) {
  if (v === true) return <Check className="size-4 text-good" aria-label="Included" />;
  if (v === false) return <Minus className="size-4 text-faint" aria-label="Not included" />;
  return <span className="text-[13px]">{v}</span>;
}

function TierCard({ t, current, onPick }: { t: TierInfo; current: boolean; onPick: () => void }) {
  return (
    <Card className={cn("flex flex-col p-5", current && "border-ink ring-1 ring-ink")}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{t.name}</span>
        {current ? <Pill tone="info">Viewing now</Pill> : t.id === "growth" ? <Pill tone="good">Recommended</Pill> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="tnum text-3xl font-semibold tracking-tight">{t.price === 0 ? "Free" : `$${t.price}`}</span>
        {t.price > 0 && <span className="text-sm text-muted">/mo</span>}
      </div>
      <div className="mt-1 text-[13px] text-muted">{t.id === "growth" ? "Recommended for active sellers" : t.blurb}</div>
      <ul className="mt-4 flex-1 space-y-2 text-[13px] text-ink-2">
        {t.adds.map((a) => (
          <li key={a} className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-good" />
            {a}
          </li>
        ))}
      </ul>
      <div className="tnum mt-4 font-mono text-[11px] text-muted">
        {num(t.tokens)} tokens/mo · {t.missionsPerDay} missions/day · {t.rewardMultiplier}× rewards
      </div>
      <Button variant={current ? "secondary" : t.id === "growth" ? "primary" : "secondary"} className="mt-3 w-full" disabled={current} onClick={onPick}>
        {current ? "Viewing this plan" : `Preview ${t.name}`}
      </Button>
    </Card>
  );
}

function TokenPanel() {
  const d = useDerived();
  const ledger = d.data.tokenLedger;
  const earned = ledger.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = -ledger.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const pool = d.tier.tokens + earned;
  const recent = ledger
    .map((t, i) => ({ ...t, i }))
    .sort((a, b) => (a.day === b.day ? b.i - a.i : a.day < b.day ? 1 : -1))
    .slice(0, 6);

  return (
    <Card>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-warn" />
            <Caps>AI tokens this month</Caps>
          </div>
          <div className="tnum mt-3 text-4xl font-semibold tracking-tight">{num(d.tokens)}</div>
          <div className="mt-1 text-[13px] text-muted">
            left on {d.tier.name} · {num(d.tier.tokens)} included a month
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={d.tokens} aria-valuemin={0} aria-valuemax={pool} aria-label="Tokens left">
            <div className="h-full rounded-full bg-warn-dot" style={{ width: `${Math.max(0, Math.min(1, d.tokens / pool)) * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
            <div>
              <dt className="text-muted">Included</dt>
              <dd className="tnum font-mono">{num(d.tier.tokens)}</dd>
            </div>
            <div>
              <dt className="text-muted">Earned</dt>
              <dd className="tnum font-mono text-good">+{num(earned)}</dd>
            </div>
            <div>
              <dt className="text-muted">Spent</dt>
              <dd className="tnum font-mono">−{num(spent)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[13px] text-ink-2">
            An adviser question costs 5 tokens and a detailed leak costs 3. Missions pay them back, so a daily habit keeps advice free.
          </p>
        </div>
        <div className="border-t border-line lg:border-t-0 lg:border-l">
          <div className="px-5 pt-4 pb-2">
            <Caps>Recent activity</Caps>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="tnum w-14 shrink-0 font-mono text-[11px] text-muted">{formatDay(t.day)}</span>
                <span className="min-w-0 flex-1 truncate text-ink-2">{t.reason}</span>
                <span className={cn("tnum font-mono", t.amount > 0 ? "text-good" : "text-ink")}>
                  {t.amount > 0 ? "+" : "−"}
                  {Math.abs(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
