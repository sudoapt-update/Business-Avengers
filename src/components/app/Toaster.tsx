"use client";

import Link from "next/link";
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
        <div
          key={t.id}
          className="animate-toast-in rounded-card border-line bg-panel pointer-events-auto w-full border p-3.5 shadow-lg shadow-black/5"
        >
          <div className="flex items-start gap-3">
            <span className="bg-good-dot mt-1.5 size-2 shrink-0 rounded-full" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.detail && <div className="text-muted mt-0.5 text-[13px]">{t.detail}</div>}
              {(t.chips || t.scoreTo !== undefined) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.chips?.map((c) => (
                    <span key={c} className="tnum bg-hover text-ink-2 rounded-md px-1.5 py-0.5 font-mono text-xs">
                      {c}
                    </span>
                  ))}
                  {t.scoreTo !== undefined && t.scoreFrom !== undefined && (
                    <span className="tnum bg-good-bg text-good rounded-md px-1.5 py-0.5 font-mono text-xs">
                      Score {t.scoreFrom.toFixed(1)} → {t.scoreTo.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
              {t.action && (
                <Link
                  href={t.action.href}
                  onClick={() => dismiss(t.id)}
                  className="text-ink hover:bg-hover mt-2 -ml-1.5 inline-flex h-7 items-center rounded-md px-1.5 text-[13px] font-medium underline underline-offset-2"
                >
                  {t.action.label}
                </Link>
              )}
            </div>
            <button
              className="text-faint hover:bg-hover hover:text-ink -m-1.5 grid size-7 shrink-0 place-items-center rounded-md"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
