"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, Coins, Flame, FlaskConical, Menu, RotateCcw, SunMedium } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { STORE } from "@/lib/seed";
import { TIERS, nextTier } from "@/lib/tiers";
import { longDay } from "@/lib/date";
import { cn, num } from "@/lib/format";
import { Button, Caps } from "@/components/ui/primitives";

const TITLES: Record<string, string> = {
  "/app": "Overview",
  "/app/missions": "Missions",
  "/app/orders": "Orders",
  "/app/books": "Books",
  "/app/leaks": "Leaks",
  "/app/time-machine": "Time Machine",
  "/app/adviser": "AI Adviser",
  "/app/connections": "Connections",
  "/app/plans": "Plans",
};

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const d = useDerived();
  const openUpgrade = useStore((s) => s.openUpgrade);
  const up = nextTier(d.tier.id);

  return (
    <header className="border-line bg-canvas/90 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
      <button className="text-ink-2 hover:bg-hover -ml-1 rounded-md p-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        <span className="text-muted truncate">{STORE.name}</span>
        <ChevronRight className="text-faint size-3.5" />
        <span className="truncate font-medium">{TITLES[pathname] ?? "FinPath"}</span>
      </nav>
      <span
        className="border-line bg-panel text-muted inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs"
        title="Everything here is sample data"
      >
        <span className="bg-warn-dot size-1.5 rounded-full" /> Demo data
      </span>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <span
          className="tnum border-line bg-panel inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[13px]"
          title={`${d.tokens} AI tokens left (${num(d.tier.tokens)} a month on ${d.tier.name})`}
          aria-label={`${d.tokens} tokens`}
        >
          <Coins className="text-warn size-3.5" />
          {num(d.tokens)}
        </span>
        <span
          className="tnum border-line bg-panel inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[13px]"
          title={d.doneToday ? `${d.streak}-day streak` : `${d.streak}-day streak. Complete a mission today to keep it.`}
          aria-label={`${d.streak} day streak`}
        >
          <Flame className={cn("size-3.5", d.doneToday ? "text-bad-dot" : "text-faint")} />
          {d.streak}
        </span>
        <span className="border-line bg-panel hidden h-8 items-center gap-2 rounded-lg border pr-1 pl-2.5 text-[13px] md:inline-flex">
          <span className="font-medium">{d.tier.name}</span>
          {d.tier.id !== "scale" && (
            <button
              className="bg-ink hover:bg-ink-2 rounded-md px-2 py-0.5 text-xs font-medium text-white"
              onClick={() =>
                openUpgrade({ title: `Move up to ${up.name}`, body: `${up.name} is $${up.price}/mo and is what active sellers use.` })
              }
            >
              Upgrade
            </button>
          )}
        </span>
        <AvatarMenu />
      </div>
    </header>
  );
}

function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tier = useStore((s) => s.tier);
  const { setTier, advanceDay, reset } = useStore.getState();
  const today = useStore((s) => s.today)();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-hover";

  return (
    <div className="relative" ref={ref}>
      <button
        className="bg-ink grid size-9 place-items-center rounded-full text-xs font-semibold text-white"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account and demo controls"
      >
        {STORE.initials}
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-in rounded-card border-line bg-panel absolute right-0 mt-2 w-72 border p-1.5 shadow-lg shadow-black/5"
        >
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="text-sm font-medium">{STORE.owner}</span>
            <span className="text-muted font-mono text-xs">owner</span>
          </div>
          <div className="border-line my-1 border-t" />
          <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
            <FlaskConical className="text-info size-3.5" />
            <Caps>Demo controls</Caps>
          </div>
          <p className="text-muted px-2.5 pb-1.5 text-xs">For judges: these exist only in the demo.</p>
          <button role="menuitem" className={item} onClick={() => advanceDay()}>
            <SunMedium className="text-muted size-4" />
            <span className="flex-1">Advance to tomorrow</span>
          </button>
          <div className="text-muted px-2.5 pt-1.5 pb-1 font-mono text-xs">Today in demo: {longDay(today)}</div>
          <div className="text-ink-2 px-2.5 pt-2 pb-1 text-xs font-medium">View as tier</div>
          <div className="grid grid-cols-2 gap-1 px-1.5 pb-1">
            {TIERS.map((t) => (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={tier === t.id}
                className={cn(
                  "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm",
                  tier === t.id ? "border-ink bg-hover" : "border-line hover:bg-hover",
                )}
                onClick={() => setTier(t.id)}
              >
                {t.name}
                {tier === t.id && <Check className="size-3.5" />}
              </button>
            ))}
          </div>
          <div className="border-line my-1 border-t" />
          <button
            role="menuitem"
            className={cn(item, "text-bad")}
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            <RotateCcw className="size-4" />
            Reset demo
          </button>
        </div>
      )}
    </div>
  );
}

export function UpgradeButton({ className }: { className?: string }) {
  const openUpgrade = useStore((s) => s.openUpgrade);
  return (
    <Button
      variant="primary"
      size="sm"
      className={className}
      onClick={() => openUpgrade({ title: "Unlock everything on Growth", body: "Every leak, full history and 500 tokens a month." })}
    >
      Upgrade
    </Button>
  );
}
