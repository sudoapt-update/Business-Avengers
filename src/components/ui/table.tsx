"use client";

import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/format";

/** A number that turns into an input on click. Enter or blur saves, Escape cancels. */
export function EditableNumber({
  value,
  display,
  onCommit,
  label,
  step = "0.01",
  className,
}: {
  value: number;
  display: string;
  onCommit: (n: number) => void;
  label: string;
  step?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(String(value))}
        className={cn(
          "group tnum inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono hover:bg-hover",
          className,
        )}
        aria-label={`${label}: ${display}. Edit`}
      >
        <Pencil className="size-3 text-faint opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
        {display}
      </button>
    );
  }

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(n)) onCommit(n);
    setDraft(null);
  };

  return (
    <input
      autoFocus
      type="number"
      inputMode="decimal"
      step={step}
      min="0"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
      onFocus={(e) => e.target.select()}
      className="tnum h-7 w-28 rounded-md border border-ink bg-panel px-2 text-right font-mono text-sm outline-none"
    />
  );
}

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const nums = pageWindow(page, pages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px]">
      <span className="text-muted">
        Showing <span className="tnum font-medium text-ink">{from}–{to}</span> of <span className="tnum">{total.toLocaleString("en-US")}</span>
      </span>
      <nav className="flex items-center gap-1" aria-label="Pages">
        <button className="rounded-md px-2 py-1 text-ink-2 hover:bg-hover disabled:text-faint disabled:hover:bg-transparent" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        {nums.map((n, i) =>
          n === -1 ? (
            <span key={`gap${i}`} className="px-1 text-faint">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn("tnum hidden min-w-8 rounded-md px-2 py-1 sm:inline-block", n === page ? "border border-line bg-panel font-medium" : "text-ink-2 hover:bg-hover")}
            >
              {n + 1}
            </button>
          ),
        )}
        <button className="rounded-md px-2 py-1 text-ink-2 hover:bg-hover disabled:text-faint disabled:hover:bg-transparent" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </nav>
    </div>
  );
}

function pageWindow(page: number, pages: number): number[] {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i);
  const set = new Set([0, pages - 1, page - 1, page, page + 1].filter((n) => n >= 0 && n < pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: number[] = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push(-1);
    out.push(n);
  });
  return out;
}

/** Segmented filter, like a tab strip. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-lg border border-line bg-canvas p-0.5 text-[13px]" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn("rounded-md px-2.5 py-1 whitespace-nowrap", value === o.value ? "bg-panel font-medium shadow-sm" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Th({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) {
  return <th className={cn("px-3 py-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase first:pl-5 last:pr-5", right && "text-right", className)}>{children}</th>;
}

export function Td({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) {
  return <td className={cn("px-3 py-3 align-middle first:pl-5 last:pr-5", right && "text-right", className)}>{children}</td>;
}
