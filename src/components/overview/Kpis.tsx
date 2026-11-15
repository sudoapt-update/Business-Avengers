"use client";

import { AlertTriangle, Droplets, HeartPulse, Hourglass, Wallet } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { money } from "@/lib/format";
import { scoreBand } from "@/lib/engine";
import { Button, Caps, Delta, IconTile, Pill, type TileTone } from "@/components/ui/primitives";
import { AnimatedNumber, Sparkline } from "@/components/ui/charts";

export function AlertBanner() {
  const d = useDerived();
  const openSheet = useStore((s) => s.openSheet);
  const m = d.metrics;
  const largest = d.leaks.find((l) => l.saving > 0);

  const msg = largest
    ? {
        title: `You're losing ${money(m.leakMonthly)}/mo to ${m.leakCount} leak${m.leakCount === 1 ? "" : "s"}. The largest is ${money(m.largestLeak)}/mo.`,
        body: `That's ${money(m.leakMonthly * 12)} a year, or ${((m.leakMonthly / Math.max(1, m.trueProfit)) * 100).toFixed(0)}% of what you kept last month.`,
        cta: "See leaks",
        go: () => openSheet({ kind: "leak", leakId: largest.leak.id }),
      }
    : {
        title: `Your cash covers ${m.runwayWeeks.toFixed(1)} weeks of fixed costs.`,
        body: "Every leak is fixed. The next lift comes from building a 12-week cash cushion.",
        cta: "Check runway",
        go: () => openSheet({ kind: "runway" }),
      };

  return (
    <div className="rounded-card border-warn-dot/40 bg-warn-bg flex flex-col gap-3 border px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
      <span className="bg-panel text-warn grid size-8 shrink-0 place-items-center rounded-lg" aria-hidden>
        <AlertTriangle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{msg.title}</div>
        <div className="text-ink-2 text-[13px]">{msg.body}</div>
      </div>
      <Button onClick={msg.go} className="self-start sm:self-auto">
        {msg.cta}
      </Button>
    </div>
  );
}

function Kpi({
  label,
  value,
  format,
  unit,
  delta,
  caption,
  spark,
  tone = "good",
  icon,
  tile,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: React.ReactNode;
  tile: TileTone;
  unit?: string;
  delta: React.ReactNode;
  caption: string;
  spark?: number[];
  tone?: "good" | "warn" | "bad" | "ink";
}) {
  return (
    <div className="rounded-card border-line bg-panel border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconTile tone={tile} size="sm">
            {icon}
          </IconTile>
          <Caps className="truncate">{label}</Caps>
        </div>
        {spark && <Sparkline values={spark} tone={tone} className="h-7 w-16 shrink-0" />}
      </div>
      <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
        <AnimatedNumber value={value} format={format} />
        {unit && <span className="text-muted ml-1 text-base font-medium">{unit}</span>}
      </div>
      <div className="text-muted mt-3 flex flex-wrap items-center gap-2 text-[13px]">
        {delta}
        <span>{caption}</span>
      </div>
    </div>
  );
}

export function KpiRow() {
  const d = useDerived();
  const m = d.metrics;
  const p = d.prev;
  const last30 = d.hist.slice(-30);
  const band = scoreBand(m.score);
  const profitChange = p.trueProfit ? (m.trueProfit - p.trueProfit) / Math.abs(p.trueProfit) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Health score"
        icon={<HeartPulse />}
        tile="info"
        value={m.score}
        format={(n) => n.toFixed(1)}
        unit="/100"
        delta={<Delta value={m.score - p.score} />}
        caption={`${band.label} · vs 30 days ago`}
        spark={last30.map((x) => x.score)}
      />
      <Kpi
        label="True profit · 30d"
        icon={<Wallet />}
        tile="good"
        value={m.trueProfit}
        format={money}
        delta={<Delta value={profitChange * 100} suffix="%" />}
        caption={`${(m.margin * 100).toFixed(1)}% of ${money(m.revenue)} sales`}
        spark={last30.map((x) => x.trueProfit)}
      />
      <Kpi
        label="Cash runway"
        icon={<Hourglass />}
        tile="warn"
        value={m.runwayWeeks}
        format={(n) => n.toFixed(1)}
        unit="weeks"
        delta={<Delta value={m.runwayWeeks - p.runwayWeeks} suffix=" wk" />}
        caption={`${money(m.cash)} in cash`}
        spark={last30.map((x) => x.runwayWeeks)}
        tone="warn"
      />
      <Kpi
        label="Money leaking"
        icon={<Droplets />}
        tile="bad"
        value={m.leakMonthly}
        format={money}
        unit="/mo"
        delta={<Pill tone={m.leakCount ? "bad" : "good"}>{m.leakCount ? `${m.leakCount} leaks` : "None"}</Pill>}
        caption={m.leakCount ? `largest ${money(m.largestLeak)}/mo` : "all fixed"}
        spark={last30.map((x) => x.leakMonthly)}
        tone="bad"
      />
    </div>
  );
}
