"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, BookOpen, CreditCard, Droplets, History, LayoutGrid, Map, Plug, ShoppingBag, Target, X, type LucideIcon } from "lucide-react";
import { useDerived } from "@/store/derived";
import { STORE } from "@/lib/seed";
import { cn } from "@/lib/format";
import { Caps, SegmentBar } from "@/components/ui/primitives";
import { LogoMark } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: { n: number; tone: "neutral" | "warn" | "bad" };
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useDerived();
  const pathname = usePathname();
  const remaining = d.missions.length - d.missionsDone;

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Today",
      items: [
        { href: "/app", label: "Overview", icon: LayoutGrid },
        { href: "/app/missions", label: "Missions", icon: Target, badge: remaining ? { n: remaining, tone: "warn" } : undefined },
        { href: "/app/missions#plan", label: "90-day plan", icon: Map },
      ],
    },
    {
      label: "Money",
      items: [
        { href: "/app/orders", label: "Orders", icon: ShoppingBag },
        { href: "/app/books", label: "Books", icon: BookOpen },
        {
          href: "/app/leaks",
          label: "Leaks",
          icon: Droplets,
          badge: d.metrics.leakCount ? { n: d.metrics.leakCount, tone: "bad" } : undefined,
        },
        { href: "/app/time-machine", label: "Time Machine", icon: History },
      ],
    },
    {
      label: "Help",
      items: [
        { href: "/app/adviser", label: "AI Adviser", icon: Bot },
        { href: "/app/connections", label: "Connections", icon: Plug },
      ],
    },
    { label: "Account", items: [{ href: "/app/plans", label: "Plans", icon: CreditCard }] },
  ];

  return (
    <>
      <div
        className={cn("bg-ink/20 fixed inset-0 z-40 lg:hidden", open ? "animate-fade-in block" : "hidden")}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "border-line bg-canvas fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r transition-[transform,visibility] duration-200 lg:visible lg:translate-x-0",
          // Hidden (not just off-screen) when closed on small screens, so its links leave the tab order.
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="border-line flex h-16 items-center gap-3 border-b px-4">
          <LogoMark />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight">FinPath</div>
            <div className="text-muted truncate font-mono text-xs">{STORE.name.replace(" Co.", "")} · demo</div>
          </div>
          <button className="text-muted hover:bg-hover rounded-md p-1.5 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <Caps className="mb-1.5 px-2.5">{g.label}</Caps>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.href === "/app" ? pathname === "/app" : pathname === it.href.split("#")[0] && !it.href.includes("#");
                  const Icon = it.icon;
                  return (
                    <li key={it.label}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                          active ? "bg-hover text-ink font-medium" : "text-ink-2 hover:bg-hover/70",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="text-muted size-4" strokeWidth={1.75} />
                        <span className="flex-1">{it.label}</span>
                        {it.badge && (
                          <span
                            className={cn(
                              "tnum min-w-5 rounded-md px-1.5 text-center font-mono text-xs leading-5",
                              it.badge.tone === "warn" && "bg-warn-bg text-warn",
                              it.badge.tone === "bad" && "bg-bad-bg text-bad",
                              it.badge.tone === "neutral" && "bg-hover text-muted",
                            )}
                          >
                            {it.badge.n}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <MissionsWidget />
      </aside>
    </>
  );
}

function untilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

function MissionsWidget() {
  const d = useDerived();
  const [left, setLeft] = useState(untilMidnight);
  useEffect(() => {
    const t = setInterval(() => setLeft(untilMidnight()), 30_000);
    return () => clearInterval(t);
  }, []);
  const streakLabel = d.doneToday ? `Day ${d.streak} streak` : d.streak ? `${d.streak}-day streak, keep it today` : "Start a streak today";

  return (
    <Link href="/app/missions" className="rounded-card border-line bg-panel hover:border-line-strong m-3 block border p-4">
      <div className="flex items-center justify-between">
        <Caps>Today&apos;s missions</Caps>
        <span className="tnum text-muted font-mono text-xs" title="Missions reset at midnight">
          {left}
        </span>
      </div>
      <SegmentBar total={d.missions.length} done={d.missionsDone} className="mt-3" />
      <div className="mt-3 text-sm font-medium">{streakLabel}</div>
      <div className="text-muted mt-0.5 font-mono text-xs">
        {d.missionsDone} of {d.missions.length} done · resets at 00:00
      </div>
    </Link>
  );
}
