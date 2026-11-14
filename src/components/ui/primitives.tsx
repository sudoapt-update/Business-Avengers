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
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        pillTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={cn("rounded-card border-line bg-panel border", className)}>{children}</As>;
}

export function CardHeader({
  title,
  sub,
  right,
  icon,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  /** An IconTile shown before the title. */
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h3 className="text-ink text-[15px] font-semibold tracking-tight">{title}</h3>
          {sub && <p className="text-muted mt-0.5 text-[13px]">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Caps({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-muted text-[11px] font-medium tracking-[0.08em] uppercase", className)}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-2.5 text-[13px]",
        variant === "primary" && "bg-ink hover:bg-ink-2 text-white",
        variant === "secondary" && "border-line-strong bg-panel text-ink hover:bg-hover border",
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

export function Delta({
  value,
  suffix = "",
  invert = false,
  digits = 1,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  digits?: number;
}) {
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 10 ** -digits / 2;
  return (
    <Pill tone={flat ? "neutral" : good ? "good" : "bad"} className="tnum font-mono">
      {flat ? "±" : value > 0 ? "↗" : "↘"} {Math.abs(value).toFixed(digits)}
      {suffix}
    </Pill>
  );
}

export type TileTone = Tone | "violet" | "ink";

const tileTone: Record<TileTone, string> = {
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-hover text-ink-2",
  ink: "bg-ink text-white",
};

/** A small tinted square holding an icon. Marks what a card or row is about before the text is read. */
export function IconTile({
  children,
  tone = "neutral",
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: TileTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center [&>svg]:size-4",
        size === "sm" && "size-7 rounded-md [&>svg]:size-3.5",
        size === "md" && "size-8 rounded-lg",
        size === "lg" && "size-10 rounded-[10px] [&>svg]:size-5",
        tileTone[tone],
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

const bandTone = {
  warn: "border-warn-dot/30 bg-warn-bg/70",
  good: "border-good-dot/25 bg-good-bg/70",
  info: "border-info-dot/25 bg-info-bg/70",
} as const;

/**
 * A named, tinted panel holding a group of cards. Its header is a button: the panel opens and
 * closes smoothly, and shows a one-line summary so a closed panel still says something.
 * Runs edge to edge on phones so the cards inside keep their width.
 */
export function Band({
  id,
  icon,
  tone,
  title,
  sub,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: ReactNode;
  tone: keyof typeof bandTone;
  title: string;
  sub?: ReactNode;
  /** Short figures shown in the header, open or closed. */
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn("-mx-4 border-y sm:mx-0 sm:rounded-2xl sm:border", bandTone[tone], open ? "shadow-none" : "hover:shadow-sm")}
    >
      <h2 id={`${id}-title`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="flex w-full items-center gap-3 px-4 py-4 text-left sm:rounded-2xl sm:px-5"
        >
          <span
            className={cn("bg-panel grid size-9 shrink-0 place-items-center rounded-[10px] shadow-sm [&>svg]:size-[18px]", tileText[tone])}
            aria-hidden
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] leading-tight font-semibold tracking-tight">{title}</span>
            {sub && <span className="text-ink-2 block text-[13px] font-normal">{sub}</span>}
          </span>
          {summary && <span className="hidden shrink-0 items-center gap-1.5 md:flex">{summary}</span>}
          <span className="bg-panel text-ink-2 grid size-8 shrink-0 place-items-center rounded-full shadow-sm" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
      </h2>
      {summary && !open && <div className="flex flex-wrap gap-1.5 px-4 pb-4 md:hidden">{summary}</div>}
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-title`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-5 sm:px-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** A small figure for a band's header summary. */
export function BandStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="bg-panel/80 border-line inline-flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="tnum text-ink font-mono font-medium">{value}</span>
    </span>
  );
}

const tileText = { warn: "text-warn", good: "text-good", info: "text-info" } as const;
