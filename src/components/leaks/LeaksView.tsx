"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, Check, ChevronDown, Droplets, ListChecks, Lock, PiggyBank, Scale } from "lucide-react";
import { leakUnlocked, useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import type { LeakView } from "@/lib/engine";
import { formatDay } from "@/lib/date";
import { TIERS, tierInfo } from "@/lib/tiers";
import { cn, money } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, Caps, IconTile, Pill } from "@/components/ui/primitives";
import { leakIcon } from "@/components/ui/icons";

export function LeaksView() {
  const d = useDerived();
  const markReviewed = useStore((s) => s.markReviewed);
  const open = d.leaks.filter((l) => !l.applied);
  const fixed = d.leaks.filter((l) => l.applied);
  const savedMonthly = fixed.reduce((s, l) => s + (l.expense.amount - l.leak.altPrice), 0);
  const pro = tierInfo("pro");
  const reviewMission = d.missions.find((m) => m.id === "review-leaks" && !m.done);

  // Opening this page is the "read your largest leak" mission when it's on today's list.
  useEffect(() => {
    if (!reviewMission) return;
    const t = setTimeout(() => markReviewed("review-leaks"), 800);
    return () => clearTimeout(t);
  }, [reviewMission, markReviewed]);

  return (
    <>
      <PageHeader title="Leaks" sub="Money going out every month that a cheaper option would keep in the business." />
      <div className="space-y-4">
        <Explainer>
          A leak is a cost you could cut without selling less: a tool on a bigger tier than you use, two apps doing one job, a seat nobody
          opens. We read your monthly expenses in Books and compare each one with a cheaper way to get the same result. Tool categories and
          prices here are <span className="text-ink font-medium">illustrative examples</span>, not quotes from real brands.
        </Explainer>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-bad-dot/30 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="bad" size="sm">
                <Droplets />
              </IconTile>
              <Caps>Leaking now</Caps>
            </div>
            <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
              {money(d.metrics.leakMonthly)}
              <span className="text-muted ml-1 text-base font-medium">/mo</span>
            </div>
            <div className="text-muted mt-2 text-[13px]">
              {open.length} leak{open.length === 1 ? "" : "s"} · {money(d.metrics.leakMonthly * 12)} a year
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="good" size="sm">
                <PiggyBank />
              </IconTile>
              <Caps>Already saved</Caps>
            </div>
            <div className="tnum text-good mt-3 text-[28px] leading-none font-semibold tracking-tight">
              {money(savedMonthly)}
              <span className="text-muted ml-1 text-base font-medium">/mo</span>
            </div>
            <div className="text-muted mt-2 text-[13px]">{fixed.length} fixed · counted in your expenses</div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="info" size="sm">
                <Scale />
              </IconTile>
              <Caps>Against the price of FinPath</Caps>
            </div>
            <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
              {(d.metrics.leakMonthly + savedMonthly) / pro.price >= 1
                ? `${((d.metrics.leakMonthly + savedMonthly) / pro.price).toFixed(1)}×`
                : "—"}
            </div>
            <div className="text-muted mt-2 text-[13px]">Leaks found are worth this many Pro plans (${pro.price}/mo).</div>
          </Card>
        </div>

        <section aria-label="Open leaks" className="grid items-start gap-5 xl:grid-cols-2">
          {open.map((l, i) => (
            <LeakCard key={l.leak.id} view={l} rank={i + 1} total={open.length} />
          ))}
          {open.length === 0 && (
            <Card className="text-ink-2 p-6 text-sm xl:col-span-2">
              Every leak we found is fixed. We check again whenever an expense in Books changes.
            </Card>
          )}
        </section>

        {fixed.length > 0 && (
          <section aria-label="Fixed leaks">
            <Caps className="mb-2 px-1">Fixed</Caps>
            <Card>
              <ul className="divide-line divide-y">
                {fixed.map((l) => (
                  <li key={l.leak.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <span className="bg-good-dot grid size-5 place-items-center rounded-full text-white" aria-hidden>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">{l.leak.title}</span>
                    <span className="text-muted font-mono text-[12px]">applied {formatDay(l.leak.appliedOn!)}</span>
                    <Pill tone="good" className="tnum font-mono">
                      saving {money(l.expense.amount - l.leak.altPrice)}/mo
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <p className="text-muted px-1 text-[13px]">
          Leaks are read from the monthly rows in{" "}
          <Link href="/app/books" className="hover:text-ink underline underline-offset-2">
            Books → Expenses
          </Link>
          . Change an amount there and this page updates.
        </p>
      </div>
    </>
  );
}

const HEAD_TONE = {
  info: "bg-info-bg border-info-dot/25",
  violet: "bg-violet-bg border-violet/15",
  warn: "bg-warn-bg border-warn-dot/30",
  good: "bg-good-bg border-good-dot/25",
  bad: "bg-bad-bg border-bad-dot/25",
  neutral: "bg-hover border-line",
  ink: "bg-hover border-line",
} as const;

function LeakCard({ view, rank, total }: { view: LeakView; rank: number; total: number }) {
  const d = useDerived();
  const tier = useStore((s) => s.tier);
  const { unlockLeak, applyLeak, openUpgrade } = useStore.getState();
  const { leak, expense, saving } = view;
  const unlocked = leakUnlocked(tier, leak);
  const needs = TIERS.find((t) => t.id === leak.minTier)!;
  const kind = leakIcon(expense.id);
  const KindIcon = kind.icon;
  const altShare = expense.amount > 0 ? Math.max(0.04, leak.altPrice / expense.amount) : 0;
  // The largest leak opens with its steps showing; the rest stay compact until asked.
  const [stepsOpen, setStepsOpen] = useState(rank === 1);

  return (
    <Card as="article" className="overflow-hidden shadow-[0_1px_2px_rgb(10_10_11/0.04)] transition-shadow hover:shadow-md">
      <header className={cn("flex items-center gap-3 border-b px-5 py-3", HEAD_TONE[kind.tone])}>
        <span className={cn("bg-panel grid size-9 shrink-0 place-items-center rounded-[10px] shadow-sm", IconColor[kind.tone])} aria-hidden>
          <KindIcon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">{kind.kind}</div>
          <div className="text-ink-2 text-xs">
            {unlocked ? (leak.unlockedWithTokens && tier === "starter" ? "Unlocked with tokens" : "Ready to fix") : "Cheaper option hidden"}
          </div>
        </div>
        {!unlocked && (
          <span className="bg-ink inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white">
            <Lock className="size-3" aria-hidden /> {needs.name}
          </span>
        )}
        <span className="tnum text-ink-2 bg-panel/80 rounded-md px-2 py-1 font-mono text-xs">
          Leak {rank} of {total}
        </span>
      </header>

      <div className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{leak.title}</h2>
          <p className="text-ink-2 mt-1 text-sm">{leak.problem}</p>
        </div>
        <div className="bg-good-bg shrink-0 rounded-lg px-3 py-2 text-right">
          <Caps>You save</Caps>
          <div className="tnum text-good font-mono text-xl font-semibold">{money(saving)}/mo</div>
          <div className="tnum text-ink-2 font-mono text-[12px]">{money(saving * 12)} a year</div>
        </div>
      </div>

      <div className="bg-canvas border-line mx-5 mb-5 space-y-3 rounded-lg border p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
          <div className="min-w-0">
            <Caps>You pay now</Caps>
            <div className="text-ink-2 text-[13px]">{expense.name}</div>
          </div>
          <div className="tnum font-mono text-base font-semibold">{money(expense.amount)}/mo</div>
          <div className="bg-line col-span-2 h-2 overflow-hidden rounded-full" aria-hidden>
            <div className="bg-bad-dot h-full w-full rounded-full" />
          </div>
        </div>
        <div className="text-muted flex items-center gap-1.5 text-xs">
          <ArrowDown className="size-3.5" aria-hidden /> switch to
        </div>
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
          <div
            className={cn("contents", !unlocked && "[&>*]:pointer-events-none [&>*]:blur-[5px] [&>*]:select-none")}
            aria-hidden={!unlocked}
          >
            <div className="min-w-0">
              <Caps>Cheaper option</Caps>
              <div className="text-ink-2 text-[13px]">{unlocked ? leak.alternative : "A smaller plan that covers what you use"}</div>
            </div>
            <div className="tnum text-good font-mono text-base font-semibold">{unlocked ? money(leak.altPrice) : "$00"}/mo</div>
            <div className="bg-line col-span-2 h-2 overflow-hidden rounded-full">
              <div
                className="bg-good-dot h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(unlocked ? altShare : 0.35) * 100}%` }}
              />
            </div>
          </div>
          {!unlocked && <span className="sr-only">Hidden until unlocked.</span>}
        </div>
      </div>

      {unlocked ? (
        <div className="border-line border-t">
          <button
            type="button"
            onClick={() => setStepsOpen((o) => !o)}
            aria-expanded={stepsOpen}
            className="hover:bg-canvas flex w-full items-center gap-2 px-5 py-3 text-left text-[13px] font-medium"
          >
            <ListChecks className="text-muted size-4" aria-hidden />
            <span className="flex-1">{stepsOpen ? "How to fix it" : `Show the ${leak.steps.length} steps to fix it`}</span>
            <ChevronDown className={cn("text-muted size-4 transition-transform", stepsOpen && "rotate-180")} aria-hidden />
          </button>
          {stepsOpen && (
            <div className="animate-fade-in px-5 pb-5">
              <ol className="space-y-2">
                {leak.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm">
                    <span className="tnum bg-info-bg text-info grid size-5 shrink-0 place-items-center rounded-full font-mono text-xs font-medium">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => applyLeak(leak.id)}>
                I&apos;ve made this change · update my books
              </Button>
              <p className="text-muted mt-2 text-[12px]">
                Lowers {expense.name.toLowerCase()} to {money(leak.altPrice)} in Expenses and lifts your score.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-line bg-canvas border-t px-5 py-4">
          <p className="text-ink-2 text-[13px]">
            The cheaper option and the steps are on <span className="text-ink font-medium">{needs.name}</span>. Or unlock just this one.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => unlockLeak(leak.id)}>
              Unlock · {leak.unlockCost} tokens
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                openUpgrade({
                  title: `See every leak on ${needs.name}`,
                  body: `${needs.name} shows all ${d.leaks.filter((l) => !l.applied).length} leaks with step-by-step fixes, worth ${money(d.metrics.leakMonthly)}/mo for this store.`,
                })
              }
            >
              See {needs.name}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

const IconColor = {
  info: "text-info",
  violet: "text-violet",
  warn: "text-warn",
  good: "text-good",
  bad: "text-bad",
  neutral: "text-ink-2",
  ink: "text-ink",
} as const;
