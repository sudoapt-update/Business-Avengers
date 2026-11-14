"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  BookOpen,
  CreditCard,
  Droplets,
  History,
  LayoutGrid,
  Map,
  Plug,
  ShoppingBag,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
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
        { href: "/app/leaks", label: "Leaks", icon: Droplets, badge: d.metrics.leakCount ? { n: d.metrics.leakCount, tone: "bad" } : undefined },
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
        className={cn("fixed inset-0 z-40 bg-ink/20 lg:hidden", open ? "block animate-fade-in" : "hidden")}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-canvas transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-line px-4">
          <LogoMark />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight">FinPath</div>
            <div className="truncate font-mono text-[11px] text-muted">{STORE.name.replace(" Co.", "")} · demo</div>
          </div>
          <button className="rounded-md p-1.5 text-muted hover:bg-hover lg:hidden" onClick={onClose} aria-label="Close menu">
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
                          active ? "bg-hover font-medium text-ink" : "text-ink-2 hover:bg-hover/70",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="size-4 text-muted" strokeWidth={1.75} />
                        <span className="flex-1">{it.label}</span>
                        {it.badge && (
                          <span
                            className={cn(
                              "tnum min-w-5 rounded-md px-1.5 text-center font-mono text-[11px] leading-5",
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
    <Link href="/app/missions" className="m-3 block rounded-card border border-line bg-panel p-4 hover:border-line-strong">
      <div className="flex items-center justify-between">
        <Caps>Today&apos;s missions</Caps>
        <span className="tnum font-mono text-[11px] text-muted" title="Missions reset at midnight">
          {left}
        </span>
      </div>
      <SegmentBar total={d.missions.length} done={d.missionsDone} className="mt-3" />
      <div className="mt-3 text-sm font-medium">{streakLabel}</div>
      <div className="mt-0.5 font-mono text-[11px] text-muted">
        {d.missionsDone} of {d.missions.length} done · resets at 00:00
      </div>
    </Link>
  );
}
