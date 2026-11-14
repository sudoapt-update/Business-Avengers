"use client";

import { AlertTriangle } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { money } from "@/lib/format";
import { scoreBand } from "@/lib/engine";
import { Button, Caps, Delta, Pill } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/charts";

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
    <div className="rounded-card border-line bg-panel flex flex-col gap-3 border px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
      <span className="bg-warn-bg text-warn grid size-8 shrink-0 place-items-center rounded-lg" aria-hidden>
        <AlertTriangle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{msg.title}</div>
        <div className="text-muted text-[13px]">{msg.body}</div>
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
  unit,
  delta,
  caption,
  spark,
  tone = "good",
}: {
  label: string;
  value: string;
  unit?: string;
  delta: React.ReactNode;
  caption: string;
  spark?: number[];
  tone?: "good" | "warn" | "bad" | "ink";
}) {
  return (
    <div className="rounded-card border-line bg-panel border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <Caps>{label}</Caps>
        {spark && <Sparkline values={spark} tone={tone} className="-mt-1 h-7 w-20" />}
      </div>
      <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
        {value}
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
        value={m.score.toFixed(1)}
        unit="/100"
        delta={<Delta value={m.score - p.score} />}
        caption={`${band.label} · vs 30 days ago`}
        spark={last30.map((x) => x.score)}
      />
      <Kpi
        label="True profit · 30 days"
        value={money(m.trueProfit)}
        delta={<Delta value={profitChange * 100} suffix="%" />}
        caption={`${(m.margin * 100).toFixed(1)}% of ${money(m.revenue)} sales`}
        spark={last30.map((x) => x.trueProfit)}
      />
      <Kpi
        label="Cash runway"
        value={m.runwayWeeks.toFixed(1)}
        unit="weeks"
        delta={<Delta value={m.runwayWeeks - p.runwayWeeks} suffix=" wk" />}
        caption={`${money(m.cash)} in cash`}
        spark={last30.map((x) => x.runwayWeeks)}
        tone="warn"
      />
      <Kpi
        label="Money leaking"
        value={money(m.leakMonthly)}
        unit="/mo"
        delta={<Pill tone={m.leakCount ? "bad" : "good"}>{m.leakCount ? `${m.leakCount} leaks` : "None"}</Pill>}
        caption={m.leakCount ? `largest ${money(m.largestLeak)}/mo` : "all fixed"}
        spark={last30.map((x) => x.leakMonthly)}
        tone="bad"
      />
    </div>
  );
}
