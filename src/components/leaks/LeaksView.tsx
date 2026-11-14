"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { leakUnlocked, useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import type { LeakView } from "@/lib/engine";
import { formatDay } from "@/lib/date";
import { TIERS, tierInfo } from "@/lib/tiers";
import { cn, money } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, Caps, Pill } from "@/components/ui/primitives";

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
          opens. We read your monthly expenses in Books and compare each one with a cheaper way to get the same result. Tool categories
          and prices here are <span className="font-medium text-ink">illustrative examples</span>, not quotes from real brands.
        </Explainer>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4 sm:p-5">
            <Caps>Leaking now</Caps>
            <div className="tnum mt-2 text-[28px] leading-none font-semibold tracking-tight">
              {money(d.metrics.leakMonthly)}
              <span className="ml-1 text-base font-medium text-muted">/mo</span>
            </div>
            <div className="mt-2 text-[13px] text-muted">
              {open.length} leak{open.length === 1 ? "" : "s"} · {money(d.metrics.leakMonthly * 12)} a year
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <Caps>Already saved</Caps>
            <div className="tnum mt-2 text-[28px] leading-none font-semibold tracking-tight text-good">
              {money(savedMonthly)}
              <span className="ml-1 text-base font-medium text-muted">/mo</span>
            </div>
            <div className="mt-2 text-[13px] text-muted">
              {fixed.length} fixed · counted in your expenses
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <Caps>Against the price of FinPath</Caps>
            <div className="tnum mt-2 text-[28px] leading-none font-semibold tracking-tight">
              {(d.metrics.leakMonthly + savedMonthly) / pro.price >= 1 ? `${((d.metrics.leakMonthly + savedMonthly) / pro.price).toFixed(1)}×` : "—"}
            </div>
            <div className="mt-2 text-[13px] text-muted">
              Leaks found are worth this many Pro plans (${pro.price}/mo).
            </div>
          </Card>
        </div>

        <section aria-label="Open leaks" className="space-y-3">
          {open.map((l, i) => (
            <LeakCard key={l.leak.id} view={l} rank={i + 1} />
          ))}
          {open.length === 0 && (
            <Card className="p-6 text-sm text-ink-2">
              Every leak we found is fixed. We check again whenever an expense in Books changes.
            </Card>
          )}
        </section>

        {fixed.length > 0 && (
          <section aria-label="Fixed leaks">
            <Caps className="mb-2 px-1">Fixed</Caps>
            <Card>
              <ul className="divide-y divide-line">
                {fixed.map((l) => (
                  <li key={l.leak.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <span className="grid size-5 place-items-center rounded-full bg-good-dot text-white" aria-hidden>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">{l.leak.title}</span>
                    <span className="font-mono text-[12px] text-muted">applied {formatDay(l.leak.appliedOn!)}</span>
                    <Pill tone="good" className="tnum font-mono">
                      saving {money(l.expense.amount - l.leak.altPrice)}/mo
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <p className="px-1 text-[13px] text-muted">
          Leaks are read from the monthly rows in{" "}
          <Link href="/app/books" className="underline underline-offset-2 hover:text-ink">
            Books → Expenses
          </Link>
          . Change an amount there and this page updates.
        </p>
      </div>
    </>
  );
}

function LeakCard({ view, rank }: { view: LeakView; rank: number }) {
  const d = useDerived();
  const tier = useStore((s) => s.tier);
  const { unlockLeak, applyLeak, openUpgrade } = useStore.getState();
  const { leak, expense, saving } = view;
  const unlocked = leakUnlocked(tier, leak);
  const needs = TIERS.find((t) => t.id === leak.minTier)!;

  return (
    <Card as="article" className={cn("overflow-hidden", !unlocked && "border-dashed border-line-strong")}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tnum font-mono text-[11px] text-muted">#{rank}</span>
            <Pill tone="bad">Leak</Pill>
            {!unlocked && (
              <Pill tone="neutral">
                <Lock className="size-3" /> {needs.name}
              </Pill>
            )}
            {leak.unlockedWithTokens && tier === "starter" && <Pill tone="info">Unlocked with tokens</Pill>}
          </div>
          <h2 className="mt-2 text-[15px] font-semibold tracking-tight">{leak.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{leak.problem}</p>
        </div>
        <div className="shrink-0 lg:text-right">
          <div className="tnum font-mono text-2xl font-semibold text-good">−{money(saving)}/mo</div>
          <div className="tnum font-mono text-[12px] text-muted">{money(saving * 12)} a year</div>
        </div>
      </div>

      <div className="grid border-t border-line md:grid-cols-[1fr_1fr]">
        <div className="border-line px-5 py-4 md:border-r">
          <Caps>You pay now</Caps>
          <div className="mt-1.5 text-[13px] text-ink-2">{expense.name}</div>
          <div className="tnum mt-0.5 font-mono text-lg font-semibold">{money(expense.amount)}/mo</div>
        </div>
        <div className="relative border-t border-line px-5 py-4 md:border-t-0">
          <Caps>Cheaper option</Caps>
          <div className={cn(!unlocked && "pointer-events-none blur-[5px] select-none")} aria-hidden={!unlocked}>
            <div className="mt-1.5 text-[13px] text-ink-2">{unlocked ? leak.alternative : "A smaller plan that covers what you use"}</div>
            <div className="tnum mt-0.5 font-mono text-lg font-semibold text-good">{unlocked ? money(leak.altPrice) : "$00"}/mo</div>
          </div>
          {!unlocked && <span className="sr-only">Hidden until unlocked.</span>}
        </div>
      </div>

      {unlocked ? (
        <div className="border-t border-line px-5 py-4">
          <Caps className="mb-2">How to fix it</Caps>
          <ol className="space-y-2">
            {leak.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="tnum grid size-5 shrink-0 place-items-center rounded-full border border-line font-mono text-[11px]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" onClick={() => applyLeak(leak.id)}>
              I&apos;ve made this change · update my books
            </Button>
            <span className="text-[12px] text-muted">
              Lowers {expense.name.toLowerCase()} to {money(leak.altPrice)} in Expenses and lifts your score.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-line bg-canvas px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-2">
            The cheaper option and the steps are on <span className="font-medium text-ink">{needs.name}</span>. Or unlock just this one.
          </p>
          <div className="flex flex-wrap gap-2">
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
