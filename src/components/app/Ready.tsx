"use client";

import type { ReactNode } from "react";
import { useStore } from "@/store/store";

/** Renders its children once the demo store has loaded from this browser. */
export function Ready({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted" role="status">
        Loading the sample store…
      </div>
    );
  }
  return <>{children}</>;
}
