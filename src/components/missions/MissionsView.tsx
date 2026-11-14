"use client";

import { useEffect } from "react";
import {
  Award,
  Check,
  Coins,
  Droplets,
  Flame,
  HeartPulse,
  History,
  Lock,
  Map,
  Plug,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { diffDays, formatDay } from "@/lib/date";
import { BADGES, MISSIONS, STREAK_BONUS_FROM, missionsFor, type MissionId } from "@/lib/missions";
import { TIERS, nextTier } from "@/lib/tiers";
import { cn } from "@/lib/format";
import type { BadgeId } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, CardHeader, Caps, IconTile, Pill, SegmentBar, type TileTone } from "@/components/ui/primitives";
import { MISSION_ICON, MissionCard } from "@/components/overview/Missions";
import { PHASES } from "@/components/overview/Plan";

const BADGE_META: Record<BadgeId, { icon: LucideIcon; tone: TileTone }> = {
  "first-sync": { icon: RefreshCw, tone: "violet" },
  connected: { icon: Plug, tone: "info" },
  "leak-hunter": { icon: Droplets, tone: "bad" },
  "level-growing": { icon: TrendingUp, tone: "good" },
  "streak-7": { icon: Flame, tone: "warn" },
  "score-80": { icon: HeartPulse, tone: "info" },
};
const BADGE_ORDER = Object.keys(BADGE_META) as BadgeId[];
/** The most missions any plan gets in a day. */
const MAX_PER_DAY = Math.max(...TIERS.map((t) => t.missionsPerDay));

export function MissionsView() {
  const d = useDerived();
  const openUpgrade = useStore((s) => s.openUpgrade);

  // The sidebar's "90-day plan" link points at #plan. The page only renders after the demo store
  // loads, which is after the browser's own jump to the anchor, so make that jump here.
  useEffect(() => {
    if (window.location.hash === "#plan") document.getElementById("plan")?.scrollIntoView({ block: "start" });
  }, []);

  const earnedToday = d.data.missionLog.filter((m) => m.day === d.today);
  const tokensToday = earnedToday.reduce((s, m) => s + m.tokens, 0);
  const xpToday = earnedToday.reduce((s, m) => s + m.xp, 0);
  const next = d.missions.find((m) => !m.done);
  const locked = missionsFor(d.data, d.today, MAX_PER_DAY).slice(d.missions.length);
  const up = nextTier(d.tier.id);
  const bonusOn = d.streak >= STREAK_BONUS_FROM;
  const lv = d.level;

  return (
    <>
      <PageHeader title="Missions" sub="Today's five-minute tasks, the 90-day plan they add up to, and what you have earned so far." />
      <div className="space-y-4">
        <Explainer>
          A mission is one small piece of real bookkeeping: read a fee breakdown, record what you spent, stop a leak. It finishes when you
          do the work, not when you tick a box. Each one pays AI tokens you can spend on the Adviser, and XP toward your Financial Level.
          Missions change every day at midnight.
        </Explainer>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="warn" size="sm">
                <Target />
              </IconTile>
              <Caps>Done today</Caps>
            </div>
            <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
              {d.missionsDone}
              <span className="text-muted ml-1 text-base font-medium">of {d.missions.length}</span>
            </div>
            <SegmentBar total={d.missions.length} done={d.missionsDone} className="mt-3.5" />
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="bad" size="sm">
                <Flame />
              </IconTile>
              <Caps>Streak</Caps>
            </div>
            <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
              {d.streak}
              <span className="text-muted ml-1 text-base font-medium">day{d.streak === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              <Pill tone={bonusOn ? "warn" : "neutral"}>{bonusOn ? "+20% tokens on" : `+20% at ${STREAK_BONUS_FROM} days`}</Pill>
              <span className="text-muted">{d.doneToday ? "kept today" : "do one to keep it"}</span>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="good" size="sm">
                <Coins />
              </IconTile>
              <Caps>Earned today</Caps>
            </div>
            <div className="tnum mt-3 text-[28px] leading-none font-semibold tracking-tight">
              +{tokensToday}
              <span className="text-muted ml-1 text-base font-medium">tokens</span>
            </div>
            <div className="text-muted mt-3 text-[13px]">
              <span className="tnum font-mono">+{xpToday} XP</span> · balance <span className="tnum font-mono">{d.tokens}</span> tokens
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <IconTile tone="violet" size="sm">
                <Trophy />
              </IconTile>
              <Caps>Financial level</Caps>
            </div>
            <div className="mt-3 text-[28px] leading-none font-semibold tracking-tight">{lv.name}</div>
            <div
              className="bg-line mt-3.5 h-1.5 overflow-hidden rounded-full"
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
            <div className="tnum text-muted mt-1.5 font-mono text-xs">{lv.next ? `${lv.ceil - d.xp} XP to ${lv.next}` : "Top level"}</div>
          </Card>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-7">
            <Card className="overflow-hidden">
              <CardHeader
                icon={
                  <IconTile tone="warn">
                    <Target />
                  </IconTile>
                }
                title="Today's missions"
                sub={`${d.tier.name} plan: ${d.tier.missionsPerDay} a day${d.tier.rewardMultiplier > 1 ? `, ${d.tier.rewardMultiplier}× rewards` : ""}.`}
                right={
                  <span className="tnum text-muted shrink-0 font-mono text-[12px]">
                    {d.missionsDone}/{d.missions.length}
                  </span>
                }
              />
              <ul className="divide-line border-line mt-3 divide-y border-t">
                {d.missions.map((m) => (
                  <MissionCard key={m.id} m={m} primary={m.id === next?.id} />
                ))}
                {locked.map((m) => {
                  const Icon = MISSION_ICON[m.id].icon;
                  return (
                    <li key={m.id} className="bg-canvas flex items-start gap-3 px-5 py-4">
                      <IconTile tone="neutral" size="sm">
                        <Icon />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink-2 text-sm font-medium">{m.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Pill tone="neutral" className="tnum font-mono">
                            +{Math.round(m.tokens * up.rewardMultiplier)} tokens · +{Math.round(m.xp * up.rewardMultiplier)} XP
                          </Pill>
                          <span className="bg-ink inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-white">
                            <Lock className="size-3" aria-hidden /> {up.name}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          openUpgrade({
                            title: `${up.missionsPerDay} missions a day on ${up.name}`,
                            body: `${up.name} adds ${up.missionsPerDay - d.tier.missionsPerDay} more missions each day and pays ${up.rewardMultiplier}× tokens and XP on all of them.`,
                          })
                        }
                      >
                        See {up.name}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {d.missionsDone === d.missions.length && (
                <p className="border-line bg-good-bg text-ink-2 border-t px-5 py-3 text-[13px]">
                  All of today&apos;s missions are done. New ones arrive at midnight.
                </p>
              )}
            </Card>

            <BadgesCard />
          </div>

          <div className="min-w-0 space-y-4 lg:col-span-5">
            <PlanTimeline />
            <ActivityCard />
          </div>
        </div>
      </div>
    </>
  );
}

function PlanTimeline() {
  const d = useDerived();
  const day = Math.min(90, diffDays(d.today, d.data.planStart) + 1);
  const phase = Math.max(
    0,
    PHASES.findIndex((p) => day <= p.days[1]),
  );
  const score = d.metrics.score;

  return (
    <Card>
      <span id="plan" className="block scroll-mt-24" />
      <CardHeader
        icon={
          <IconTile tone="info">
            <Map />
          </IconTile>
        }
        title="Your 90-day plan"
        sub={`Day ${day} of 90 · score ${score.toFixed(1)} now, 80 at the end`}
      />
      <div className="px-5 pt-4">
        <div className="bg-line h-2 overflow-hidden rounded-full" aria-hidden>
          <div className="from-brand-a to-brand-b h-full rounded-full bg-linear-to-r" style={{ width: `${(day / 90) * 100}%` }} />
        </div>
        <div className="tnum text-muted mt-1.5 flex justify-between font-mono text-xs">
          <span>Day 1</span>
          <span>{90 - day} days left</span>
          <span>Day 90</span>
        </div>
      </div>
      <ol className="px-5 pt-5 pb-5">
        {PHASES.map((p, i) => {
          const state = i < phase ? "done" : i === phase ? "now" : "later";
          const reached = score >= p.milestone;
          const inPhase = Math.min(30, Math.max(0, day - p.days[0] + 1));
          return (
            <li key={p.name} className="relative flex gap-4 pb-6 last:pb-0">
              {i < PHASES.length - 1 && (
                <span
                  className={cn("absolute top-8 bottom-0 left-[15px] w-px", state === "done" ? "bg-good-dot" : "bg-line")}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "tnum relative grid size-8 shrink-0 place-items-center rounded-full font-mono text-[13px] font-medium",
                  state === "done" && "bg-good-dot text-white",
                  state === "now" && "bg-info-bg text-info ring-info-dot ring-2",
                  state === "later" && "bg-hover text-muted",
                )}
                aria-hidden
              >
                {state === "done" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum text-muted font-mono text-xs">
                    Days {p.days[0]}–{p.days[1]}
                  </span>
                  {state === "now" && <Pill tone="info">Now</Pill>}
                  {state === "done" && <Pill tone="good">Done</Pill>}
                  {state === "later" && <Pill tone="neutral">Later</Pill>}
                </div>
                <div className={cn("mt-1 text-sm font-semibold tracking-tight", state === "later" && "text-ink-2")}>{p.name}</div>
                <p className="text-muted mt-0.5 text-[13px]">{p.goal}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("tnum rounded-md px-1.5 py-0.5 font-mono", reached ? "bg-good-bg text-good" : "bg-hover text-ink-2")}>
                    Milestone: score {p.milestone}
                  </span>
                  {state === "now" && (
                    <span className="text-muted">
                      {reached ? "reached" : `${(p.milestone - score).toFixed(1)} points to go`} · day {inPhase} of 30
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function BadgesCard() {
  const d = useDerived();
  const earned = new globalThis.Map(d.data.badges.map((b) => [b.id, b.day]));

  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="warn">
            <Award />
          </IconTile>
        }
        title="Badges"
        sub={`${earned.size} of ${BADGE_ORDER.length} earned`}
      />
      <ul className="grid gap-3 p-5 sm:grid-cols-2">
        {BADGE_ORDER.map((id) => {
          const meta = BADGE_META[id];
          const Icon = meta.icon;
          const day = earned.get(id);
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                day ? "border-line bg-panel" : "border-line-strong border-dashed",
              )}
            >
              <IconTile tone={day ? meta.tone : "neutral"} size="lg" className={cn(!day && "opacity-60")}>
                {day ? <Icon /> : <Lock />}
              </IconTile>
              <div className="min-w-0">
                <div className={cn("text-sm font-medium", !day && "text-ink-2")}>{BADGES[id].name}</div>
                <div className="text-muted text-xs">{day ? `Earned ${formatDay(day)}` : BADGES[id].todo}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ActivityCard() {
  const d = useDerived();
  // The log is oldest first; reversing it before the (stable) date sort puts the newest first within each day.
  const rows = [...d.data.missionLog]
    .reverse()
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="neutral">
            <History />
          </IconTile>
        }
        title="Recent activity"
        sub="Missions you finished and what each one paid."
      />
      <ul className="divide-line border-line mt-3 divide-y border-t">
        {rows.map((r) => {
          const def = MISSIONS[r.missionId as MissionId];
          const meta = MISSION_ICON[r.missionId as MissionId];
          const Icon = meta?.icon ?? Check;
          return (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <IconTile tone={meta?.tone ?? "neutral"} size="sm">
                <Icon />
              </IconTile>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm" title={def?.title}>
                  {def?.title ?? "Mission"}
                </div>
                <div className="text-muted font-mono text-xs">{r.day === d.today ? "Today" : formatDay(r.day)}</div>
              </div>
              <Pill tone="good" className="tnum shrink-0 font-mono">
                +{r.tokens} tokens · +{r.xp} XP
              </Pill>
            </li>
          );
        })}
        {rows.length === 0 && <li className="text-muted px-5 py-6 text-sm">No missions finished yet. Start with the first one today.</li>}
      </ul>
    </Card>
  );
}
