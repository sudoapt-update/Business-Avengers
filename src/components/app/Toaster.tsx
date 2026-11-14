"use client";

import { X } from "lucide-react";
import { useStore } from "@/store/store";

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full animate-toast-in rounded-card border border-line bg-panel p-3.5 shadow-lg shadow-black/5">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-good-dot" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.detail && <div className="mt-0.5 text-[13px] text-muted">{t.detail}</div>}
              {(t.chips || t.scoreTo !== undefined) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.chips?.map((c) => (
                    <span key={c} className="tnum rounded-md bg-hover px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                      {c}
                    </span>
                  ))}
                  {t.scoreTo !== undefined && t.scoreFrom !== undefined && (
                    <span className="tnum rounded-md bg-good-bg px-1.5 py-0.5 font-mono text-[11px] text-good">
                      Score {t.scoreFrom.toFixed(1)} → {t.scoreTo.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button className="rounded p-0.5 text-faint hover:text-ink" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
