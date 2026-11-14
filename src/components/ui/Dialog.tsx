"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

/** Accessible modal or side sheet on top of the native <dialog> element. */
export function Dialog({
  open,
  onClose,
  title,
  sub,
  children,
  side = false,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: ReactNode;
  children: ReactNode;
  side?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "backdrop:bg-ink/25 m-0 max-h-dvh max-w-none bg-transparent p-0 backdrop:backdrop-blur-[1px]",
        side ? "ml-auto h-dvh w-full sm:w-[440px]" : "fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-[480px]",
      )}
    >
      {open && (
        <div
          className={cn(
            "border-line bg-panel flex flex-col",
            side ? "animate-sheet-in h-full border-l" : "animate-fade-in rounded-card max-h-[90dvh] border shadow-xl shadow-black/10",
            className,
          )}
        >
          <div className="border-line flex items-start justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              {sub && <p className="text-muted mt-0.5 text-[13px]">{sub}</p>}
            </div>
            <button className="text-muted hover:bg-hover rounded-md p-1" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  );
}
