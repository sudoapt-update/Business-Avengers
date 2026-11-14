"use client";

import { useRouter } from "next/navigation";
import {
  Award,
  Bot,
  Check,
  Clock,
  Droplets,
  Flame,
  Hourglass,
  Lock,
  PiggyBank,
  Receipt,
  RefreshCw,
  Search,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { BADGES, STREAK_BONUS_FROM, type MissionDef, type MissionId } from "@/lib/missions";
import { cn } from "@/lib/format";
import type { BadgeId } from "@/lib/types";
import { Button, Card, CardHeader, Caps, IconTile, Pill, SegmentBar, type TileTone } from "@/components/ui/primitives";

export const MISSION_ICON: Record<MissionId, { icon: LucideIcon; tone: TileTone }> = {
  "review-fees": { icon: Search, tone: "warn" },
  "simulate-order": { icon: RefreshCw, tone: "violet" },
  "add-expenses": { icon: Receipt, tone: "info" },
  "review-leaks": { icon: Droplets, tone: "bad" },
  "apply-saving": { icon: PiggyBank, tone: "good" },
  "check-runway": { icon: Hourglass, tone: "warn" },
  "ask-adviser": { icon: Bot, tone: "violet" },
};

/** Fired to ask the Overview to open one of its sections. */
export const OPEN_SECTION_EVENT = "finpath:open-section";

export function useMissionAction() {
  const d = useDerived();
  const router = useRouter();
  const { openSheet, simulateOrder } = useStore.getState();
  return (id: MissionId) => {
    const largest = d.leaks.find((l) => !l.applied);
    switch (id) {
      case "review-fees":
        return openSheet({ kind: "review-fees" });
      case "add-expenses":
        return openSheet({ kind: "add-expense" });
      case "check-runway":
        return openSheet({ kind: "runway" });
      case "review-leaks":
      case "apply-saving":
        return largest && openSheet({ kind: "leak", leakId: largest.leak.id });
      case "simulate-order":
        simulateOrder();
        // The order feed sits in the Money section, which may be closed: ask the page to open it, then scroll once it has.
        window.dispatchEvent(new CustomEvent(OPEN_SECTION_EVENT, { detail: "money" }));
        setTimeout(() => document.getElementById("order-feed")?.scrollIntoView({ behavior: "smooth", block: "center" }), 340);
        return;
      case "ask-adviser":
        return router.push("/app/adviser");
    }
  };
}

/** One mission as a row inside the missions list; `primary` marks the next one to do. */
export function MissionCard({ m, primary = false }: { m: MissionDef & { done: boolean; progress: number }; primary?: boolean }) {
  const d = useDerived();
  const act = useMissionAction();
  const r = d.reward(m);
  const earned = d.data.missionLog.find((x) => x.day === d.today && x.missionId === m.id);
  const Icon = MISSION_ICON[m.id].icon;

  return (
    <li className={cn("px-5 py-4", m.done && "bg-canvas")}>
      <div className="flex items-start gap-3">
        {m.done ? (
          <span className="bg-good-dot animate-pop grid size-7 shrink-0 place-items-center rounded-md text-white" aria-hidden>
            <Check className="size-4" strokeWidth={3} />
          </span>
        ) : (
          <IconTile tone={MISSION_ICON[m.id].tone} size="sm">
            <Icon />
          </IconTile>
        )}
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-medium", m.done && "text-muted decoration-faint line-through")}>{m.title}</div>
          {!m.done && <div className="text-muted mt-0.5 text-[13px]">{m.why}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {m.done && earned ? (
              <Pill tone="good" className="tnum font-mono">
                +{earned.tokens} tokens · +{earned.xp} XP earned
              </Pill>
            ) : (
              <>
                <Pill tone="neutral" className="tnum font-mono">
                  +{r.tokens} tokens · +{r.xp} XP
                </Pill>
                {d.streakBonus && <Pill tone="warn">Streak +20%</Pill>}
                <span className="text-muted inline-flex items-center gap-1 text-xs">
                  <Clock className="size-3" /> {m.minutes} min
                </span>
              </>
            )}
          </div>
          {m.target && !m.done && (
            <div className="mt-3">
              <SegmentBar total={m.target} done={Math.min(m.progress, m.target)} />
              <div className="tnum text-muted mt-1 font-mono text-xs">
                {Math.min(m.progress, m.target)} of {m.target} added
              </div>
            </div>
          )}
        </div>
      </div>
      {!m.done && (
        <Button size="sm" variant={primary ? "primary" : "secondary"} className="mt-3 ml-10" onClick={() => act(m.id)}>
          {m.cta}
        </Button>
      )}
    </li>
  );
}

export function MissionsRail() {
  const d = useDerived();
  const next = d.missions.slice(0, 3).find((m) => !m.done);
  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="warn">
            <Target />
          </IconTile>
        }
        title="Today's missions"
        sub="Five minutes a day. Each one finishes when you actually do it."
        right={
          <span className="tnum text-muted shrink-0 font-mono text-[12px]">
            {d.missionsDone}/{d.missions.length}
          </span>
        }
      />
      <ul className="divide-line border-line mt-3 divide-y border-t">
        {d.missions.slice(0, 3).map((m) => (
          <MissionCard key={m.id} m={m} primary={m.id === next?.id} />
        ))}
      </ul>
      {d.missions.length > 3 && (
        <div className="border-line text-muted border-t px-5 py-2.5 text-xs">+{d.missions.length - 3} more on the Missions page</div>
      )}
    </Card>
  );
}

const BADGE_ORDER: BadgeId[] = ["first-sync", "connected", "leak-hunter", "level-growing", "streak-7", "score-80"];

export function LevelCard() {
  const d = useDerived();
  const lv = d.level;
  const earned = new Set(d.data.badges.map((b) => b.id));
  const bonusActive = d.streak >= STREAK_BONUS_FROM;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile tone="violet" size="lg">
            <Trophy />
          </IconTile>
          <div>
            <Caps>Financial level</Caps>
            <div className="mt-0.5 text-xl leading-tight font-semibold tracking-tight">{lv.name}</div>
          </div>
        </div>
        <span className="border-line inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[13px]">
          <Flame className={cn("size-3.5", d.doneToday ? "text-bad-dot" : "text-faint")} />
          <span className="tnum font-mono">{d.streak}</span>
          <span className="text-muted">day streak</span>
        </span>
      </div>
      <div
        className="bg-line mt-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={d.xp}
        aria-valuemin={lv.floor}
        aria-valuemax={lv.ceil}
        aria-label="XP to next level"
      >
        <div
          className="from-brand-a to-brand-b h-full rounded-full bg-linear-to-r transition-[width] duration-700"
          style={{ width: `${lv.progress * 100}%` }}
        />
      </div>
      <div className="tnum text-muted mt-2 flex justify-between font-mono text-xs">
        <span>
          {d.xp} / {lv.ceil} XP
        </span>
        <span>{lv.next ? `${lv.ceil - d.xp} XP to ${lv.next}` : "Top level"}</span>
      </div>
      <div className="bg-canvas text-ink-2 mt-4 rounded-lg px-3 py-2 text-[13px]">
        {bonusActive ? (
          <>
            <span className="text-ink font-medium">+20% tokens</span> on every mission while your streak is {STREAK_BONUS_FROM}+ days.
          </>
        ) : (
          <>Reach a {STREAK_BONUS_FROM}-day streak to earn +20% tokens on every mission.</>
        )}
        {d.tier.rewardMultiplier > 1 && (
          <>
            {" "}
            {d.tier.name} adds {d.tier.rewardMultiplier}×.
          </>
        )}
      </div>
      <Caps className="mt-4 mb-2">Badges</Caps>
      <ul className="flex flex-wrap gap-1.5">
        {BADGE_ORDER.map((id) => (
          <li
            key={id}
            title={BADGES[id].hint}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs",
              earned.has(id) ? "border-warn-dot/50 bg-warn-bg text-ink" : "border-line text-faint border-dashed",
            )}
          >
            {earned.has(id) ? <Award className="text-warn size-3" /> : <Lock className="size-3" />}
            {BADGES[id].name}
          </li>
        ))}
      </ul>
    </Card>
  );
}
