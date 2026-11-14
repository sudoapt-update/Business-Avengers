"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Toaster } from "./Toaster";
import { UpgradeModal } from "./UpgradeModal";
import { Sheets } from "./Sheets";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const pathname = usePathname();
  // The drawer stays open only on the page it was opened from, so navigating closes it.
  const [navOpenOn, setNavOpenOn] = useState<string | null>(null);
  const navOpen = navOpenOn === pathname;

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(() => useStore.getState().init());
  }, []);

  return (
    <div className="min-h-dvh lg:pl-[264px]">
      {hydrated ? (
        <>
          <Sidebar open={navOpen} onClose={() => setNavOpenOn(null)} />
          <TopBar onMenu={() => setNavOpenOn(pathname)} />
        </>
      ) : (
        <>
          <div className="border-line bg-canvas fixed inset-y-0 left-0 hidden w-[264px] border-r lg:block" aria-hidden />
          <div className="border-line h-16 border-b" aria-hidden />
        </>
      )}
      <main className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-16 sm:px-6 lg:px-10">{children}</main>
      {hydrated && (
        <>
          <Sheets />
          <UpgradeModal />
          <Toaster />
        </>
      )}
    </div>
  );
}
