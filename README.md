# FinPath

A Business Health Score, a 90-day plan and one five-minute mission a day for small online and market sellers. Built for Business Cup 2.0.

**Demo only:** no login and no database. `/app` opens with a sample store ("Emberline Candle Co.") seeded into your browser's localStorage. All figures are sample data and not financial advice.

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

## Demo controls

Open the avatar menu to find **Advance to tomorrow** (to see streaks), **View as tier** (real limits per plan) and **Reset demo**.

`npx tsx scripts/calibrate.ts` prints the seed's metrics, which helps when tuning the score.

See `docs/PLAN.md` and `docs/SPEC.md` for the full plan.
