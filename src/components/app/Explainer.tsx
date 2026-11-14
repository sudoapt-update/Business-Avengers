import type { ReactNode } from "react";
import { Info } from "lucide-react";

/** The "What this screen is for" card: one plain paragraph above a page's data. */
export function Explainer({ title = "What this screen is for", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-card border-line bg-panel flex gap-3 border px-4 py-4 sm:px-5">
      <span className="bg-info-bg text-info grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden>
        <Info className="size-3.5" />
      </span>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-ink-2 mt-1 max-w-[30rem] text-[13px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
