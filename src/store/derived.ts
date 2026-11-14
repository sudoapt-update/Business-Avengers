"use client";

import { useMemo } from "react";
import { addDays } from "@/lib/date";
import { computeMetrics, history, leaksFor } from "@/lib/engine";
import { STREAK_BONUS, STREAK_BONUS_FROM, isDone, levelOf, missionsFor, progressOf, streakOf, type MissionDef } from "@/lib/missions";
import { tierInfo } from "@/lib/tiers";
import { tokenBalance, totalXp, useStore } from "./store";

/** Everything the screens show, derived from the stored tables in one place. */
export function useDerived() {
  const data = useStore((s) => s.data)!;
  const tier = useStore((s) => s.tier);
  const dayOffset = useStore((s) => s.dayOffset);
  const today = useStore((s) => s.today)();

  return useMemo(() => {
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
    // dayOffset is part of `today`; listed so the memo refreshes after "Advance to tomorrow".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tier, today, dayOffset]);
}

