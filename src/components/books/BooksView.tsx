"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, Boxes, CalendarDays, Landmark, Plus, Receipt, ShoppingBag, Trash2, type LucideIcon } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { addDays, formatDay } from "@/lib/date";
import { accountBalances, byNewest, effectiveAmount, stockLevels } from "@/lib/engine";
import { CHANNEL_LABEL, PRODUCTS } from "@/lib/seed";
import { cn, money, money2, num, signedMoney } from "@/lib/format";
import { paymentEvents } from "@/lib/calendar";
import type { Channel, Expense, ExpenseCategory } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, CardHeader, Caps, IconTile, Pill, type TileTone } from "@/components/ui/primitives";
import { HBars, PartsBar } from "@/components/ui/charts";
import { BrandIcon, CHANNEL_COLOR } from "@/components/ui/brand";
import { CATEGORY_ICON } from "@/components/ui/icons";
import { CashFlowCard } from "@/components/overview/Money";
import { EditableNumber, Pager, Segmented, Td, Th } from "@/components/ui/table";
import { OrderList } from "@/components/orders/OrderList";
import { PaymentCalendar } from "./PaymentCalendar";

const TABS = ["income", "expenses", "inventory", "cash", "calendar"] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string | null): v is Tab => !!v && (TABS as readonly string[]).includes(v);
const PAGE = 6;

export function BooksView() {
  const d = useDerived();
  // The open table is in the URL (?tab=calendar), so a link can open it and a reload keeps it.
  const params = useSearchParams();
  const [tab, setTabState] = useState<Tab>(() => {
    const t = params.get("tab");
    return isTab(t) ? t : "income";
  });
  const setTab = (t: Tab) => {
    setTabState(t);
    // Next.js keeps useSearchParams in step with the native History API, without a server round trip.
    window.history.replaceState(null, "", t === "income" ? window.location.pathname : `?tab=${t}`);
  };
  const calNet = paymentEvents(d.data, d.today, 30).reduce((s, e) => s + e.amount, 0);
  const fresh = d.metrics.factors.find((f) => f.key === "freshness")!;
  const from = addDays(d.today, -30);
  const income30 = d.data.orders.filter((o) => o.day > from && o.day <= d.today).reduce((s, o) => s + o.gross, 0);
  const stock = stockLevels(d.data);

  const tiles: { id: Tab; label: string; value: string; sub: string; icon: LucideIcon; tone: TileTone }[] = [
    { id: "income", label: "Income", value: money(income30), sub: "sales, last 30 days", icon: ShoppingBag, tone: "good" },
    { id: "expenses", label: "Expenses", value: money(d.metrics.tools), sub: "running costs a month", icon: Receipt, tone: "bad" },
    {
      id: "inventory",
      label: "Stock",
      value: money(stock.reduce((s, x) => s + x.value, 0)),
      sub: `${num(stock.reduce((s, x) => s + x.units, 0))} units at cost`,
      icon: Boxes,
      tone: "violet",
    },
    {
      id: "cash",
      label: "Cash",
      value: money(d.metrics.cash),
      sub: `${d.metrics.runwayWeeks.toFixed(1)} weeks of runway`,
      icon: Landmark,
      tone: "info",
    },
    {
      id: "calendar",
      label: "Calendar",
      value: signedMoney(calNet),
      sub: "payouts minus bills, next 30 days",
      icon: CalendarDays,
      tone: "warn",
    },
  ];

  return (
    <>
      <PageHeader
        title="Books"
        sub="Your income, expenses, stock and cash, plus a calendar of payments due. Every edit updates the whole app."
      />
      <div className="space-y-4">
        <Explainer>
          Profit you can trust starts with complete books. Synced orders land here on their own; anything paid in cash, at the market or
          outside your store has to be added by hand. Click any figure with a pencil to correct it. Your score&apos;s{" "}
          <span className="text-ink font-medium">Books fresh</span> part is{" "}
          <span className="tnum font-mono">
            {fresh.points.toFixed(1)}/{fresh.weight}
          </span>{" "}
          ({fresh.reading.toLowerCase()}); any edit today brings it to full marks.
        </Explainer>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="tablist" aria-label="Choose a table">
          {tiles.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                aria-controls={`books-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-card bg-panel relative border p-4 text-left transition-colors sm:p-5",
                  on ? "border-ink ring-ink ring-1" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-center gap-2">
                  <IconTile tone={t.tone} size="sm">
                    <Icon />
                  </IconTile>
                  <Caps>{t.label}</Caps>
                </div>
                <div className="tnum mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{t.value}</div>
                <div className="text-muted mt-1 text-[12px]">{t.sub}</div>
                <div className={cn("mt-3 inline-flex items-center gap-1 text-xs font-medium", on ? "text-ink" : "text-muted")}>
                  {on ? (
                    <>
                      {t.id === "calendar" ? "Calendar" : "Table"} shown below <ArrowDown className="size-3" aria-hidden />
                    </>
                  ) : t.id === "calendar" ? (
                    "Open calendar"
                  ) : (
                    "Open table"
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div id={`books-${tab}`} role="tabpanel" key={tab} className="animate-rise-in space-y-4">
          {tab === "income" && <IncomeTable />}
          {tab === "expenses" && <ExpensesTable />}
          {tab === "inventory" && <InventoryTable />}
          {tab === "cash" && <CashFlowCard weeks={12} booksLink={false} />}
          {tab === "cash" && <CashTable />}
          {tab === "calendar" && <PaymentCalendar />}
        </div>
      </div>
    </>
  );
}

function IncomeTable() {
  const d = useDerived();
  const { deleteRow, addSale } = useStore.getState();
  const lastOrderId = useStore((s) => s.lastOrderId);
  const [filter, setFilter] = useState<"all" | "synced" | "manual">("all");
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);

  const rows = [...d.data.orders].filter((o) => filter === "all" || o.source === filter).sort(byNewest);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const p = Math.min(page, pages - 1);

  return (
    <Card>
      <CardHeader
        title="Income"
        sub="One row per order. Synced rows come from the order feed; market sales you add here."
        right={
          <Button size="sm" variant={adding ? "secondary" : "primary"} onClick={() => setAdding((a) => !a)} className="shrink-0">
            <Plus className="size-3.5" /> {adding ? "Close" : "Add a market sale"}
          </Button>
        }
      />
      <ChartBlock title="Sales by channel · last 30 days">
        <PartsBar
          parts={(["shopify", "amazon", "market"] as Channel[]).map((c) => ({
            label: CHANNEL_LABEL[c],
            value: d.data.orders
              .filter((o) => o.channel === c && o.day > addDays(d.today, -30) && o.day <= d.today)
              .reduce((s, o) => s + o.gross, 0),
            color: CHANNEL_COLOR[c],
            icon: <BrandIcon id={c} size="xs" />,
          }))}
        />
      </ChartBlock>
      {adding && (
        <SaleForm
          onAdd={(s) => {
            addSale(s);
            setFilter("all");
            setPage(0);
          }}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
        <Segmented
          label="Filter income"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "synced", label: "Synced" },
            { value: "manual", label: "Added by hand" },
          ]}
        />
        <span className="text-muted font-mono text-xs">{num(rows.length)} rows</span>
      </div>
      <OrderList
        orders={rows.slice(p * PAGE, p * PAGE + PAGE)}
        today={d.today}
        highlightId={lastOrderId}
        showSource
        onDelete={(o) => deleteRow("order", o.id)}
      />
      <Pager page={p} size={PAGE} total={rows.length} onPage={setPage} />
    </Card>
  );
}

function SaleForm({ onAdd }: { onAdd: (s: { product: string; qty: number; price: number; card: boolean }) => void }) {
  const [product, setProduct] = useState(PRODUCTS[0].name);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(PRODUCTS[0].price));
  const [card, setCard] = useState(true);
  const field = "h-9 w-full rounded-lg border border-line-strong bg-panel px-3 text-sm outline-none focus:border-ink";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = Math.max(1, Math.round(Number(qty)));
    const pr = Number(price);
    if (!(pr > 0)) return;
    onAdd({ product, qty: q, price: pr, card });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-card border-line bg-canvas mx-5 mt-4 grid gap-3 border p-4 sm:grid-cols-[minmax(0,2fr)_80px_110px_auto_auto] sm:items-end"
    >
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium">Product</span>
        <select
          className={field}
          value={product}
          onChange={(e) => {
            setProduct(e.target.value);
            setPrice(String(PRODUCTS.find((p) => p.name === e.target.value)?.price ?? ""));
          }}
        >
          {PRODUCTS.map((p) => (
            <option key={p.name}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium">Qty</span>
        <input className={`${field} tnum font-mono`} type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium">Price each</span>
        <input
          className={`${field} tnum font-mono`}
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <label className="flex h-9 items-center gap-2 text-[13px]">
        <input type="checkbox" checked={card} onChange={(e) => setCard(e.target.checked)} className="accent-ink size-4" />
        Paid by card
      </label>
      <Button variant="primary" type="submit">
        Add sale
      </Button>
    </form>
  );
}

function ExpensesTable() {
  const d = useDerived();
  const { updateExpenseAmount, deleteRow, openSheet } = useStore.getState();
  const [filter, setFilter] = useState<"all" | "monthly" | "one-off">("all");
  const [page, setPage] = useState(0);

  const leakFor = (e: Expense) => d.data.leaks.find((l) => l.expenseId === e.id);
  const rows = d.data.expenses
    .filter((e) => filter === "all" || e.cadence === filter)
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0) || effectiveAmount(b, d.data.leaks, d.today) - effectiveAmount(a, d.data.leaks, d.today));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const p = Math.min(page, pages - 1);
  const oneOff30 = d.data.expenses
    .filter((e) => e.cadence === "one-off" && e.day > addDays(d.today, -30) && e.day <= d.today)
    .reduce((s, e) => s + e.amount, 0);
  const totals = new Map<ExpenseCategory, number>();
  for (const e of d.data.expenses) {
    const counts = e.cadence === "monthly" ? e.day <= d.today : e.day > addDays(d.today, -30) && e.day <= d.today;
    if (counts)
      totals.set(
        e.category,
        (totals.get(e.category) ?? 0) + (e.cadence === "monthly" ? effectiveAmount(e, d.data.leaks, d.today) : e.amount),
      );
  }
  const byCategory = [...totals.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader
        title="Expenses"
        sub="Monthly costs and one-off purchases. Applied savings show the new price."
        right={
          <Button size="sm" variant="primary" onClick={() => openSheet({ kind: "add-expense" })} className="shrink-0">
            <Plus className="size-3.5" /> Add expense
          </Button>
        }
      />
      <ChartBlock title="Running costs by category · this month">
        <HBars
          color="var(--color-bad-dot)"
          rows={byCategory.map(([cat, value]) => {
            const Icon = CATEGORY_ICON[cat];
            return { label: cat, value, icon: <Icon className="text-muted size-3.5 shrink-0" aria-hidden /> };
          })}
        />
      </ChartBlock>
      <div className="px-5 pt-4 pb-3">
        <Segmented
          label="Filter expenses"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "monthly", label: "Monthly" },
            { value: "one-off", label: "One-off" },
          ]}
        />
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-line bg-canvas border-y text-left">
            <tr>
              <Th>Expense</Th>
              <Th>Category</Th>
              <Th>Repeats</Th>
              <Th right>Amount</Th>
              <Th className="w-10">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.slice(p * PAGE, p * PAGE + PAGE).map((e) => {
              const leak = leakFor(e);
              const applied = !!leak?.appliedOn;
              return (
                <tr key={e.id} className={cn(e.addedOn === d.today && "animate-row-in")}>
                  <Td>
                    <div className="font-medium">{e.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {e.addedOn && <span className="text-muted font-mono text-xs">added {formatDay(e.addedOn)}</span>}
                      {leak && !applied && <Pill tone="bad">Leak · could be {money(leak.altPrice)}</Pill>}
                      {applied && <Pill tone="good">Saving applied</Pill>}
                    </div>
                  </Td>
                  <Td className="text-ink-2">
                    <CategoryLabel category={e.category} />
                  </Td>
                  <Td>
                    <Pill tone={e.cadence === "monthly" ? "neutral" : "info"}>{e.cadence === "monthly" ? "Monthly" : "One-off"}</Pill>
                  </Td>
                  <Td right>
                    {applied ? (
                      <span className="tnum font-mono">
                        <span className="text-faint mr-2 line-through">{money2(e.amount)}</span>
                        {money2(leak!.altPrice)}
                      </span>
                    ) : (
                      <EditableNumber
                        value={e.amount}
                        display={money2(e.amount)}
                        label={`Amount for ${e.name}`}
                        onCommit={(n) => updateExpenseAmount(e.id, n)}
                      />
                    )}
                  </Td>
                  <Td right>
                    {e.addedOn && (
                      <button
                        className="text-faint hover:bg-hover hover:text-bad grid size-7 place-items-center rounded-md"
                        onClick={() => deleteRow("expense", e.id)}
                        aria-label={`Remove ${e.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={p} size={PAGE} total={rows.length} onPage={setPage} />
      <div className="border-line flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-[13px]">
        <span className="text-muted">Running costs this month</span>
        <span className="tnum font-mono">
          {money(d.metrics.tools - oneOff30)} monthly + {money(oneOff30)} one-off ={" "}
          <span className="font-semibold">{money(d.metrics.tools)}</span>
        </span>
      </div>
    </Card>
  );
}

function InventoryTable() {
  const d = useDerived();
  const recountStock = useStore((s) => s.recountStock);
  const rows = stockLevels(d.data);
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Card>
      <CardHeader
        title="Stock"
        sub="Units on hand at cost. Synced sales count down from your last count; type a new count after a stocktake."
      />
      <ChartBlock title="Stock value by product · at cost">
        <HBars
          color="var(--color-violet)"
          rows={[...rows]
            .sort((a, b) => b.value - a.value)
            .map((r) => ({
              label: r.item.name,
              value: r.value,
              note: r.units < 20 ? <Pill tone={r.units < 10 ? "bad" : "warn"}>Low</Pill> : undefined,
            }))}
        />
      </ChartBlock>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-line bg-canvas border-y text-left">
            <tr>
              <Th>Product</Th>
              <Th right>Unit cost</Th>
              <Th right>Counted</Th>
              <Th right>Sold since</Th>
              <Th right>On hand</Th>
              <Th right>Value</Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.map((r) => (
              <tr key={r.item.id}>
                <Td>
                  <div className="font-medium">{r.item.name}</div>
                  <div className="text-muted font-mono text-xs">{r.item.sku}</div>
                </Td>
                <Td right className="tnum text-ink-2 font-mono">
                  {money2(r.item.unitCost)}
                </Td>
                <Td right>
                  <EditableNumber
                    value={r.item.units}
                    display={num(r.item.units)}
                    step="1"
                    label={`Counted units of ${r.item.name}`}
                    onCommit={(n) => recountStock(r.item.id, n)}
                  />
                </Td>
                <Td right className="tnum text-muted font-mono">
                  {r.sold ? `−${r.sold}` : "0"}
                </Td>
                <Td right>
                  <span className="inline-flex items-center gap-2">
                    {r.units < 20 && <Pill tone={r.units < 10 ? "bad" : "warn"}>Low</Pill>}
                    <span className="tnum font-mono font-medium">{num(r.units)}</span>
                  </span>
                </Td>
                <Td right className="tnum font-mono">
                  {money(r.value)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-line flex justify-between border-t px-5 py-3 text-[13px]">
        <span className="text-muted">Stock value at cost</span>
        <span className="tnum font-mono font-semibold">{money(total)}</span>
      </div>
    </Card>
  );
}

function CashTable() {
  const d = useDerived();
  const recountCash = useStore((s) => s.recountCash);
  const rows = accountBalances(d.data);

  return (
    <Card>
      <CardHeader title="Cash" sub="Where your money sits. Orders and expenses move these balances until you type a fresh count." />
      <ChartBlock title="Where the cash sits today">
        <PartsBar
          format={money}
          parts={rows.map((r, i) => ({ label: r.account.name, value: r.balance, color: CASH_STEPS[i % CASH_STEPS.length] }))}
        />
      </ChartBlock>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-line bg-canvas border-y text-left">
            <tr>
              <Th>Account</Th>
              <Th right>Last count</Th>
              <Th right>Since then</Th>
              <Th right>Now</Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.map((r) => (
              <tr key={r.account.id}>
                <Td>
                  <div className="font-medium">{r.account.name}</div>
                  <div className="text-muted text-[12px]">{r.account.note}</div>
                </Td>
                <Td right>
                  <EditableNumber
                    value={r.account.balance}
                    display={money2(r.account.balance)}
                    label={`Counted balance of ${r.account.name}`}
                    onCommit={(n) => recountCash(r.account.id, n)}
                  />
                </Td>
                <Td right className={cn("tnum font-mono", r.flows > 0 ? "text-good" : r.flows < 0 ? "text-bad" : "text-muted")}>
                  {r.flows === 0 ? "—" : `${r.flows > 0 ? "+" : "−"}${money2(Math.abs(r.flows))}`}
                </Td>
                <Td right className="tnum font-mono font-medium">
                  {money2(r.balance)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-line flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-[13px]">
        <span className="text-muted">Cash today ÷ {money(d.metrics.weeklyFixed)} a week of fixed costs and owner pay</span>
        <span className="tnum font-mono">
          <span className="font-semibold">{money(d.metrics.cash)}</span> = {d.metrics.runwayWeeks.toFixed(1)} weeks
        </span>
      </div>
    </Card>
  );
}

/** One blue, dark to light: the accounts are parts of one total, ordered by how quickly the cash can be spent. */
const CASH_STEPS = ["#184f95", "#2a78d6", "#6da7ec", "#b7d3f6"];

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-line bg-canvas/60 mt-4 border-y px-5 py-4">
      <Caps className="mb-3">{title}</Caps>
      {children}
    </div>
  );
}

function CategoryLabel({ category }: { category: ExpenseCategory }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="text-muted size-3.5" aria-hidden />
      {category}
    </span>
  );
}
