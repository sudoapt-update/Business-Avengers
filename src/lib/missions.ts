import { diffDays, type Day } from "./date";
import type { DemoData } from "./types";

export type MissionId =
  | "review-fees"
  | "simulate-order"
  | "add-expenses"
  | "review-leaks"
  | "apply-saving"
  | "check-runway"
  | "ask-adviser";

export interface MissionDef {
  id: MissionId;
  title: string;
  why: string;
  tokens: number;
  xp: number;
  difficulty: "Easy" | "Medium" | "Hard";
  cta: string;
  /** Count-based missions complete when the count is reached. */
  target?: number;
  minutes: number;
}

export const MISSIONS: Record<MissionId, MissionDef> = {
  "review-fees": {
    id: "review-fees",
    title: "Review yesterday's Amazon fees",
    why: "Marketplace fees are your biggest cost after stock.",
    tokens: 10,
    xp: 30,
    difficulty: "Easy",
    cta: "Review fees",
    minutes: 2,
  },
  "simulate-order": {
    id: "simulate-order",
    title: "Sync one new order and check its impact",
    why: "See what a single sale really leaves you after fees.",
    tokens: 20,
    xp: 60,
    difficulty: "Medium",
    cta: "Sync an order",
    minutes: 1,
  },
  "add-expenses": {
    id: "add-expenses",
    title: "Add 3 expenses you paid this week",
    why: "Unrecorded costs make profit look better than it is.",
    tokens: 15,
    xp: 50,
    difficulty: "Medium",
    cta: "Add expenses",
    target: 3,
    minutes: 4,
  },
  "review-leaks": {
    id: "review-leaks",
    title: "Read your largest money leak",
    why: "One cancelled tool can pay for a month of the app.",
    tokens: 10,
    xp: 30,
    difficulty: "Easy",
    cta: "Open leak",
    minutes: 2,
  },
  "apply-saving": {
    id: "apply-saving",
    title: "Apply one savings recommendation",
    why: "Stopping a leak lifts your score straight away.",
    tokens: 25,
    xp: 60,
    difficulty: "Hard",
    cta: "See savings",
    minutes: 5,
  },
  "check-runway": {
    id: "check-runway",
    title: "Check how many weeks your cash lasts",
    why: "Know your cushion before you reorder stock.",
    tokens: 5,
    xp: 25,
    difficulty: "Easy",
    cta: "Check runway",
    minutes: 1,
  },
  "ask-adviser": {
    id: "ask-adviser",
    title: "Ask the AI Adviser one question",
    why: "Earns back more tokens than the question costs.",
    tokens: 10,
    xp: 25,
    difficulty: "Easy",
    cta: "Ask a question",
    minutes: 2,
  },
};

const ROTATION: MissionId[][] = [
  ["review-fees", "simulate-order", "add-expenses", "ask-adviser", "check-runway"],
  ["ask-adviser", "review-leaks", "simulate-order", "check-runway", "add-expenses"],
  ["apply-saving", "review-fees", "simulate-order", "add-expenses", "ask-adviser"],
  ["check-runway", "ask-adviser", "add-expenses", "review-leaks", "simulate-order"],
];

/** The day's missions. Day one of the demo always opens with the same three. */
export function missionsFor(data: DemoData, day: Day, count: number): MissionDef[] {
  const idx = Math.abs(diffDays(day, data.seededOn)) % ROTATION.length;
  const ids = ROTATION[idx].filter((id) => id !== "apply-saving" || data.leaks.some((l) => !l.appliedOn));
  return ids.slice(0, count).map((id) => MISSIONS[id]);
}

export function isDone(data: DemoData, day: Day, id: MissionId) {
  return data.missionLog.some((m) => m.day === day && m.missionId === id);
}

/** Progress for count-based missions, read from the tables themselves. */
export function progressOf(data: DemoData, day: Day, id: MissionId): number {
  if (id === "add-expenses") return data.expenses.filter((e) => e.addedOn === day).length;
  return 0;
}

/** Consecutive days with at least one mission, counting back from today (or yesterday). */
export function streakOf(data: DemoData, today: Day): number {
  const days = new Set(data.missionLog.map((m) => m.day));
  let d = days.has(today) ? 0 : 1;
  let n = 0;
  while (days.has(dayMinus(today, d))) {
    n++;
    d++;
  }
  return n;
}

function dayMinus(day: Day, n: number): Day {
  const [y, m, dd] = day.split("-").map(Number);
  const dt = new Date(y, m - 1, dd - n, 12);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export const LEVELS = [
  { name: "Stable", min: 0 },
  { name: "Growing", min: 200 },
  { name: "Resilient", min: 500 },
  { name: "Thriving", min: 1000 },
];

export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    index: i,
    name: cur.name,
    next: next?.name,
    floor: cur.min,
    ceil: next?.min ?? cur.min,
    progress: next ? (xp - cur.min) / (next.min - cur.min) : 1,
  };
}

export const STREAK_BONUS_FROM = 3;
export const STREAK_BONUS = 0.2;

export const BADGES = {
  "first-sync": { name: "First Order Sync", hint: "Synced your first order" },
  "leak-hunter": { name: "Leak Hunter", hint: "Stopped a money leak" },
  "streak-7": { name: "7-Day Streak", hint: "Seven days in a row" },
  "score-80": { name: "Score 80+", hint: "Health Score reached 80" },
  "level-growing": { name: "Growing", hint: "Reached the Growing level" },
} as const;
