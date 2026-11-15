import type { Tier } from "./types";

export interface TierInfo {
  id: Tier;
  name: string;
  price: number;
  tokens: number;
  missionsPerDay: number;
  rewardMultiplier: number;
  /** How many Time Machine changes can be combined in one scenario. */
  whatIfLevers: number;
  blurb: string;
  adds: string[];
}

export const TIERS: TierInfo[] = [
  {
    id: "starter",
    whatIfLevers: 1,
    name: "Starter",
    price: 0,
    tokens: 50,
    missionsPerDay: 3,
    rewardMultiplier: 1,
    blurb: "Trying the product",
    adds: ["Basic Health Score", "3 missions a day", "50 AI tokens a month", "Basic leak list"],
  },
  {
    id: "growth",
    whatIfLevers: 2,
    name: "Growth",
    price: 19,
    tokens: 500,
    missionsPerDay: 5,
    rewardMultiplier: 1.25,
    blurb: "Active sellers",
    adds: ["Full leak detector with action steps", "500 AI tokens a month", "5 missions a day, 1.25× rewards", "90-day score history"],
  },
  {
    id: "pro",
    whatIfLevers: 4,
    name: "Pro",
    price: 39,
    tokens: 2000,
    missionsPerDay: 5,
    rewardMultiplier: 1.5,
    blurb: "Serious growth",
    adds: ["Everything in Growth", "2,000 AI tokens a month", "1.5× mission rewards", "Export and Wrapped (soon)"],
  },
  {
    id: "scale",
    whatIfLevers: 4,
    name: "Scale",
    price: 79,
    tokens: 8000,
    missionsPerDay: 5,
    rewardMultiplier: 2,
    blurb: "Higher volume sellers",
    adds: ["Everything in Pro", "8,000 AI tokens a month", "2× mission rewards", "Multi-store (soon)"],
  },
];

export const tierInfo = (t: Tier) => TIERS.find((x) => x.id === t)!;
export const tierRank = (t: Tier) => TIERS.findIndex((x) => x.id === t);
export const nextTier = (t: Tier) => TIERS[Math.min(tierRank(t) + 1, TIERS.length - 1)];
