# FinPath — Business Cup 2.0 Project Specification (v4)

**Product name (working):** FinPath  
**Track:** Money  
**Target user:** US working adults aged 25–45 who are solopreneurs, online sellers (Shopify, Amazon, Etsy, etc.), offline sellers, or hybrid ecommerce sellers.  
**Core pain:** They do not clearly know the financial health of their business. Cash-flow surprises, hidden fees, unknown true profitability, and money leaks create stress and prevent growth.  
**Business model:** B2C subscription with multiple tiers + AI token system + mission rewards. Users pay for clear financial clarity, a guided path, AI-powered advice, actionable savings recommendations, and a rewarding daily system that makes them return.

**Submission requirements (all mandatory):**
- Live production URL (jury can open in browser and use end-to-end with **no registration or login**)
- Public GitHub repository
- Pitch deck (PDF, max 10 slides total including title)

**Evaluation criteria:**
| Criterion                  | Weight | What judges look for |
|----------------------------|--------|----------------------|
| Product & Engineering      | 40%    | Works end-to-end in production. Core value is real (not faked). Quality of UX and code. |
| Value & Retention          | 20%    | Clear what the user pays for and why they come back tomorrow (subscription renewal > DAU). |
| Problem & User             | 15%    | Clear choice of problem + deep understanding of the target user. |
| Business Potential         | 15%    | Big or growing niche, path to meaningful ARR, LTV > CAC with realistic numbers. |
| Originality                | 10%    | Not a copy-paste of an existing product. Own angle (audience, mechanic, or value). |

---

## Product Vision

FinPath is a personal financial growth system for small sellers. It combines the insight of a part-time CFO, the accountability of a business coach, simple game mechanics with real rewards, an AI financial adviser (token-powered), and concrete savings recommendations.

**Tagline:** Your personal business growth journey.

**One-sentence pitch:**  
FinPath gives US sellers a live Business Health Score, a personalized 90-day plan, daily missions that reward AI tokens and XP, manual data tables, AI financial advice, and smart savings recommendations that stop money leaks and build financial resilience.

---

## Subscription Tiers

| Tier          | Price     | Best for                  | Key limits / features |
|---------------|-----------|---------------------------|-----------------------|
| **Starter**   | Free      | Trying the product        | Health Score (basic), 90-day plan view, 3 missions/day, manual tables (limited), 50 AI tokens/month, basic leak list, basic rewards (small token + XP) |
| **Growth**    | $19/mo    | Active sellers            | Full Health Score + history, unlimited missions, full leak detector + alternatives, Time Machine (limited), full tables, 500 AI tokens/month, all mock connections, basic AI adviser, sample order demo, better mission rewards |
| **Pro**       | $39/mo    | Serious growth            | Everything in Growth + unlimited Time Machine, advanced AI insights, 2,000 AI tokens/month, full savings with one-click, Entrepreneur Wrapped, export, premium mission rewards (bonus tokens, badges) |
| **Scale**     | $79/mo    | Higher volume sellers     | Everything in Pro + 8,000 AI tokens/month, advanced modeling, multi-store demo, custom milestones, highest reward multipliers |

**Token system:**
- AI chat, personalized missions, and detailed leak explanations cost tokens.
- Completing missions *earns* tokens back (and XP).
- Tokens refresh monthly. Optional token packs in demo.

---

## Mission Rewards System (new core feature)

Missions are not just checkboxes. Completing them gives tangible rewards that feed the rest of the product. This strengthens Value & Retention.

**Reward types (show at least 2–3 in the demo):**
1. **AI Tokens** — primary currency. Completing a mission gives 5–30 tokens depending on difficulty and tier.
2. **XP / Level progress** — fills a progress bar toward the next “Financial Level” (e.g. Stable → Growing → Resilient). Visible on dashboard.
3. **Streak bonus** — consecutive days of completing at least one mission multiplies rewards (e.g. 3-day streak = +20% tokens).
4. **Badges** — simple unlockable icons for milestones (“Leak Hunter”, “7-Day Streak”, “First Order Sync”, “Score 80+”).
5. **Optional small real-value teases** (demo only): “+1 free Time Machine run”, “Unlock one extra AI question today”, “Bonus leak insight”.

**How rewards appear in the UI:**
- Each mission card shows the reward preview before completion (“+15 tokens • +40 XP”).
- On complete: short animation or toast (“+15 tokens earned”, “Streak: 4 days”).
- Dashboard shows current token balance, XP bar, and active streak.
- Higher tiers get higher base rewards or multipliers (visible in upgrade prompt).

**Example missions with rewards:**
- “Review yesterday’s Amazon fees” → +10 tokens + 30 XP
- “Add 3 manual expenses” → +15 tokens + 50 XP
- “Simulate one new order and check impact” → +20 tokens + 60 XP
- “Ask AI Adviser one question about margin” → +5 tokens (net after cost) + 25 XP
- “Connect one platform (demo)” → +25 tokens + badge

**Why this works:**
- Tokens create a closed loop: spend tokens on AI → earn tokens back by doing useful financial work.
- XP and streaks give visible progress independent of money.
- Badges give quick wins and shareable moments.
- Supports the 20% Value & Retention criterion strongly.

---

## Other Core Features (updated)

### 1. Sample Integration / Live Order Sync Demo
- Fake Shopify/Amazon order feed.
- “Simulate new order” button updates revenue, cash, Health Score, and tables.
- Completing related mission or simulating order can also grant tokens/XP.
- Clearly labeled demo.

### 2. Smart Savings Advice / Cheaper Alternatives
- Cards: “You spend $99/mo on Tool A. Cheaper Tool B is $29/mo. Save $70/mo.”
- Upgrade or token cost to unlock full action steps.
- Some missions can be “Apply one savings recommendation” and reward tokens.

### 3. Manual Financial Tables
- Editable Income, Expenses, Inventory, Cash.
- Synced rows from order demo.
- Adding rows can trigger a small reward or mission progress.

### 4. Existing features
- Business Health Score dashboard with breakdown and chart
- 90-day growth plan with progress
- Business Time Machine simulator
- Mock connection buttons
- AI Financial Adviser chat with token counter (now also shows tokens earned from missions)
- Onboarding quiz
- Clear pricing / upgrade surfaces
- Demo data labels everywhere

---

## Demo Flow for Jury

1. Land on dashboard (score, tokens, streak, missions visible).
2. Complete one mission → tokens and XP increase, toast appears.
3. Open Live Order Sync Demo → simulate order → numbers change + optional reward.
4. Check Money Leak Detector → see cheaper alternative + upgrade lock.
5. Open AI Adviser → ask a question (tokens decrease) → answer references data.
6. See pricing tiers and remaining tokens.

---

## Technical Notes for 24h Build

- All rewards are client-side state (tokens, XP, streak, badges).
- Mission complete function updates multiple counters and shows toast.
- Keep animations simple (CSS or short React state).
- Recommended stack: Next.js + Tailwind + client state.

---

## Success Criteria (updated)

Minimum viable:
- [ ] Live URL, no login
- [ ] Dashboard + score + missions that actually give tokens/XP on complete
- [ ] Visible token balance, XP bar, and streak
- [ ] Manual tables (editable)
- [ ] Live Order Sync Demo that updates numbers
- [ ] Leak detector with cheaper-alternative cards + upgrade lock
- [ ] AI chat with token counter (spend + earn)
- [ ] Pricing tiers visible
- [ ] Mock connects
- [ ] Public repo + README
- [ ] Deck

---

**End of specification (v4).**  
Use this as the single source of truth for Fable.
