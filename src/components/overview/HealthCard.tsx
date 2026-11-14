"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { formatDay } from "@/lib/date";
import { scoreBand } from "@/lib/engine";
import { cn } from "@/lib/format";
import { Card, CardHeader, Pill } from "@/components/ui/primitives";
import { ScoreChart } from "@/components/ui/charts";

export function HealthCard() {
  const d = useDerived();
  const openUpgrade = useStore((s) => s.openUpgrade);
  const [picked, setRange] = useState<30 | 90>(30);
  // Starter shows the last 30 days; the 90-day history is a Growth feature.
  const historyLocked = d.tier.id === "starter";
  const range = historyLocked ? 30 : picked;
  const m = d.metrics;
  const band = scoreBand(m.score);
  const series = d.hist.slice(-range);
  const weakest = [...m.factors].sort((a, b) => b.weight - b.points - (a.weight - a.points))[0];

  return (
    <Card>
      <CardHeader
        title="Business Health Score"
        sub="One number from five parts of your business. It moves only when the numbers do."
        right={
          <div className="border-line bg-canvas flex rounded-lg border p-0.5 text-[13px]" role="group" aria-label="Chart range">
            {([30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() =>
                  r === 90 && historyLocked
                    ? openUpgrade({
                        title: "See 90 days of history on Growth",
                        body: "Starter shows the last 30 days. Growth keeps your full score history, so you can see what each change did.",
                      })
                    : setRange(r)
                }
                aria-pressed={range === r}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1",
                  range === r ? "bg-panel font-medium shadow-sm" : "text-muted",
                )}
              >
                {r === 90 && historyLocked && <Lock className="size-3" aria-label="Growth plan" />}
                {r}d
              </button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 px-5 pt-4 md:grid-cols-[180px_1fr]">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="tnum from-brand-a-ink to-brand-b-ink bg-linear-to-r bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
              {m.score.toFixed(1)}
            </span>
            <span className="text-muted text-sm">/100</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone={band.tone}>{band.label}</Pill>
            <Pill tone="info">Target 80</Pill>
          </div>
          <p className="text-muted mt-3 text-[13px] leading-relaxed">
            Biggest gap: <span className="text-ink">{weakest.label.toLowerCase()}</span>, worth{" "}
            {(weakest.weight - weakest.points).toFixed(1)} more points.
          </p>
        </div>
        <ScoreChart values={series.map((x) => x.score)} labels={series.map((x) => formatDay(x.day))} target={80} />
      </div>
      <div className="border-line mt-4 grid grid-cols-1 border-t sm:grid-cols-2 lg:grid-cols-5">
        {m.factors.map((f, i) => (
          <div
            key={f.key}
            className={cn(
              "px-5 py-3.5",
              i > 0 && "border-line border-t sm:border-t-0 lg:border-l",
              i % 2 === 1 && "sm:border-l",
              i >= 2 && "sm:border-t lg:border-t-0",
            )}
            title={f.hint}
          >
            <div className="text-muted truncate text-[13px]">{f.label}</div>
            <div className="tnum mt-0.5 font-mono text-[15px] font-medium">
              {f.points.toFixed(1)}
              <span className="text-faint text-[12px] font-normal"> / {f.weight}</span>
            </div>
            <div className="bg-line mt-2 h-1.5 overflow-hidden rounded-full" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  f.value >= 0.7 ? "bg-good-dot" : f.value >= 0.4 ? "bg-warn-dot" : "bg-bad-dot",
                )}
                style={{ width: `${f.value * 100}%` }}
              />
            </div>
            <div className="tnum text-ink-2 mt-1.5 font-mono text-xs">{f.reading}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
