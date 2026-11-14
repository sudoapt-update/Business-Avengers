"use client";

import { Award, Check, Clock, Flame, Lock } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { BADGES, STREAK_BONUS_FROM, type MissionDef, type MissionId } from "@/lib/missions";
import { cn } from "@/lib/format";
import type { BadgeId } from "@/lib/types";
import { Button, Card, CardHeader, Caps, Pill, SegmentBar } from "@/components/ui/primitives";

export function useMissionAction() {
  const d = useDerived();
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
        document.getElementById("order-feed")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }
  };
}

export function MissionCard({ m, compact = false }: { m: MissionDef & { done: boolean; progress: number }; compact?: boolean }) {
  const d = useDerived();
  const act = useMissionAction();
  const r = d.reward(m);
  const earned = d.data.missionLog.find((x) => x.day === d.today && x.missionId === m.id);

  return (
    <div className={cn("rounded-card border p-4", m.done ? "border-line bg-canvas" : "border-line bg-panel")}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
            m.done ? "border-good-dot bg-good-dot text-white" : "border-line-strong",
          )}
          aria-hidden
        >
          {m.done && <Check className="size-3" strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-medium", m.done && "text-muted line-through decoration-faint")}>{m.title}</div>
          {!compact && !m.done && <div className="mt-0.5 text-[13px] text-muted">{m.why}</div>}
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
                <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                  <Clock className="size-3" /> {m.minutes} min
                </span>
              </>
            )}
          </div>
          {m.target && !m.done && (
            <div className="mt-3">
              <SegmentBar total={m.target} done={Math.min(m.progress, m.target)} />
              <div className="tnum mt-1 font-mono text-[11px] text-muted">
                {Math.min(m.progress, m.target)} of {m.target} added
              </div>
            </div>
          )}
        </div>
      </div>
      {!m.done && (
        <Button size="sm" variant={compact ? "secondary" : "primary"} className="mt-3 w-full" onClick={() => act(m.id)}>
          {m.cta}
        </Button>
      )}
    </div>
  );
}

export function MissionsRail() {
  const d = useDerived();
  return (
    <Card>
      <CardHeader
        title="Today's missions"
        sub="Five minutes a day. Each one finishes when you actually do it."
        right={
          <span className="tnum shrink-0 font-mono text-[12px] text-muted">
            {d.missionsDone}/{d.missions.length}
          </span>
        }
      />
      <div className="space-y-2.5 p-4 pt-3">
        {d.missions.slice(0, 3).map((m) => (
          <MissionCard key={m.id} m={m} />
        ))}
        {d.missions.length > 3 && (
          <div className="pt-1 text-center text-xs text-muted">+{d.missions.length - 3} more on the Missions page</div>
        )}
      </div>
    </Card>
  );
}

const BADGE_ORDER: BadgeId[] = ["first-sync", "leak-hunter", "level-growing", "streak-7", "score-80"];

export function LevelCard() {
  const d = useDerived();
  const lv = d.level;
  const earned = new Set(d.data.badges.map((b) => b.id));
  const bonusActive = d.streak >= STREAK_BONUS_FROM;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Caps>Financial level</Caps>
          <div className="mt-1.5 text-xl font-semibold tracking-tight">{lv.name}</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[13px]">
          <Flame className={cn("size-3.5", d.doneToday ? "text-bad-dot" : "text-faint")} />
          <span className="tnum font-mono">{d.streak}</span>
          <span className="text-muted">day streak</span>
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={d.xp} aria-valuemin={lv.floor} aria-valuemax={lv.ceil} aria-label="XP to next level">
        <div className="h-full rounded-full bg-linear-to-r from-brand-a to-brand-b transition-[width] duration-700" style={{ width: `${lv.progress * 100}%` }} />
      </div>
      <div className="tnum mt-2 flex justify-between font-mono text-[11px] text-muted">
        <span>
          {d.xp} / {lv.ceil} XP
        </span>
        <span>{lv.next ? `${lv.ceil - d.xp} XP to ${lv.next}` : "Top level"}</span>
      </div>
      <div className="mt-4 rounded-lg bg-canvas px-3 py-2 text-[13px] text-ink-2">
        {bonusActive ? (
          <>
            <span className="font-medium text-ink">+20% tokens</span> on every mission while your streak is {STREAK_BONUS_FROM}+ days.
          </>
        ) : (
          <>Reach a {STREAK_BONUS_FROM}-day streak to earn +20% tokens on every mission.</>
        )}
        {d.tier.rewardMultiplier > 1 && <> {d.tier.name} adds {d.tier.rewardMultiplier}×.</>}
      </div>
      <Caps className="mt-4 mb-2">Badges</Caps>
      <ul className="flex flex-wrap gap-1.5">
        {BADGE_ORDER.map((id) => (
          <li
            key={id}
            title={BADGES[id].hint}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
              earned.has(id) ? "border-line bg-panel text-ink" : "border-dashed border-line text-faint",
            )}
          >
            {earned.has(id) ? <Award className="size-3 text-warn" /> : <Lock className="size-3" />}
            {BADGES[id].name}
          </li>
        ))}
      </ul>
    </Card>
  );
}
