# FinPath

A Business Health Score, a 90-day plan and one five-minute mission a day for small online and market sellers. Built for Business Cup 2.0.

**Demo only:** no login and no database. `/app` opens with a sample store ("Emberline Candle Co.") seeded into your browser's localStorage. All figures are sample data and not financial advice.

## Landing page

`/` serves `public/landing/index.html`, a static page built with the design-taste-frontend skill (its kit files are in `public/assets`, page CSS in `public/landing/landing.css`). The live figures on it, including the "Add a sample order" widget, come from `src/landing/proof.ts`, which bundles the app's own engine (`src/lib`) into `public/landing/proof.js`:

```bash
npm run build:landing
```

`npm run build` runs it first. The skill's finish gate passed on the final page (one waiver, in `.taste-skill/waivers.json`: the "sample data" footer note the plan requires).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000/app.

## How the numbers work

- `src/lib/seed.ts` creates 120 days of orders across Shopify, Amazon and a weekend market, plus expenses, cash accounts, stock and four money leaks.
- `src/lib/engine.ts` derives everything shown: true profit, the profit bridge, cash runway, fee load, leak totals and the Health Score. Nothing derived is stored, so every action moves the score through the formula.
- **Health Score (0–100):** profit margin 30, cash runway 25, fee load 20, expense control 15, books up to date 10.
- `src/store/store.ts` holds the one reward function (`grantReward`). It updates tokens, XP, streak and badges and shows the toast, so every mission pays out the same way.
- Missions complete when you do the work: syncing an order, adding three expenses, or reviewing a fee breakdown.

## AI Adviser

`POST /api/adviser` (`src/app/api/adviser/route.ts`) sends the question and a compact summary of the store's numbers to Claude (`claude-opus-5-5`, low effort, with server-side refusal fallbacks), and the answer cites those numbers. Each question costs 5 tokens.

- Set `ANTHROPIC_API_KEY` in `.env.local` locally, or in the host's environment variables (see `.env.example`). The key stays on the server.
- The demo is public, so the route limits each IP to 8 questions per 10 minutes and caps total calls per day (`ADVISER_DAILY_LIMIT`, default 400). The counters are in memory per server instance, so also set a monthly spend limit on the key in the Claude Console.
- If the key is missing, a limit is hit, or the call fails or is declined, the browser answers from the store's own numbers (`fallbackAnswer` in `src/lib/adviser.ts`). Visitors never see an error; the answer is labelled "Calculated from your numbers" instead of "Claude".

## Demo controls

Open the avatar menu to find **Advance to tomorrow** (to see streaks), **View as tier** (real limits per plan) and **Reset demo**.

`npx tsx scripts/calibrate.ts` prints the seed's metrics, which helps when tuning the score.

See `docs/PLAN.md` and `docs/SPEC.md` for the full plan.
