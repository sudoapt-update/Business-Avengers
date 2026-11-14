"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, Bot, Coins } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { ADVISER_COST, MAX_QUESTION, SUGGESTED_QUESTIONS } from "@/lib/adviser";
import { cn, money, num } from "@/lib/format";
import type { ChatEntry } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, CardHeader, Caps, Pill } from "@/components/ui/primitives";

export function AdviserView() {
  const d = useDerived();
  const busy = useStore((s) => s.adviserBusy);
  const ask = useStore((s) => s.askAdviser);
  const chat = d.data.chat ?? [];
  // Questions linked from the Overview arrive as ?q=; they fill the box but are never sent automatically.
  const [draft, setDraft] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const endRef = useRef<HTMLDivElement>(null);
  const short = d.tokens < ADVISER_COST;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.length, busy]);

  const send = (q: string) => {
    if (!q.trim() || busy) return;
    void ask(q);
    setDraft("");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <>
      <PageHeader
        title="AI Adviser"
        sub={`Ask about your shop's numbers. Each question costs ${ADVISER_COST} tokens; missions earn them back.`}
        actions={
          <span className="tnum inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 font-mono text-sm">
            <Coins className="size-4 text-warn" />
            {num(d.tokens)} tokens
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="flex min-h-[520px] flex-col lg:col-span-8">
          <div className="flex-1 space-y-5 px-4 py-5 sm:px-5" aria-live="polite" aria-busy={busy}>
            {chat.length === 0 && <EmptyState onPick={send} disabled={busy} />}
            {chat.map((m) => (m.role === "user" ? <UserBubble key={m.id} m={m} /> : <Answer key={m.id} m={m} />))}
            {busy && (
              <div className="flex items-center gap-2 text-[13px] text-muted" role="status">
                <AdviserMark />
                <span className="inline-flex gap-1" aria-hidden>
                  <span className="size-1.5 animate-pulse rounded-full bg-faint" />
                  <span className="size-1.5 animate-pulse rounded-full bg-faint [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-faint [animation-delay:300ms]" />
                </span>
                Reading your numbers…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t border-line p-3 sm:p-4">
            <label htmlFor="adviser-q" className="sr-only">
              Your question
            </label>
            <div className="flex items-end gap-2 rounded-card border border-line-strong bg-panel p-2 focus-within:border-ink">
              <textarea
                id="adviser-q"
                rows={2}
                maxLength={MAX_QUESTION}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                placeholder="e.g. Can I afford to spend $300 more on ads?"
                className="min-h-10 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-faint"
              />
              <Button type="submit" variant="primary" size="sm" disabled={!draft.trim() || busy} aria-label={`Ask, costs ${ADVISER_COST} tokens`}>
                <ArrowUp className="size-3.5" /> Ask · {ADVISER_COST}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted">
              <span>Educational, not financial advice. Answers use the sample store&apos;s numbers.</span>
              {short ? (
                <span className="text-warn">Not enough tokens: complete a mission or preview a bigger plan.</span>
              ) : (
                <span className="tnum font-mono">
                  {draft.length}/{MAX_QUESTION}
                </span>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader title="Try asking" sub="Each one uses this store's numbers." />
            <ul className="space-y-1.5 p-4 pt-3">
              {SUGGESTED_QUESTIONS.map((q) => (
                <li key={q}>
                  <button
                    onClick={() => send(q)}
                    disabled={busy}
                    className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-sm hover:bg-hover disabled:opacity-50"
                  >
                    <span className="flex-1">{q}</span>
                    <span className="tnum shrink-0 font-mono text-[11px] text-muted">{ADVISER_COST} tokens</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <WhatItSees />
        </div>
      </div>
    </>
  );
}

function AdviserMark() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-white" aria-hidden>
      <Bot className="size-3.5" />
    </span>
  );
}

function EmptyState({ onPick, disabled }: { onPick: (q: string) => void; disabled: boolean }) {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <div className="mx-auto w-fit">
        <AdviserMark />
      </div>
      <h2 className="mt-3 text-[15px] font-semibold">Ask anything about the shop&apos;s money</h2>
      <p className="mt-1 text-[13px] text-muted">
        The adviser reads your sales, fees, costs, cash and leaks before it answers, and ends with one next step.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
          <button key={q} disabled={disabled} onClick={() => onPick(q)} className="rounded-full border border-line px-3 py-1.5 text-[13px] hover:bg-hover">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ m }: { m: ChatEntry }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-card rounded-br-sm bg-hover px-3.5 py-2.5 text-sm whitespace-pre-wrap">{m.text}</div>
      {m.cost ? <span className="tnum font-mono text-[11px] text-muted">−{m.cost} tokens</span> : null}
    </div>
  );
}

function Answer({ m }: { m: ChatEntry }) {
  return (
    <div className="flex gap-3">
      <AdviserMark />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium">Adviser</span>
          {m.source === "model" ? (
            <Pill tone="info">Claude · uses your numbers</Pill>
          ) : (
            <Pill tone="neutral">Calculated from your numbers</Pill>
          )}
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-ink-2">{renderAnswer(m.text)}</div>
      </div>
    </div>
  );
}

/** Light formatting for answers: paragraphs, bullet lists and a highlighted "Next step". */
function renderAnswer(text: string): ReactNode[] {
  const clean = text.replace(/\*\*(.+?)\*\*/g, "$1");
  const blocks = clean.split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    const bullets = lines.filter((l) => /^\s*([-•*]|\d+\.)\s+/.test(l));
    if (bullets.length && bullets.length === lines.length) {
      out.push(
        <ul key={i} className="list-disc space-y-1 pl-5">
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^\s*([-•*]|\d+\.)\s+/, "")}</li>
          ))}
        </ul>,
      );
      return;
    }
    for (const [j, line] of lines.entries()) {
      // Fallback answers put the next step at the end of one paragraph; split it out.
      const [before, after] = line.split(/(?=Next step:)/);
      if (before?.trim()) out.push(<p key={`${i}-${j}`}>{before.trim()}</p>);
      if (after) out.push(<NextStep key={`${i}-${j}-n`}>{after.replace(/^Next step:\s*/, "")}</NextStep>);
    }
  });
  return out;
}

function NextStep({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-ink">
      <span className="font-medium">Next step:</span> {children}
    </p>
  );
}

function WhatItSees() {
  const d = useDerived();
  const m = d.metrics;
  const rows: [string, string][] = [
    ["Sales, 30 days", money(m.revenue)],
    ["True profit", `${money(m.trueProfit)} · ${(m.margin * 100).toFixed(1)}%`],
    ["Fees", `${(m.feeLoad * 100).toFixed(1)}% of sales`],
    ["Cash", `${money(m.cash)} · ${m.runwayWeeks.toFixed(1)} wk`],
    ["Open leaks", `${money(m.leakMonthly)}/mo`],
    ["Health Score", m.score.toFixed(1)],
  ];
  return (
    <Card className="p-5">
      <Caps>What the adviser sees</Caps>
      <dl className="mt-3 divide-y divide-line text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-1.5">
            <dt className="text-muted">{k}</dt>
            <dd className="tnum font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      <p className={cn("mt-3 text-[12px] text-muted")}>
        Sent with each question, with the store name and its channel and stock figures. No personal or account details are sent.
      </p>
    </Card>
  );
}
