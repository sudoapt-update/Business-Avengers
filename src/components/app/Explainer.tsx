import type { ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";

/** "What this screen is for": one line that opens into a plain paragraph, so it never pushes the data down. */
export function Explainer({ title = "What this screen is for", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group rounded-card border-line bg-panel border">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="bg-info-bg text-info grid size-6 shrink-0 place-items-center rounded-md" aria-hidden>
          <Info className="size-3.5" />
        </span>
        <span className="flex-1">{title}</span>
        <ChevronDown className="text-muted size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="text-ink-2 max-w-[44rem] px-4 pb-4 text-[13px] leading-relaxed sm:px-5 sm:pl-[3.375rem]">{children}</div>
    </details>
  );
}
