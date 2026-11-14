"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, realToday, type Day } from "@/lib/date";
import { computeMetrics } from "@/lib/engine";
import {
  BADGES,
  MISSIONS,
  STREAK_BONUS,
  STREAK_BONUS_FROM,
  isDone,
  levelOf,
  missionsFor,
  progressOf,
  streakOf,
  type MissionId,
} from "@/lib/missions";
import { PRODUCTS, buildOrder, createSeed, ordersForDay, pickChannel, rng } from "@/lib/seed";
import { tierInfo, tierRank } from "@/lib/tiers";
import type { BadgeId, ChatEntry, DemoData, Expense, Tier } from "@/lib/types";
import { ADVISER_COST, MAX_QUESTION, buildContext, fallbackAnswer } from "@/lib/adviser";

export interface Toast {
  id: number;
  title: string;
  detail?: string;
  chips?: string[];
  scoreFrom?: number;
  scoreTo?: number;
}

export type UpgradeReason = { title: string; body: string } | null;
export type Sheet = null | { kind: "review-fees" } | { kind: "add-expense" } | { kind: "runway" } | { kind: "leak"; leakId: string };

interface State {
  data: DemoData | null;
  tier: Tier;
  dayOffset: number;
  // UI only, not persisted
  hydrated: boolean;
  toasts: Toast[];
  upgrade: UpgradeReason;
  sheet: Sheet;
  lastOrderId: string | null;
  lastImpact: { orderId: string; scoreFrom: number; scoreTo: number; profit: number; cash: number } | null;
  adviserBusy: boolean;

  today: () => Day;
  init: () => void;
  reset: () => void;
  advanceDay: () => void;
  setTier: (t: Tier) => void;
  simulateOrder: () => void;
  addExpense: (e: Pick<Expense, "name" | "category" | "amount" | "cadence">) => void;
  addSale: (s: { product: string; qty: number; price: number; card: boolean }) => void;
  updateExpenseAmount: (id: string, amount: number) => void;
  deleteRow: (kind: "order" | "expense", id: string) => void;
  recountCash: (id: string, balance: number) => void;
  recountStock: (id: string, units: number) => void;
  askAdviser: (question: string) => Promise<void>;
  markReviewed: (id: MissionId) => void;
  unlockLeak: (leakId: string) => boolean;
  applyLeak: (leakId: string) => void;
  spendTokens: (amount: number, reason: string) => boolean;
  openSheet: (s: Sheet) => void;
  openUpgrade: (r: UpgradeReason) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;

export const tokenBalance = (data: DemoData, tier: Tier) => tierInfo(tier).tokens + data.tokenLedger.reduce((s, t) => s + t.amount, 0);
export const totalXp = (data: DemoData) => data.missionLog.reduce((s, m) => s + m.xp, 0);
export const leakUnlocked = (tier: Tier, l: DemoData["leaks"][number]) => tierRank(tier) >= tierRank(l.minTier) || !!l.unlockedWithTokens;

export const useStore = create<State>()(
  persist(
    (set, get) => {
      /** Apply a change to the data and return the score before and after. */
      const mutate = (fn: (d: DemoData) => DemoData) => {
        const { data } = get();
        if (!data) return { from: 0, to: 0, next: null as DemoData | null };
        const today = get().today();
        const from = computeMetrics(data, today, today).score;
        const next = fn(data);
        set({ data: next });
        const to = computeMetrics(next, today, today).score;
        return { from, to, next };
      };

      const pushToast = (t: Omit<Toast, "id">) => {
        const toast = { ...t, id: toastSeq++ };
        set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }));
        setTimeout(() => get().dismissToast(toast.id), 5200);
      };

      const award = (d: DemoData, id: BadgeId, day: Day): DemoData =>
        d.badges.some((b) => b.id === id) ? d : { ...d, badges: [...d.badges, { id, day }] };

      /** Any hand edit to the tables: applies it, marks the books as updated today and reports the score change. */
      const editBooks = (fn: (d: DemoData) => DemoData, title: string) => {
        const today = get().today();
        const { from, to } = mutate((d) => {
          const next = fn(d);
          return next.bookTouches.includes(today) ? next : { ...next, bookTouches: [...next.bookTouches, today] };
        });
        const moved = Math.abs(from - to) >= 0.05;
        pushToast({ title, detail: "Books updated.", scoreFrom: moved ? from : undefined, scoreTo: moved ? to : undefined });
      };

      /**
       * The one reward function. Every mission completion goes through here:
       * tokens, XP, streak, badges and the toast all update together.
       */
      const grantReward = (missionId: MissionId, scoreFrom?: number) => {
        const { data, tier } = get();
        if (!data) return;
        const today = get().today();
        const todays = missionsFor(data, today, tierInfo(tier).missionsPerDay);
        if (!todays.some((m) => m.id === missionId) || isDone(data, today, missionId)) return;

        const def = MISSIONS[missionId];
        const mult = tierInfo(tier).rewardMultiplier;
        const streakBefore = streakOf(data, today);
        const doneToday = data.missionLog.some((m) => m.day === today);
        const streakAfter = doneToday ? streakBefore : streakBefore + 1;
        const bonus = streakAfter >= STREAK_BONUS_FROM ? 1 + STREAK_BONUS : 1;
        const tokens = Math.round(def.tokens * mult * bonus);
        const xp = Math.round(def.xp * mult);
        const xpBefore = totalXp(data);

        let next: DemoData = {
          ...data,
          missionLog: [...data.missionLog, { id: `m${Date.now()}`, missionId, day: today, tokens, xp }],
          tokenLedger: [...data.tokenLedger, { id: `t${Date.now()}`, day: today, amount: tokens, reason: `Mission: ${def.title}` }],
        };
        const lvlBefore = levelOf(xpBefore);
        const lvlAfter = levelOf(xpBefore + xp);
        if (streakAfter >= 7) next = award(next, "streak-7", today);
        if (lvlAfter.index >= 1) next = award(next, "level-growing", today);
        if (computeMetrics(next, today, today).score >= 80) next = award(next, "score-80", today);
        const newBadges = next.badges.filter((b) => !data.badges.some((x) => x.id === b.id));
        set({ data: next });

        const scoreTo = computeMetrics(next, today, today).score;
        pushToast({
          title: `Mission complete · ${def.title}`,
          chips: [
            `+${tokens} tokens${bonus > 1 ? " (streak +20%)" : ""}`,
            `+${xp} XP`,
            `Streak: ${streakAfter} day${streakAfter === 1 ? "" : "s"}`,
          ],
          scoreFrom: scoreFrom !== undefined && scoreFrom !== scoreTo ? scoreFrom : undefined,
          scoreTo: scoreFrom !== undefined && scoreFrom !== scoreTo ? scoreTo : undefined,
        });
        if (lvlAfter.index > lvlBefore.index) {
          pushToast({ title: `Level up · You reached ${lvlAfter.name}`, detail: "Your Financial Level moved up a step." });
        }
        for (const b of newBadges) pushToast({ title: `Badge earned · ${BADGES[b.id].name}`, detail: BADGES[b.id].hint });
      };

      return {
        data: null,
        tier: "starter",
        dayOffset: 0,
        hydrated: false,
        toasts: [],
        upgrade: null,
        sheet: null,
        lastOrderId: null,
        lastImpact: null,
        adviserBusy: false,

        today: () => addDays(realToday(), get().dayOffset),

        init: () => {
          if (!get().data) set({ data: createSeed(realToday()), dayOffset: 0 });
          set({ hydrated: true });
        },

        reset: () =>
          set({
            data: createSeed(realToday()),
            tier: "starter",
            dayOffset: 0,
            toasts: [],
            sheet: null,
            upgrade: null,
            lastOrderId: null,
            lastImpact: null,
          }),

        advanceDay: () => {
          const { data } = get();
          if (!data) return;
          const newDay = addDays(get().today(), 1);
          const overnight = ordersForDay(newDay, data.orderSeq, 1.1, 7000 + data.orderSeq, 11).map((o) => ({
            ...o,
            live: true,
            at: Date.now(),
          }));
          set({
            dayOffset: get().dayOffset + 1,
            data: { ...data, orders: [...data.orders, ...overnight], orderSeq: data.orderSeq + overnight.length + 2 },
            lastOrderId: null,
            lastImpact: null,
          });
          pushToast({
            title: "Advanced to tomorrow",
            detail: `${overnight.length} order${overnight.length === 1 ? "" : "s"} synced overnight. New missions are ready.`,
          });
        },

        setTier: (t) => {
          set({ tier: t });
          pushToast({ title: `Viewing as ${tierInfo(t).name}`, detail: "Limits, allowance and rewards now follow this plan." });
        },

        simulateOrder: () => {
          const { data } = get();
          if (!data) return;
          const today = get().today();
          const seq = data.orderSeq;
          const rand = rng(seq * 97 + 13);
          const channel = pickChannel(rand, today);
          const now = new Date();
          const order = buildOrder(rand, channel === "market" ? "shopify" : channel, today, seq, {
            live: true,
            at: Date.now(),
            source: "synced",
            id: `o${seq}-live`,
            time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          });
          const { from, to } = mutate((d) => award({ ...d, orders: [...d.orders, order], orderSeq: d.orderSeq + 1 }, "first-sync", today));
          const profit = order.gross - order.platformFee - order.paymentFee - order.shipping - order.cogs;
          set({ lastOrderId: order.id, lastImpact: { orderId: order.id, scoreFrom: from, scoreTo: to, profit, cash: profit } });
          const before = get().data!.missionLog.length;
          grantReward("simulate-order", from);
          if (get().data!.missionLog.length === before) {
            pushToast({
              title: `Order ${order.ref} synced`,
              detail: `${order.item} ×${order.qty}. You keep ${profit < 0 ? "−" : ""}$${Math.abs(profit).toFixed(2)} after fees and stock.`,
              scoreFrom: from !== to ? from : undefined,
              scoreTo: from !== to ? to : undefined,
            });
          }
        },

        addExpense: (e) => {
          const today = get().today();
          const { from } = mutate((d) => ({
            ...d,
            expenses: [...d.expenses, { ...e, id: `e${Date.now()}`, day: today, addedOn: today, live: true, at: Date.now() }],
            bookTouches: d.bookTouches.includes(today) ? d.bookTouches : [...d.bookTouches, today],
          }));
          const d = get().data!;
          if (progressOf(d, today, "add-expenses") >= (MISSIONS["add-expenses"].target ?? 3)) grantReward("add-expenses", from);
        },

        addSale: ({ product, qty, price, card }) => {
          const today = get().today();
          const p = PRODUCTS.find((x) => x.name === product) ?? PRODUCTS[0];
          const r2 = (n: number) => Math.round(n * 100) / 100;
          const gross = r2(price * qty);
          const now = new Date();
          const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          editBooks(
            (d) => ({
              ...d,
              orderSeq: d.orderSeq + 1,
              orders: [
                ...d.orders,
                {
                  id: `o${d.orderSeq}-manual`,
                  ref: `MKT-${String(d.orderSeq).padStart(4, "0")}`,
                  day: today,
                  time: hhmm,
                  channel: "market",
                  item: p.name,
                  qty,
                  gross,
                  cogs: r2(p.cost * qty),
                  platformFee: 0,
                  paymentFee: card ? r2(gross * 0.026 + 0.15) : 0,
                  shipping: 0,
                  source: "manual",
                  live: true,
                  at: Date.now(),
                },
              ],
            }),
            `Sale added · ${p.name} ×${qty}`,
          );
        },

        updateExpenseAmount: (id, amount) => {
          const e = get().data?.expenses.find((x) => x.id === id);
          if (!e || !(amount >= 0) || amount === e.amount) return;
          editBooks(
            (d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === id ? { ...x, amount } : x)) }),
            `${e.name} set to ${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
          );
        },

        deleteRow: (kind, id) => {
          if (kind === "order") {
            editBooks((d) => ({ ...d, orders: d.orders.filter((o) => !(o.id === id && o.source === "manual" && o.live)) }), "Sale removed");
          } else {
            editBooks((d) => ({ ...d, expenses: d.expenses.filter((e) => !(e.id === id && e.addedOn)) }), "Expense removed");
          }
        },

        recountCash: (id, balance) => {
          const a = get().data?.cash.find((x) => x.id === id);
          if (!a || !Number.isFinite(balance)) return;
          editBooks(
            (d) => ({ ...d, cash: d.cash.map((x) => (x.id === id ? { ...x, balance, countedAt: Date.now() } : x)) }),
            `${a.name} recounted`,
          );
        },

        recountStock: (id, units) => {
          const it = get().data?.inventory.find((x) => x.id === id);
          if (!it || !(units >= 0)) return;
          const n = Math.round(units);
          editBooks(
            (d) => ({ ...d, inventory: d.inventory.map((x) => (x.id === id ? { ...x, units: n, countedAt: Date.now() } : x)) }),
            `${it.name} counted: ${n} units`,
          );
        },

        askAdviser: async (question) => {
          const q = question.trim().slice(0, MAX_QUESTION);
          if (!q || get().adviserBusy || !get().data) return;
          if (!get().spendTokens(ADVISER_COST, "AI Adviser question")) return;

          const today = get().today();
          const data = get().data!;
          const context = buildContext(data, computeMetrics(data, today, today), today);
          const history = (data.chat ?? []).slice(-4).map(({ role, text }) => ({ role, text }));
          const push = (entry: Omit<ChatEntry, "id" | "day">) => {
            const d = get().data!;
            set({
              data: {
                ...d,
                chat: [...(d.chat ?? []), { ...entry, id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, day: today }].slice(
                  -40,
                ),
              },
            });
          };

          push({ role: "user", text: q, cost: ADVISER_COST });
          set({ adviserBusy: true });

          let answer: string | null = null;
          try {
            const res = await fetch("/api/adviser", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ question: q, context, history }),
            });
            const json = (await res.json()) as { source?: string; answer?: string };
            if (res.ok && json.source === "model" && json.answer) answer = json.answer;
          } catch {
            // Network failure: answer from the numbers below.
          }

          push(
            answer
              ? { role: "assistant", text: answer, source: "model" }
              : { role: "assistant", text: fallbackAnswer(q, context), source: "fallback" },
          );
          set({ adviserBusy: false });
          grantReward("ask-adviser");
        },

        markReviewed: (id) => {
          const today = get().today();
          const { from } = mutate((d) => ({
            ...d,
            reviews: [...d.reviews, { day: today, missionId: id }],
            bookTouches: id === "review-fees" && !d.bookTouches.includes(today) ? [...d.bookTouches, today] : d.bookTouches,
          }));
          grantReward(id, from);
        },

        spendTokens: (amount, reason) => {
          const { data, tier } = get();
          if (!data) return false;
          if (tokenBalance(data, tier) < amount) {
            set({
              upgrade: {
                title: "You're out of tokens",
                body: `This needs ${amount} tokens. Complete a mission to earn more, or move up a plan for a bigger monthly allowance.`,
              },
            });
            return false;
          }
          set({
            data: { ...data, tokenLedger: [...data.tokenLedger, { id: `t${Date.now()}`, day: get().today(), amount: -amount, reason }] },
          });
          return true;
        },

        unlockLeak: (leakId) => {
          const leak = get().data?.leaks.find((l) => l.id === leakId);
          if (!leak) return false;
          if (!get().spendTokens(leak.unlockCost, "Leak explanation")) return false;
          const d = get().data!;
          set({ data: { ...d, leaks: d.leaks.map((l) => (l.id === leakId ? { ...l, unlockedWithTokens: true } : l)) } });
          pushToast({ title: `−${leak.unlockCost} tokens · Leak unlocked`, detail: "Action steps are now visible." });
          return true;
        },

        applyLeak: (leakId) => {
          const today = get().today();
          const { data, tier } = get();
          const leak = data?.leaks.find((l) => l.id === leakId);
          if (!data || !leak || leak.appliedOn) return;
          if (!leakUnlocked(tier, leak)) {
            set({ upgrade: { title: "This saving is on Growth", body: "Growth shows every leak with step-by-step fixes." } });
            return;
          }
          const { from, to } = mutate((d) => ({
            ...award(d, "leak-hunter", today),
            leaks: d.leaks.map((l) => (l.id === leakId ? { ...l, appliedOn: today } : l)),
            bookTouches: d.bookTouches.includes(today) ? d.bookTouches : [...d.bookTouches, today],
          }));
          const before = get().data!.missionLog.length;
          grantReward("apply-saving", from);
          if (get().data!.missionLog.length === before) {
            pushToast({
              title: "Saving applied",
              detail: `${leak.title}. The expense now reflects the cheaper option.`,
              scoreFrom: from,
              scoreTo: to,
            });
          }
          if (!data.badges.some((b) => b.id === "leak-hunter"))
            pushToast({ title: `Badge earned · ${BADGES["leak-hunter"].name}`, detail: BADGES["leak-hunter"].hint });
        },

        openSheet: (s) => {
          set({ sheet: s });
          // Opening the runway or leak view is the "review" for those missions.
          if (s?.kind === "runway") setTimeout(() => get().markReviewed("check-runway"), 600);
          if (s?.kind === "leak") setTimeout(() => get().markReviewed("review-leaks"), 600);
        },
        openUpgrade: (r) => set({ upgrade: r }),
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      };
    },
    {
      name: "finpath-demo-v1",
      skipHydration: true,
      partialize: (s) => ({ data: s.data, tier: s.tier, dayOffset: s.dayOffset }),
    },
  ),
);
