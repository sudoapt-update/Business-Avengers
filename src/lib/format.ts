const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n: number) => usd0.format(Math.round(n));
export const money2 = (n: number) => usd2.format(n);
export const signedMoney = (n: number) => (n < 0 ? "−" : "+") + usd0.format(Math.abs(Math.round(n)));
export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString("en-US");
export const round1 = (n: number) => Math.round(n * 10) / 10;
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
