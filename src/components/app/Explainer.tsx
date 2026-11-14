import type { ReactNode } from "react";
import { Info } from "lucide-react";

/** The "What this screen is for" card: one plain paragraph above a page's data. */
export function Explainer({ title = "What this screen is for", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-card border border-line bg-panel px-4 py-4 sm:px-5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-info-bg text-info" aria-hidden>
        <Info className="size-3.5" />
      </span>
      <div className="max-w-3xl">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}
