"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { formatDay } from "@/lib/date";
import type { CashWeek } from "@/lib/engine";
import { CHANNEL_LABEL } from "@/lib/seed";
import { cn, money, signedMoney } from "@/lib/format";
import type { Channel } from "@/lib/types";
import { CHANNEL_COLOR } from "./brand";

export function Sparkline({
  values,
  tone = "good",
  className = "h-8 w-24",
}: {
  values: number[];
  tone?: "good" | "warn" | "bad" | "ink";
  className?: string;
}) {
  const w = 96;
  const h = 32;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 4 - ((v - min) / span) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const color = { good: "var(--color-good-dot)", warn: "var(--color-warn-dot)", bad: "var(--color-bad-dot)", ink: "var(--color-ink)" }[
    tone
  ];
  const last = pts.at(-1)!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

/** Health Score over time, drawn in the brand gradient. Hover or arrow-key the plot. */
export function ScoreChart({ values, labels, target }: { values: number[]; labels: string[]; target?: number }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const w = 640;
  const h = 200;
  const padL = 30;
  const padB = 22;
  const lo = Math.floor(Math.min(...values, target ?? 100) / 10) * 10 - 5;
  const hi = Math.min(100, Math.ceil(Math.max(...values, target ?? 0) / 10) * 10 + 5);
  const x = (i: number) => padL + (i / (values.length - 1)) * (w - padL - 8);
  const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (h - padB - 8);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1)},${h - padB} L${x(0)},${h - padB} Z`;
  const ticks = [lo + 5, Math.round((lo + hi) / 2 / 5) * 5, hi - 5];
  const sel = hover ?? values.length - 1;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-48 w-full touch-none"
        role="img"
        aria-label={`Health Score over ${values.length} days, from ${values[0]} to ${values.at(-1)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover(Math.max(0, sel - 1));
          if (e.key === "ArrowRight") setHover(Math.min(values.length - 1, sel + 1));
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * w;
          const i = Math.round(((px - padL) / (w - padL - 8)) * (values.length - 1));
          setHover(Math.max(0, Math.min(values.length - 1, i)));
        }}
        onPointerLeave={() => setHover(null)}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`${id}-l`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-brand-a)" />
            <stop offset="1" stopColor="var(--color-brand-b)" />
          </linearGradient>
          <linearGradient id={`${id}-a`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-brand-b)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--color-brand-a)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <line
            key={t}
            x1={padL}
            x2={w - 8}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--color-line)"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {target !== undefined && (
          <line
            x1={padL}
            x2={w - 8}
            y1={y(target)}
            y2={y(target)}
            stroke="var(--color-faint)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={area} fill={`url(#${id}-a)`} />
        <path d={line} fill="none" stroke={`url(#${id}-l)`} strokeWidth="2.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={x(sel)} x2={x(sel)} y1={8} y2={h - padB} stroke="var(--color-line-strong)" vectorEffect="non-scaling-stroke" />
        <circle
          cx={x(sel)}
          cy={y(values[sel])}
          r="4"
          fill="var(--color-panel)"
          stroke="var(--color-brand-b)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {ticks.map((t) => (
        <span
          key={t}
          className="tnum text-muted pointer-events-none absolute left-0 w-6 -translate-y-1/2 text-right font-mono text-[11px]"
          style={{ top: `${(y(t) / h) * 192}px` }}
        >
          {t}
        </span>
      ))}
      <div className="text-muted flex justify-between pl-[5%] font-mono text-[11px]">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor((values.length - 1) / 2)]}</span>
        <span>{labels.at(-1)}</span>
      </div>
      <div
        className="border-line bg-panel pointer-events-none absolute top-1 rounded-md border px-2 py-1 text-xs shadow-sm"
        style={{ left: `clamp(0px, calc(${(x(sel) / w) * 100}% - 48px), calc(100% - 104px))` }}
        aria-live="polite"
      >
        <span className="text-muted">{labels[sel]}</span> <span className="tnum font-mono font-medium">{values[sel].toFixed(1)}</span>
      </div>
    </div>
  );
}

/** Eases a displayed number toward its new value, so a change is seen and not just swapped in. */
export function useCountUp(value: number, ms = 650) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : ms;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = k === 1 ? value : start + (value - start) * (1 - Math.pow(1 - k, 3));
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  return <>{format(useCountUp(value))}</>;
}

const CHANNEL_ORDER: Channel[] = ["shopify", "amazon", "market"];

function niceMax(n: number) {
  const step = n > 4000 ? 2000 : n > 2000 ? 1000 : n > 800 ? 500 : 200;
  return Math.max(step, Math.ceil(n / step) * step);
}
const axisMoney = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : `$${n}`);

/**
 * Money in (stacked by channel) beside money out, one pair of columns per week.
 * Hover, tap or tab to a week for its figures.
 */
export function CashFlowChart({ weeks }: { weeks: CashWeek[] }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = niceMax(Math.max(...weeks.map((w) => Math.max(w.totalIn, w.out)), 1));
  const ticks = [max, max / 2, 0];
  const H = 176;
  const w = sel === null ? null : weeks[sel];

  return (
    <div>
      <ul className="text-ink-2 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
        {CHANNEL_ORDER.map((c) => (
          <li key={c} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: CHANNEL_COLOR[c] }} aria-hidden />
            {CHANNEL_LABEL[c]} sales
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span className="bg-ch-out size-2.5 rounded-[3px]" aria-hidden />
          Money out
        </li>
      </ul>
      <div className="relative flex gap-2" onPointerLeave={() => setSel(null)}>
        <div className="tnum text-muted relative w-9 shrink-0 font-mono text-[11px]" style={{ height: H }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / max) * 100}%` }}>
              {axisMoney(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 top-0" style={{ height: H }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="bg-line absolute inset-x-0 h-px" style={{ top: `${(1 - t / max) * 100}%` }} />
            ))}
          </div>
          <div className="relative flex">
            {weeks.map((wk, i) => (
              <button
                key={wk.to}
                type="button"
                onPointerEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                onBlur={() => setSel(null)}
                onClick={() => setSel(i)}
                aria-label={`Week of ${formatDay(wk.from)}: ${money(wk.totalIn)} in, ${money(wk.out)} out, net ${signedMoney(wk.net)}`}
                className={cn("group min-w-0 flex-1 rounded-md pb-1 outline-offset-0", sel === i && "bg-hover/70")}
              >
                <span className="flex items-end justify-center gap-[2px]" style={{ height: H }}>
                  <span className="flex w-[38%] max-w-4 flex-col-reverse gap-[2px]" style={{ height: `${(wk.totalIn / max) * 100}%` }}>
                    {CHANNEL_ORDER.map((c, ci) => (
                      <span
                        key={c}
                        className={cn("w-full transition-[flex-grow] duration-500", ci === CHANNEL_ORDER.length - 1 && "rounded-t-[4px]")}
                        style={{ flexGrow: wk.in[c], flexBasis: 0, background: CHANNEL_COLOR[c] }}
                      />
                    ))}
                  </span>
                  <span
                    className="bg-ch-out w-[38%] max-w-4 rounded-t-[4px] transition-[height] duration-500"
                    style={{ height: `${(wk.out / max) * 100}%` }}
                  />
                </span>
                <span className={cn("tnum text-muted mt-1.5 block truncate font-mono text-[11px]", i % 2 === 1 && "max-sm:invisible")}>
                  {formatDay(wk.from)}
                </span>
              </button>
            ))}
          </div>
          {w && sel !== null && (
            <div
              className="border-line bg-panel pointer-events-none absolute top-0 z-10 w-44 rounded-lg border p-2.5 text-xs shadow-md"
              style={{
                left: `clamp(0px, calc(${((sel + 0.5) / weeks.length) * 100}% - 88px), calc(100% - 176px))`,
              }}
              role="status"
            >
              <div className="text-muted mb-1.5 font-mono text-[11px]">
                {formatDay(w.from)} – {formatDay(w.to)}
              </div>
              {CHANNEL_ORDER.map((c) => (
                <div key={c} className="flex items-center gap-1.5 py-0.5">
                  <span className="size-2 rounded-[2px]" style={{ background: CHANNEL_COLOR[c] }} aria-hidden />
                  <span className="text-ink-2 flex-1">{CHANNEL_LABEL[c]}</span>
                  <span className="tnum font-mono">{money(w.in[c])}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="bg-ch-out size-2 rounded-[2px]" aria-hidden />
                <span className="text-ink-2 flex-1">Money out</span>
                <span className="tnum font-mono">−{money(w.out)}</span>
              </div>
              <div className="border-line mt-1.5 flex justify-between border-t pt-1.5 font-medium">
                <span>Net</span>
                <span className={cn("tnum font-mono", w.net >= 0 ? "text-good" : "text-bad")}>{signedMoney(w.net)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface Part {
  label: string;
  value: number;
  color: string;
  icon?: ReactNode;
}

/** One whole split into parts: a segmented bar with a legend that carries every value. */
export function PartsBar({ parts, format = money, className }: { parts: Part[]; format?: (n: number) => string; className?: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {parts.map((p) => (
          <span
            key={p.label}
            className="h-full transition-[flex-grow] duration-500 first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: Math.max(0, p.value), flexBasis: 0, background: p.color }}
            title={`${p.label}: ${format(p.value)}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-[13px] whitespace-nowrap">
            {p.icon ?? <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} aria-hidden />}
            <span className="text-ink-2">{p.label}</span>
            <span className="tnum font-mono font-medium">{format(p.value)}</span>
            <span className="tnum text-muted font-mono text-xs">{Math.round((Math.max(0, p.value) / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranked horizontal bars in one colour, with the value at the end of each row. */
export function HBars({
  rows,
  color = "var(--color-ch-market)",
  format = money,
}: {
  rows: { label: string; value: number; icon?: ReactNode; note?: ReactNode }[];
  color?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_6rem] items-center gap-3 text-[13px]">
          <span className="text-ink-2 flex min-w-0 items-center gap-2">
            {r.icon}
            <span className="truncate">{r.label}</span>
          </span>
          <span className="bg-hover block h-2.5 overflow-hidden rounded-r-[4px]" aria-hidden>
            <span
              className="block h-full rounded-r-[4px] transition-[width] duration-500"
              style={{ width: `${(r.value / max) * 100}%`, background: color }}
            />
          </span>
          <span className="tnum flex w-24 items-center justify-end gap-2 text-right font-mono font-medium tabular-nums">
            {r.note}
            {format(r.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
