# FinPath website plan

Companion to `FinPath-PROJECT-v4.md` (the product specification). This plan covers the site structure, dashboard, landing page, design direction, build order and builder constraints. It does not cover the pitch deck.

The reference screenshots are style references only: the six Quayside Pay screens set the app's look, and the Column page sets the landing's look. Do not reuse either reference's names, logos or content.

Four decisions in this plan go beyond the spec:

- **The Health Score is computed, never set.** One formula over the tables data, so every action moves it through real math. This is what "core value is real" (40%) is judged on.
- **Missions complete by doing the thing.** Simulating an order or adding three expenses completes the mission automatically; there are no bare checkboxes.
- **A small demo-controls menu** with "Advance to tomorrow", "View as tier" and "Reset demo". Without it, judges cannot see streaks or what paying unlocks in a two-minute visit.
- **The landing is built after the core components**, because its best sections reuse the live score, leak and mission cards.

---

## 1. Site structure

| Route | Purpose |
|---|---|
| `/` | Landing. Every CTA goes straight to `/app`; there is no sign-in link. |
| `/app` | Overview dashboard. Jury steps 1–3 happen here without navigating. |
| `/app/missions` | Today's missions plus the 90-day plan timeline. |
| `/app/orders` | Live Order Sync demo feed. |
| `/app/books` | Editable Income, Expenses, Inventory and Cash tables. |
| `/app/leaks` | Money Leak Detector with cheaper alternatives. |
| `/app/adviser` | AI Adviser chat, also reachable as a drawer from any page. |
| `/app/time-machine` | Simple what-if simulator (first to cut if behind). |
| `/app/plans` | Pricing tiers and current token allowance. |

**Sidebar groups** (same pattern as the reference):

- **Today:** Overview, Missions (badge: remaining), 90-day plan.
- **Money:** Orders, Books, Leaks (badge: count), Time Machine.
- **Help:** AI Adviser, Connections.
- **Account:** Plans.

**Out of the MVP:** multi-store, Entrepreneur Wrapped, export, token packs and advanced modeling. They appear only as locked rows on the pricing table.

---

## 2. Dashboard components

### App shell

| Component | What it does |
|---|---|
| Top bar | Breadcrumb, "Demo data" pill, token balance, streak counter, plan badge with Upgrade, avatar menu holding the demo controls. |
| Sidebar footer widget | Replaces the reference's "Today's close": segmented bar for today's three missions, "Day 4 streak · 2 of 3 done", time until reset. |
| Reward toast | "+15 tokens · +40 XP · Streak: 4 days" on every mission completion. |
| Upgrade modal | Opens on any locked feature or when tokens run out; shows what the next tier adds. |
| Demo controls (avatar menu) | "Advance to tomorrow", "View as tier" (Starter / Growth / Pro / Scale), "Reset demo". Clearly labelled as demo controls. |

### Overview page, top to bottom

| Component | What it does |
|---|---|
| Alert banner | One sentence on the biggest problem: "You're losing $214/mo to 4 leaks. The largest is $70/mo." One button: "See leaks". |
| KPI row (4 cards) | Health Score, true profit (30 days), cash runway in weeks, money leaking per month. Each has a delta chip and a sparkline. |
| Health Score card | Score out of 100, level label, 30/90-day history chart, five factor bars. |
| Today's missions (right rail) | Three cards with reward preview ("+15 tokens · +40 XP") and a button that opens the relevant action. |
| Level card (right rail) | XP bar toward the next Financial Level (Stable → Growing → Resilient), streak multiplier, earned badges. |
| Profit bridge | The reference's "variance bridge", reused: revenue → cost of goods → platform fees → payment fees → shipping → tools → true profit. |
| Live order feed | Last five demo orders and a "Simulate new order" button; the new row animates in and the KPIs, score and Books update. |
| Top leaks | Two leak cards: one open with action steps, one locked behind tokens or Growth. |
| 90-day plan strip | Three phases with a progress marker and the next milestone. |
| Adviser prompt | Three suggested questions with token cost; opens the chat drawer. |

### Score formula

The builder may tune weights, but must keep five visible factors.

| Factor | Weight | Moved by |
|---|---|---|
| Profit margin | 30 | Orders, expenses |
| Cash runway | 25 | Orders, cash table |
| Fee load (fees ÷ revenue) | 20 | Orders by channel |
| Expense control (leaks ÷ expenses) | 15 | Applying a savings recommendation |
| Bookkeeping freshness | 10 | Missions and table edits |

### Seed state

- A hybrid seller (Shopify, Amazon and a weekend market) at about $14k/month revenue.
- Health Score 62.
- 42 of 50 tokens (Starter tier).
- 3-day streak, so completing one mission today triggers the +20% streak bonus.
- 140 of 200 XP, so a second mission levels up during the demo.
- Four leaks totalling $214/mo; the largest is $70/mo.

### Token economy (starting values)

- AI Adviser question: costs 5 tokens.
- Detailed leak explanation: costs 3 tokens.
- Missions: earn 5–25 tokens plus 25–60 XP, by difficulty.
- Streak bonus: 3+ consecutive days gives +20% tokens.
- Higher tiers apply a reward multiplier, visible in the upgrade modal.

---

## 3. Landing page

Audience: a US seller who is curious but not technical. Tone: plain, concrete, trust-building.

1. **Nav.** Wordmark, How it works, Pricing, FAQ, and one button: "Open the demo".
2. **Hero.**
   - Eyebrow: "For Shopify, Amazon, Etsy and market sellers".
   - Headline: "Know if your shop is actually making money."
   - Subhead: "FinPath turns your sales, fees and expenses into one Business Health Score, then gives you a 90-day plan and one five-minute task a day to raise it."
   - Primary CTA: "Try the live demo — no signup". Secondary: "See how it works".
   - Microcopy: "Opens instantly with a sample store. Nothing to connect."
   - Visual: a dot-matrix path rising from "Day 1 · 62" to "Day 90 · 80", with a floating live Health Score card.
3. **Platform strip.** "Built around where you sell", with platform names as plain text. These are not customer logos.
4. **Problem.** Headline: "Sales are up. So why is the bank account flat?" Three cards: fees you never see as one number, subscriptions that quietly stack up, no true profit figure until tax time.
5. **How it works.** Three steps, each with a real UI crop: see your score, get your 90-day path, do one mission a day.
6. **Interactive proof.** "Watch one order change the numbers": a Simulate button that updates a mini score card on the page, using the same engine as the app.
7. **Leak detector.** One sample card ("$99/mo → $29/mo, save $70") and the value math: "The demo store finds $214/mo, more than five times the Pro plan."
8. **Why you come back.** Missions, tokens, streaks and levels, framed as "five minutes a day, rewards you spend on advice".
9. **AI Adviser.** One sample question ("Can I afford a part-time packer?") with an answer that cites the store's numbers.
10. **Pricing.** Four tiers, Growth marked "Recommended for active sellers", all buttons open the demo.
11. **FAQ.** Is this real data? Do I connect my store? Does it replace my accountant? What are tokens? Where is my data stored?
12. **Final CTA and footer.** Repeat the primary CTA; the footer carries the GitHub link and "Business Cup 2.0 demo · sample data · not financial or tax advice".

Use no testimonials, user counts or "trusted by" claims, because there are none yet. The sample store and the live demo carry the trust instead.

---

## 4. Design direction

### Preserve from the dashboard reference

- Near-white canvas, white cards, 1px hairline borders, about 10px radius, almost no shadow.
- Sidebar with small uppercase group labels and count badges.
- KPI card anatomy: caps label, large number, tinted delta chip, sparkline.
- Black solid primary button, white outlined secondary.
- Colour only for meaning: green good, amber attention, red loss, blue info, as soft tinted pills.
- Monospace with tabular figures for money and IDs.
- A plain-language subtitle under every page title, and the "What this screen is for" explainer card.
- Sidebar footer status widget, step timelines, stacked balance bar, bridge list.

### Preserve from the landing reference

- Airy off-white page, deep navy headline with tight tracking, narrow content column.
- Two-tone headlines (ink, then grey), monospace eyebrow chips, compact buttons.
- Dot-matrix graphics and a floating product card.

### Polish or change

- Lower the density: sellers are not ops analysts, so use fewer columns, larger type and at most six rows per table.
- Remove jargon; nothing like "bps" or "MDR".
- Add one brand element: a green-to-blue gradient used only on the path motif and the score.
- Keep rewards in the same sober language (segmented bars, counters, small pills), with no confetti or mascots.
- Replace the world map with the dotted path.
- Make it work at 375px; the references are desktop-only. The sidebar becomes a drawer.
- Typeface: Geist and Geist Mono, which ship with Next.js and match both references.

---

## 5. 24h build order

| Hours | Build | Done when |
|---|---|---|
| 0–1 | Scaffold, public repo, deploy an empty shell | Live URL exists |
| 1–4 | State store, seed data, score formula, reward function | Score recomputes from data |
| 4–8 | App shell, Overview, missions with rewards and toast | Jury steps 1–2 work |
| 8–11 | Order sync demo and Books tables | Step 3 works; rows sync |
| 11–13 | Leaks page, lock/unlock, "apply" action, upgrade modal | Step 4 works |
| 13–15 | AI Adviser with token spend and fallback | Step 5 works |
| 15–16 | Plans page and "View as tier" | Step 6 works |
| 16–20 | Full landing page | All 12 sections, mobile-ready |
| 20–22 | 90-day plan page, connections, badges, Time Machine, quiz | Whatever fits |
| 22–24 | Incognito and phone QA, README, deck screenshots | Flow runs in under 2 minutes |

If behind, cut in this order: Time Machine, onboarding quiz, badge gallery, 90-day plan page (keep the strip on Overview).

---

## 6. Handoff notes for the builder

### Hard constraints

- No auth, no database, no signup or email capture. `/app` loads fully seeded.
- Next.js App Router, TypeScript, Tailwind, one client store persisted to localStorage.
- The score, profit bridge and leak totals are derived from store data; never store or increment them directly.
- All rewards go through one function that updates tokens, XP, streak and badges and fires the toast.
- Tokens cannot go below zero; running out opens the upgrade modal.
- The onboarding quiz is optional and never blocks the dashboard.

### Behaviour

- Missions tied to an action complete when the action happens; "review" missions open the relevant view first.
- Streaks use the local date; "Advance to tomorrow" in the demo menu shifts it.
- "View as tier" changes limits for real: mission count, token allowance, locked leaks, reward multiplier.
- A simulated order adds an Income row tagged "synced" and updates every dependent number.
- Applying a savings recommendation lowers the matching expense, which raises the score through the formula.

### AI Adviser

- Use a real model call through a server route, with the key in an environment variable and the current financials passed as context.
- Fall back to answers computed from the store if the call fails; the jury must never see an error.
- The URL is public with no login, so add a per-IP rate limit and a spending cap on the key.
- Show "Educational, not financial advice" under the chat.

### Honesty and labelling

- One persistent "Demo data" pill, and "Demo connection — no real account is accessed" on mock connects.
- Leak cards use illustrative tool categories and prices, marked as examples, not real brands' pricing.
- No invented testimonials, logos, statistics or user counts anywhere.

### Quality bar

- Works at 375px and on desktop, in an incognito window.
- Keyboard focus is visible, toasts are announced, and animations respect reduced-motion.
- The landing is static, with no heavy graphics libraries; draw the dot matrix in SVG or CSS.
- Done means the six-step jury flow runs in under two minutes and the score visibly changes at steps 2, 3 and 4.

### Jury flow (definition of done)

1. Land on the dashboard: score, tokens, streak and missions are visible.
2. Complete one mission: tokens and XP increase, the toast appears.
3. Simulate an order: revenue, cash, score and Books change.
4. Open the Leak Detector: see a cheaper alternative and an upgrade lock.
5. Ask the AI Adviser a question: tokens decrease and the answer references the store's data.
6. See the pricing tiers and remaining tokens.
