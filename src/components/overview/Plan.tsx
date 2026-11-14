"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useDerived } from "@/store/derived";
import { diffDays } from "@/lib/date";
import { cn, money } from "@/lib/format";
import { Card, CardHeader, Caps, Pill } from "@/components/ui/primitives";

export const PHASES = [
  { name: "Stop the leaks", days: [1, 30] as const, goal: "Cancel tools you don't use and keep books current every week.", milestone: 66 },
  { name: "Fix your margins", days: [31, 60] as const, goal: "Move repeat buyers to your own store, where fees are lower.", milestone: 73 },
  { name: "Build a cash cushion", days: [61, 90] as const, goal: "Reach 12 weeks of runway before the holiday restock.", milestone: 80 },
];

export function PlanStrip() {
  const d = useDerived();
  const day = Math.min(90, diffDays(d.today, d.data.planStart) + 1);
  const phase = PHASES.findIndex((p) => day <= p.days[1]);
  const cur = PHASES[phase];
  const gap = cur.milestone - d.metrics.score;

  return (
    <Card>
      <CardHeader
        title="Your 90-day plan"
        sub={`Day ${day} of 90 · from ${d.hist[d.hist.length - day]?.score.toFixed(0) ?? "62"} to a score of 80`}
        right={
          <Link href="/app/missions#plan" className="text-muted hover:text-ink shrink-0 text-[13px]">
            Full plan
          </Link>
        }
      />
      <div className="px-5 pt-5 pb-5">
        <div className="relative">
          <div className="grid grid-cols-3 gap-1.5">
            {PHASES.map((p, i) => {
              const fill = i < phase ? 1 : i === phase ? (day - p.days[0] + 1) / 30 : 0;
              return (
                <div key={p.name} className="bg-line h-2 overflow-hidden rounded-full">
                  <div className="from-brand-a to-brand-b h-full rounded-full bg-linear-to-r" style={{ width: `${fill * 100}%` }} />
                </div>
              );
            })}
          </div>
          <span
            className="bg-ink absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${(day / 90) * 100}%` }}
            aria-hidden
          />
        </div>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {PHASES.map((p, i) => (
            <li key={p.name}>
              <div className="flex items-center gap-2">
                <span className="tnum text-muted font-mono text-xs">
                  Days {p.days[0]}–{p.days[1]}
                </span>
                {i === phase && <Pill tone="info">Now</Pill>}
                {i < phase && <Pill tone="good">Done</Pill>}
                {i > phase && <Pill tone="neutral">Later</Pill>}
              </div>
              <div className={cn("mt-1 text-sm font-medium", i > phase && "text-ink-2")}>{p.name}</div>
              <div className="text-muted mt-0.5 text-[13px]">{p.goal}</div>
              <div className={cn("tnum mt-1.5 font-mono text-xs", i > phase ? "text-muted" : "text-ink-2")}>
                Milestone: score {p.milestone}
              </div>
            </li>
          ))}
        </ol>
        <div className="bg-canvas text-ink-2 mt-4 rounded-lg px-3 py-2 text-[13px]">
          Next milestone:{" "}
          <span className="text-ink font-medium">
            score {cur.milestone} by day {cur.days[1]}
          </span>
          . {gap > 0 ? `You're ${gap.toFixed(1)} points away; fixing the largest leak covers most of it.` : "You're already there."}
        </div>
      </div>
    </Card>
  );
}

export function AdviserPrompt() {
  const d = useDerived();
  const m = d.metrics;
  const qs = [
    "Can I afford a part-time packer?",
    `Why is my margin ${(m.margin * 100).toFixed(0)}% and not 25%?`,
    "Should I sell more on my own store or the marketplace?",
  ];
  return (
    <Card>
      <CardHeader
        title="Ask the AI Adviser"
        sub={`Answers use your numbers, like ${money(m.trueProfit)} profit and ${m.runwayWeeks.toFixed(1)} weeks of cash.`}
      />
      <ul className="space-y-1.5 p-4 pt-3">
        {qs.map((q) => (
          <li key={q}>
            <Link
              href={`/app/adviser?q=${encodeURIComponent(q)}`}
              className="border-line hover:bg-hover flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm"
            >
              <MessageSquare className="text-muted size-3.5 shrink-0" />
              <span className="flex-1">{q}</span>
              <span className="tnum text-muted font-mono text-xs">5 tokens</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-line flex items-center justify-between border-t px-5 py-3">
        <Caps>Balance</Caps>
        <span className="tnum font-mono text-[13px]">{d.tokens} tokens</span>
      </div>
    </Card>
  );
}
