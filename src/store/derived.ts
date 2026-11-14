"use client";

import { addDays } from "@/lib/date";
import { computeMetrics, history, leaksFor } from "@/lib/engine";
import { STREAK_BONUS, STREAK_BONUS_FROM, isDone, levelOf, missionsFor, progressOf, streakOf, type MissionDef } from "@/lib/missions";
import { tierInfo } from "@/lib/tiers";
import type { DemoData, Tier } from "@/lib/types";
import { tokenBalance, totalXp, useStore } from "./store";

/** Everything the screens show, derived from the stored tables in one place. */
export function useDerived() {
  const data = useStore((s) => s.data)!;
  const tier = useStore((s) => s.tier);
  // dayOffset is read so components re-render after "Advance to tomorrow".
  useStore((s) => s.dayOffset);
  const today = useStore((s) => s.today)();
  return derive(data, tier, today);
}

export type Derived = ReturnType<typeof compute>;

// Many components call useDerived at once. One shared cache entry means the 90-day
// history is computed once per change to the data, not once per component.
let cache: { data: DemoData; tier: Tier; today: string; value: Derived } | null = null;

function derive(data: DemoData, tier: Tier, today: string): Derived {
  if (cache && cache.data === data && cache.tier === tier && cache.today === today) return cache.value;
  const value = compute(data, tier, today);
  cache = { data, tier, today, value };
  return value;
}

function compute(data: DemoData, tier: Tier, today: string) {
  const metrics = computeMetrics(data, today, today);
  const hist = history(data, today, 90);
  const prev = computeMetrics(data, addDays(today, -30), today);
  const leaks = leaksFor(data, today);
  const t = tierInfo(tier);
  const missions = missionsFor(data, today, t.missionsPerDay).map((m) => ({
    ...m,
    done: isDone(data, today, m.id),
    progress: progressOf(data, today, m.id),
  }));
  const xp = totalXp(data);
  const streak = streakOf(data, today);
  const doneToday = data.missionLog.some((m) => m.day === today);
  const streakBonus = (doneToday ? streak : streak + 1) >= STREAK_BONUS_FROM;
  /** What a mission pays right now: same math as the reward function in the store. */
  const reward = (m: Pick<MissionDef, "tokens" | "xp">) => ({
    tokens: Math.round(m.tokens * t.rewardMultiplier * (streakBonus ? 1 + STREAK_BONUS : 1)),
    xp: Math.round(m.xp * t.rewardMultiplier),
  });
  return {
    data,
    today,
    tier: t,
    metrics,
    prev,
    hist,
    leaks,
    missions,
    missionsDone: missions.filter((m) => m.done).length,
    streak,
    doneToday,
    streakBonus,
    reward,
    xp,
    level: levelOf(xp),
    tokens: tokenBalance(data, tier),
  };
}
