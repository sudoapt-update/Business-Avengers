"use client";

import { useState, type FormEvent } from "react";
import { Check, Lock } from "lucide-react";
import { leakUnlocked, useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { addDays, formatDay } from "@/lib/date";
import { MISSIONS } from "@/lib/missions";
import { money, money2, pct } from "@/lib/format";
import type { ExpenseCategory } from "@/lib/types";
import { Button, Caps, Pill, SegmentBar } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";

export function Sheets() {
  const sheet = useStore((s) => s.sheet);
  const close = () => useStore.getState().openSheet(null);
  return (
    <>
      <Dialog
        side
        open={sheet?.kind === "review-fees"}
        onClose={close}
        title="Yesterday's Amazon fees"
        sub="Every marketplace order from yesterday, with what the platform kept."
      >
        <ReviewFees />
      </Dialog>
      <Dialog
        side
        open={sheet?.kind === "add-expense"}
        onClose={close}
        title="Add an expense"
        sub="Anything you paid for the business that isn't in your books yet."
      >
        <AddExpense />
      </Dialog>
      <Dialog
        side
        open={sheet?.kind === "runway"}
        onClose={close}
        title="How long your cash lasts"
        sub="Weeks of fixed costs and your own pay you could cover if sales stopped today."
      >
        <Runway />
      </Dialog>
      <Dialog side open={sheet?.kind === "leak"} onClose={close} title="Money leak" sub="Illustrative tool categories and example prices.">
        {sheet?.kind === "leak" && <LeakDetail leakId={sheet.leakId} />}
      </Dialog>
    </>
  );
}

function Row({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div>
        <div className={strong ? "text-sm font-medium" : "text-ink-2 text-sm"}>{label}</div>
        {sub && <div className="text-muted text-xs">{sub}</div>}
      </div>
      <div className={`tnum font-mono text-sm ${strong ? "font-semibold" : ""}`}>{value}</div>
    </div>
  );
}

function ReviewFees() {
  const d = useDerived();
  const markReviewed = useStore((s) => s.markReviewed);
  const y = addDays(d.today, -1);
  const orders = d.data.orders.filter((o) => o.day === y && o.channel === "amazon");
  const gross = orders.reduce((s, o) => s + o.gross, 0);
  const fees = orders.reduce((s, o) => s + o.platformFee, 0);
  const referral = orders.reduce((s, o) => s + o.gross * 0.15, 0);
  const done = d.missions.find((m) => m.id === "review-fees")?.done;

  return (
    <div className="p-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Sales" value={money(gross)} />
        <Stat label="Fees" value={money(fees)} sub={gross ? pct(fees / gross) + " of sales" : undefined} />
      </div>
      <div className="divide-line border-line mt-5 divide-y border-y">
        <Row label="Referral fee" sub="15% of each sale" value={money2(-referral)} />
        <Row label="Fulfilment fee" sub="Per unit picked, packed and shipped" value={money2(-(fees - referral))} />
        <Row label="You received" value={money2(gross - fees)} strong />
      </div>
      <Caps className="mt-6 mb-2">Orders · {formatDay(y, { weekday: "short", day: "numeric", month: "short" })}</Caps>
      <ul className="divide-line rounded-card border-line divide-y border">
        {orders.slice(0, 6).map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate">
                {o.item} ×{o.qty}
              </div>
              <div className="text-muted font-mono text-xs">{o.ref}</div>
            </div>
            <div className="text-right">
              <div className="tnum font-mono">{money2(o.gross)}</div>
              <div className="tnum text-bad font-mono text-xs">−{money2(o.platformFee)}</div>
            </div>
          </li>
        ))}
        {orders.length > 6 && <li className="text-muted px-3 py-2 text-xs">+{orders.length - 6} more in Books</li>}
      </ul>
      <p className="text-muted mt-4 text-[13px]">
        Fees took {gross ? pct(fees / gross, 0) : "0%"} of yesterday&apos;s marketplace sales. Your store&apos;s own checkout costs about
        3%.
      </p>
      <div className="mt-5">
        {done ? (
          <Pill tone="good">
            <Check className="size-3" /> Reviewed today
          </Pill>
        ) : (
          <Button variant="primary" className="w-full" onClick={() => markReviewed("review-fees")}>
            Mark as reviewed · +{d.reward(MISSIONS["review-fees"]).tokens} tokens
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card border-line border p-3">
      <Caps>{label}</Caps>
      <div className="tnum mt-1 font-mono text-lg font-semibold">{value}</div>
      {sub && <div className="text-muted text-xs">{sub}</div>}
    </div>
  );
}

const CATEGORIES: ExpenseCategory[] = ["Packaging", "Advertising", "Software", "Market booth", "Utilities", "Other"];
const SUGGESTIONS: { name: string; category: ExpenseCategory; amount: number }[] = [
  { name: "Bubble mailers, 100 pack", category: "Packaging", amount: 38 },
  { name: "Boosted post", category: "Advertising", amount: 25 },
  { name: "Market parking", category: "Other", amount: 12 },
  { name: "Thank-you cards", category: "Packaging", amount: 19 },
];

function AddExpense() {
  const d = useDerived();
  const addExpense = useStore((s) => s.addExpense);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Packaging");
  const added = d.data.expenses.filter((e) => e.addedOn === d.today);
  const mission = d.missions.find((m) => m.id === "add-expenses");
  const target = MISSIONS["add-expenses"].target!;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!name.trim() || !(amt > 0)) return;
    addExpense({ name: name.trim(), amount: Math.round(amt * 100) / 100, category, cadence: "one-off" });
    setName("");
    setAmount("");
  };

  const field = "h-9 w-full rounded-lg border border-line-strong bg-panel px-3 text-sm outline-none focus:border-ink";

  return (
    <div className="p-5">
      {mission && (
        <div className="rounded-card border-line mb-5 border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Mission: add {target} expenses</span>
            <span className="tnum text-muted font-mono">
              {Math.min(added.length, target)}/{target}
            </span>
          </div>
          <SegmentBar total={target} done={Math.min(added.length, target)} className="mt-2" />
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium">What was it?</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bubble mailers" required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[13px] font-medium">Amount (USD)</span>
            <input
              className={`${field} tnum font-mono`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-medium">Category</span>
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <Button variant="primary" type="submit" className="w-full">
          Add to Books
        </Button>
      </form>
      <Caps className="mt-6 mb-2">Quick fill</Caps>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.name}
            className="border-line hover:bg-hover rounded-lg border px-2.5 py-1.5 text-left text-[13px]"
            onClick={() => addExpense({ ...s, cadence: "one-off" })}
          >
            {s.name} <span className="tnum text-muted font-mono">${s.amount}</span>
          </button>
        ))}
      </div>
      {added.length > 0 && (
        <>
          <Caps className="mt-6 mb-2">Added today</Caps>
          <ul className="divide-line rounded-card border-line divide-y border">
            {added.slice(-6).map((e) => (
              <li key={e.id} className="animate-row-in flex justify-between px-3 py-2 text-sm">
                <span>
                  {e.name} <span className="text-muted text-xs">· {e.category}</span>
                </span>
                <span className="tnum font-mono">{money2(e.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Runway() {
  const d = useDerived();
  const m = d.metrics;
  return (
    <div className="p-5">
      <div className="rounded-card border-line border p-4">
        <Caps>Cash runway</Caps>
        <div className="tnum mt-1 font-mono text-3xl font-semibold">{m.runwayWeeks.toFixed(1)} weeks</div>
        <div className="text-muted mt-1 text-[13px]">
          {money(m.cash)} in cash ÷ {money(m.weeklyFixed)} a week of fixed costs and owner pay.
        </div>
      </div>
      <Caps className="mt-6 mb-2">Where the cash is</Caps>
      <div className="divide-line border-line divide-y border-y">
        {d.data.cash.map((a) => (
          <Row key={a.id} label={a.name} sub={a.note} value={money(a.balance)} />
        ))}
        <Row label="Orders and expenses since last count" value={money(m.cash - d.data.cash.reduce((s, a) => s + a.balance, 0))} />
        <Row label="Cash today" value={money(m.cash)} strong />
      </div>
      <p className="text-muted mt-4 text-[13px]">
        Twelve weeks or more lets you reorder stock for the holidays without a loan. You are{" "}
        {m.runwayWeeks >= 12
          ? "there."
          : `${(12 - m.runwayWeeks).toFixed(1)} weeks short; that's about ${money((12 - m.runwayWeeks) * m.weeklyFixed)}.`}
      </p>
    </div>
  );
}

function LeakDetail({ leakId }: { leakId: string }) {
  const d = useDerived();
  const tier = useStore((s) => s.tier);
  const { unlockLeak, applyLeak, openUpgrade } = useStore.getState();
  const view = d.leaks.find((l) => l.leak.id === leakId);
  if (!view) return null;
  const { leak, expense } = view;
  const open = leakUnlocked(tier, leak);
  const saving = expense.amount - leak.altPrice;

  return (
    <div className="p-5">
      <h3 className="text-[15px] font-semibold">{leak.title}</h3>
      <p className="text-ink-2 mt-1 text-sm">{leak.problem}</p>
      <div className="rounded-card border-line mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border p-4">
        <div>
          <Caps>Now</Caps>
          <div className="text-ink-2 mt-1 text-[13px]">{expense.name}</div>
          <div className="tnum font-mono text-lg font-semibold">{money(expense.amount)}/mo</div>
        </div>
        <span className="text-faint">→</span>
        <div>
          <Caps>Cheaper option</Caps>
          <div className="text-ink-2 mt-1 text-[13px]">{leak.alternative}</div>
          <div className="tnum text-good font-mono text-lg font-semibold">{money(leak.altPrice)}/mo</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Pill tone="good" className="font-mono">
          Save {money(saving)}/mo · {money(saving * 12)}/yr
        </Pill>
        <span className="text-muted text-xs">Example prices</span>
      </div>

      {view.applied ? (
        <div className="rounded-card border-good-dot/30 bg-good-bg text-good mt-6 border p-4 text-sm">
          Applied on {formatDay(leak.appliedOn!)}. Your expenses now use {money(leak.altPrice)}/mo.
        </div>
      ) : open ? (
        <>
          <Caps className="mt-6 mb-2">Steps</Caps>
          <ol className="space-y-2">
            {leak.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="tnum border-line grid size-5 shrink-0 place-items-center rounded-full border font-mono text-xs">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <Button variant="primary" className="mt-6 w-full" onClick={() => applyLeak(leak.id)}>
            I&apos;ve made this change · update my books
          </Button>
        </>
      ) : (
        <div className="rounded-card border-line-strong mt-6 border border-dashed p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="text-muted size-4" /> Action steps are locked
          </div>
          <p className="text-muted mt-1 text-[13px]">Unlock this one with tokens, or see every leak on Growth.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => unlockLeak(leak.id)}>
              Unlock for {leak.unlockCost} tokens
            </Button>
            <Button
              size="sm"
              onClick={() =>
                openUpgrade({ title: "See every leak on Growth", body: "Growth unlocks all four leaks with step-by-step fixes." })
              }
            >
              See Growth
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
