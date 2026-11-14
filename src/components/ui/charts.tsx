"use client";

import { useId, useState } from "react";

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
