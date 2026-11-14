import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

const pillTone: Record<Tone, string> = {
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  neutral: "bg-hover text-ink-2",
};

export const dotTone: Record<Tone, string> = {
  good: "bg-good-dot",
  warn: "bg-warn-dot",
  bad: "bg-bad-dot",
  info: "bg-info-dot",
  neutral: "bg-faint",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", pillTone[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className, as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={cn("rounded-card border border-line bg-panel", className)}>{children}</As>;
}

export function CardHeader({ title, sub, right, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Caps({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[11px] font-medium uppercase tracking-[0.08em] text-muted", className)}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-2.5 text-[13px]",
        variant === "primary" && "bg-ink text-white hover:bg-ink-2",
        variant === "secondary" && "border border-line-strong bg-panel text-ink hover:bg-hover",
        variant === "ghost" && "text-ink-2 hover:bg-hover",
        className,
      )}
    />
  );
}

export function SegmentBar({ total, done, className }: { total: number; done: number; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)} aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < done ? "bg-good-dot" : i === done ? "bg-warn-dot" : "bg-line")} />
      ))}
    </div>
  );
}

export function Delta({ value, suffix = "", invert = false, digits = 1 }: { value: number; suffix?: string; invert?: boolean; digits?: number }) {
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 10 ** -digits / 2;
  return (
    <Pill tone={flat ? "neutral" : good ? "good" : "bad"} className="tnum font-mono">
      {flat ? "±" : value > 0 ? "↗" : "↘"} {Math.abs(value).toFixed(digits)}
      {suffix}
    </Pill>
  );
}
