import type { Day } from "./date";

export type Channel = "shopify" | "amazon" | "market";
export type Tier = "starter" | "growth" | "pro" | "scale";

export interface Order {
  id: string;
  ref: string;
  day: Day;
  time: string; // HH:MM
  channel: Channel;
  item: string;
  qty: number;
  gross: number;
  cogs: number;
  platformFee: number;
  paymentFee: number;
  shipping: number;
  source: "synced" | "manual";
  /** Added after the seed snapshot, so it also moves cash. */
  live?: boolean;
}

export type ExpenseCategory =
  | "Software"
  | "Advertising"
  | "Packaging"
  | "Market booth"
  | "Utilities"
  | "Other";

export interface Expense {
  id: string;
  day: Day;
  name: string;
  category: ExpenseCategory;
  amount: number;
  cadence: "monthly" | "one-off";
  /** Day the row was typed in by the seller (manual rows only). */
  addedOn?: Day;
  live?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  units: number;
  unitCost: number;
}

export interface CashAccount {
  id: string;
  name: string;
  note: string;
  balance: number;
}

export interface Leak {
  id: string;
  expenseId: string;
  title: string;
  problem: string;
  alternative: string;
  altPrice: number;
  steps: string[];
  /** Lowest tier that sees the action steps without spending tokens. */
  minTier: Tier;
  unlockCost: number;
  unlockedWithTokens?: boolean;
  appliedOn?: Day;
}

export interface MissionLogEntry {
  id: string;
  missionId: string;
  day: Day;
  tokens: number;
  xp: number;
}

export interface TokenEntry {
  id: string;
  day: Day;
  amount: number;
  reason: string;
}

export interface BadgeEntry {
  id: BadgeId;
  day: Day;
}

export type BadgeId = "first-sync" | "leak-hunter" | "streak-7" | "score-80" | "level-growing";

export interface DemoData {
  version: number;
  seededOn: Day;
  planStart: Day;
  ownerDrawMonthly: number;
  orders: Order[];
  expenses: Expense[];
  inventory: InventoryItem[];
  cash: CashAccount[];
  leaks: Leak[];
  missionLog: MissionLogEntry[];
  tokenLedger: TokenEntry[];
  bookTouches: Day[];
  /** Mission ids marked as reviewed, keyed by day. */
  reviews: { day: Day; missionId: string }[];
  badges: BadgeEntry[];
  orderSeq: number;
}
