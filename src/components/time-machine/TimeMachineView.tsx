"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  BarChart3,
  Droplets,
  HeartPulse,
  Info,
  Lock,
  Megaphone,
  RotateCcw,
  SlidersHorizontal,
  Store,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { scoreBand, type Factor } from "@/lib/engine";
import { TIERS, tierRank } from "@/lib/tiers";
import {
  LEVER_ORDER,
  MOVE_RANGE,
  PRICE_RANGE,
  activeLevers,
  adsRange,
  baseLevers,
  isActive,
  simulate,
  type LeverId,
  type Levers,
} from "@/lib/timeMachine";
import { cn, money, signedMoney } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, CardHeader, Caps, IconTile, Pill, type TileTone } from "@/components/ui/primitives";
import { Explainer } from "@/components/app/Explainer";
import { AnimatedNumber } from "@/components/ui/charts";

const LEVER_META: Record<LeverId, { name: string; icon: LucideIcon; tone: TileTone }> = {
  price: { name: "Change your prices", icon: Tag, tone: "info" },
  ads: { name: "Monthly ad spend", icon: Megaphone, tone: "warn" },
  move: { name: "Move Amazon buyers to your store", icon: Store, tone: "good" },
  leaks: { name: "Fix every open leak", icon: Droplets, tone: "bad" },
};

const FACTOR_NAME: Partial<Record<Factor["key"], string>> = { freshness: "Books fresh" };

const signed = (n: number, digits = 1) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(digits)}`;

export function TimeMachineView() {
  const d = useDerived();
  const openUpgrade = useStore((s) => s.openUpgrade);
  const base = useMemo(() => baseLevers(d.data, d.today), [d.data, d.today]);
  const [levers, setLevers] = useState<Levers>(base);
  // A lever the visitor tried to move past their plan's limit, with the value they tried.
  const [blocked, setBlocked] = useState<{ id: LeverId; value: Levers[LeverId] } | null>(null);

  const scenario = useMemo(() => simulate(d.data, d.today, levers), [d.data, d.today, levers]);
  const active = activeLevers(levers, base);
  const limit = d.tier.whatIfLevers;
  const up = TIERS.find((t) => t.whatIfLevers > limit && tierRank(t.id) > tierRank(d.tier.id));
  const openLeaks = d.leaks.filter((l) => !l.applied);

  const change = <K extends LeverId>(id: K, value: Levers[K]) => {
    const next = { ...levers, [id]: value };
    if (!isActive(levers, base, id) && isActive(next, base, id) && active.length >= limit) {
      setBlocked({ id, value });
      return;
    }
    setBlocked(null);
    setLevers(next);
  };

  const tryInstead = () => {
    if (!blocked) return;
    setLevers({ ...base, [blocked.id]: blocked.value });
    setBlocked(null);
  };

  const reset = () => {
    setLevers(base);
    setBlocked(null);
  };

  const ads = adsRange(base.ads);

  return (
    <>
      <PageHeader
        title="Time Machine"
        sub="Try a change on your last 30 days before you make it for real."
        actions={
          <Button onClick={reset} disabled={active.length === 0 && !blocked}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        }
      />

      <div className="mb-4">
        <Explainer>
          The Time Machine replays your last 30 days with the changes you pick, then runs the same Health Score formula as the rest of the
          app. A price change keeps the same number of orders, and ad spend counts as a cost only, since the simulator can&apos;t know what
          extra ads would sell. It is read-only: nothing here changes your Books, orders or score, and it resets when you leave.
        </Explainer>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:sticky lg:top-20 lg:col-span-5">
          <Card>
            <CardHeader
              icon={
                <IconTile tone="info">
                  <SlidersHorizontal />
                </IconTile>
              }
              title="Your changes"
              sub={
                limit >= LEVER_ORDER.length
                  ? `${d.tier.name} plan: combine all four.`
                  : `${d.tier.name} plan: ${limit === 1 ? "one change at a time" : `up to ${limit} changes together`}. ${active.length} in use.`
              }
            />
            <div className="divide-line border-line mt-4 divide-y border-t">
              <Lever
                id="price"
                on={isActive(levers, base, "price")}
                value={levers.price > 0 ? `+${levers.price}%` : levers.price < 0 ? `−${-levers.price}%` : ""}
                help="The same number of orders, each at the new price. Percentage fees move with it."
                onClear={() => change("price", 0)}
              >
                <Slider
                  label="Price change"
                  {...PRICE_RANGE}
                  value={levers.price}
                  base={0}
                  onChange={(v) => change("price", v)}
                  ends={["−10%", "+20%"]}
                  valueText={(v) => `${v}%`}
                />
              </Lever>

              <Lever
                id="ads"
                on={isActive(levers, base, "ads")}
                value={isActive(levers, base, "ads") ? `${money(levers.ads)}/mo` : `Today: ${money(base.ads)}/mo`}
                help="Cost only. Sales stay the same, so this shows what the spend costs, not what it brings in."
                onClear={() => change("ads", base.ads)}
              >
                <Slider
                  label="Monthly ad spend"
                  {...ads}
                  value={levers.ads}
                  base={base.ads}
                  onChange={(v) => change("ads", v)}
                  ends={[money(ads.min), money(ads.max)]}
                  valueText={(v) => `${money(v)} a month`}
                />
              </Lever>

              <Lever
                id="move"
                on={isActive(levers, base, "move")}
                value={levers.move ? `${levers.move}%` : ""}
                help="Those orders pay card fees and postage on your store instead of Amazon's referral and fulfilment fees."
                onClear={() => change("move", 0)}
              >
                <Slider
                  label="Share of Amazon orders moved"
                  {...MOVE_RANGE}
                  value={levers.move}
                  base={0}
                  onChange={(v) => change("move", v)}
                  ends={["None", "Half"]}
                  valueText={(v) => `${v}% of Amazon orders`}
                />
              </Lever>

              <Lever
                id="leaks"
                on={levers.leaks}
                value={levers.leaks ? `${scenario.leaksFixed} fixed` : ""}
                help={
                  openLeaks.length
                    ? `Switch all ${openLeaks.length} to the cheaper option: ${money(d.metrics.leakMonthly)} a month less in running costs.`
                    : "Every leak is already fixed."
                }
                onClear={() => change("leaks", false)}
                inline={
                  <Toggle
                    label="Fix every open leak"
                    checked={levers.leaks}
                    disabled={!openLeaks.length}
                    onChange={(v) => change("leaks", v)}
                  />
                }
              />
            </div>

            {blocked && (
              <div className="border-line bg-warn-bg animate-fade-in border-t px-5 py-4" role="status">
                <div className="flex items-start gap-2.5">
                  <Lock className="text-warn mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="min-w-0 text-[13px]">
                    <p className="text-ink font-medium">
                      {d.tier.name} tries {limit === 1 ? "one change at a time" : `up to ${limit} changes together`}.
                    </p>
                    <p className="text-ink-2 mt-0.5">
                      Clear {limit === 1 ? `“${LEVER_META[active[0]].name.toLowerCase()}”` : "a change"} to try{" "}
                      {LEVER_META[blocked.id].name.toLowerCase()}
                      {up ? `, or combine ${up.whatIfLevers === LEVER_ORDER.length ? "all four" : up.whatIfLevers} on ${up.name}.` : "."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={tryInstead}>
                        Try this one instead
                      </Button>
                      {up && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            openUpgrade({
                              title: `Combine changes on ${up.name}`,
                              body: `${up.name} lets the Time Machine run ${up.whatIfLevers === LEVER_ORDER.length ? "all four changes" : `${up.whatIfLevers} changes`} together, so you see how a price rise and a channel move add up.`,
                            })
                          }
                        >
                          See {up.name}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="border-line bg-canvas text-muted flex items-start gap-2 rounded-b-[var(--radius-card)] border-t px-5 py-3 text-[13px]">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />A simulation only. Nothing here changes your Books, orders or score.
            </p>
          </Card>
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-7">
          <ScoreTrack
            now={scenario.now.score}
            after={scenario.after.score}
            sentence={summary(levers, base, scenario)}
            changed={active.length > 0}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Compare
              label="True profit, 30 days"
              now={scenario.now.trueProfit}
              after={scenario.after.trueProfit}
              format={money}
              delta={signedMoney(scenario.after.trueProfit - scenario.now.trueProfit)}
              diff={scenario.after.trueProfit - scenario.now.trueProfit}
            />
            <Compare
              label="Margin"
              now={scenario.now.margin * 100}
              after={scenario.after.margin * 100}
              format={(n) => `${n.toFixed(1)}%`}
              delta={`${signed((scenario.after.margin - scenario.now.margin) * 100)} pts`}
              diff={scenario.after.margin - scenario.now.margin}
            />
            <Compare
              label="Cash runway"
              now={scenario.now.runwayWeeks}
              after={scenario.after.runwayWeeks}
              format={(n) => `${n.toFixed(1)} wk`}
              delta={`${signed(scenario.after.runwayWeeks - scenario.now.runwayWeeks)} wk`}
              diff={scenario.after.runwayWeeks - scenario.now.runwayWeeks}
            />
            <Compare
              label="Fees, share of sales"
              now={scenario.now.feeLoad * 100}
              after={scenario.after.feeLoad * 100}
              format={(n) => `${n.toFixed(1)}%`}
              delta={`${signed((scenario.after.feeLoad - scenario.now.feeLoad) * 100)} pts`}
              diff={scenario.now.feeLoad - scenario.after.feeLoad}
            />
          </div>

          <FactorBars now={scenario.now.factors} after={scenario.after.factors} />
        </div>
      </div>
    </>
  );
}

/** One plain sentence describing the scenario and its result. */
function summary(l: Levers, base: Levers, s: ReturnType<typeof simulate>) {
  const parts: string[] = [];
  if (l.price > 0) parts.push(`raising prices ${l.price}%`);
  if (l.price < 0) parts.push(`cutting prices ${-l.price}%`);
  if (l.ads < base.ads) parts.push(`cutting ads to ${money(l.ads)} a month`);
  if (l.ads > base.ads) parts.push(`raising ads to ${money(l.ads)} a month`);
  if (l.move > 0) parts.push(`moving ${l.move}% of Amazon orders to your store`);
  if (l.leaks && s.leaksFixed) parts.push(`fixing all ${s.leaksFixed} leaks`);
  if (!parts.length) return "Move a lever on the left. The numbers below replay your last 30 days with that change.";

  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
  const kept =
    Math.abs(s.profitDelta) < 0.5 ? "the same profit" : `${money(Math.abs(s.profitDelta))} ${s.profitDelta > 0 ? "more" : "less"}`;
  const sentence = `${list} would have kept you ${kept} over the last 30 days, and your score would be ${s.after.score.toFixed(1)} instead of ${s.now.score.toFixed(1)}.`;
  return sentence[0].toUpperCase() + sentence.slice(1);
}

function Lever({
  id,
  on,
  value,
  help,
  onClear,
  children,
  inline,
}: {
  id: LeverId;
  on: boolean;
  value: string;
  help: string;
  onClear: () => void;
  children?: ReactNode;
  /** A control shown in the header row instead of below it (the leaks toggle). */
  inline?: ReactNode;
}) {
  const meta = LEVER_META[id];
  const Icon = meta.icon;
  return (
    <div className={cn("px-5 py-4 transition-colors", on && "bg-info-bg/40")}>
      <div className="flex items-start gap-3">
        <IconTile tone={on ? meta.tone : "neutral"} size="sm">
          <Icon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{meta.name}</span>
            {inline ??
              (on ? (
                <span className="inline-flex items-center gap-1">
                  <span className="tnum bg-ink rounded-md px-1.5 py-0.5 font-mono text-xs font-medium text-white">{value}</span>
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-muted hover:bg-hover hover:text-ink grid size-6 place-items-center rounded-md"
                    aria-label={`Clear ${meta.name.toLowerCase()}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ) : (
                <span className="tnum text-muted font-mono text-xs">{value || "No change"}</span>
              ))}
          </div>
          <p className="text-muted mt-0.5 text-[13px]">{help}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  base,
  onChange,
  ends,
  valueText,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  base: number;
  onChange: (v: number) => void;
  ends: [string, string];
  valueText: (v: number) => string;
}) {
  const pos = (n: number) => (n - min) / (max - min);
  // The thumb's centre travels from 9px to (width − 9px), so marks use the same scale to line up with it.
  const at = (p: number) => `calc(9px + (100% - 18px) * ${p})`;
  const a = at(Math.min(pos(base), pos(value)));
  const b = at(Math.max(pos(base), pos(value)));
  // The filled part runs from today's value to the new one, so the track shows the size of the change.
  const track = `linear-gradient(to right, var(--color-line) 0%, var(--color-line) ${a}, var(--color-ink) ${a}, var(--color-ink) ${b}, var(--color-line) ${b}, var(--color-line) 100%)`;
  const basePos = pos(base);
  // When today's value sits at one end, that end's label says so instead of a separate "today" mark.
  const todayAt = basePos <= 0.1 ? "start" : basePos >= 0.9 ? "end" : "middle";
  return (
    <div>
      <div className="relative">
        <input
          type="range"
          className="tm-range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={valueText(value)}
          style={{ "--track": track } as CSSProperties}
        />
        <span
          className="bg-ink-2 pointer-events-none absolute top-[calc(50%+7px)] h-1.5 w-px -translate-x-1/2"
          style={{ left: at(basePos) }}
          aria-hidden
        />
      </div>
      <div className="tnum text-muted relative mt-1.5 flex h-4 justify-between font-mono text-[11px]">
        <span>{todayAt === "start" ? `${ends[0]} (today)` : ends[0]}</span>
        {todayAt === "middle" && (
          <span className="text-ink-2 absolute -translate-x-1/2" style={{ left: at(basePos) }}>
            today
          </span>
        )}
        <span>{todayAt === "end" ? `${ends[1]} (today)` : ends[1]}</span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-ink" : "bg-line-strong hover:bg-faint",
      )}
    >
      <span
        className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", checked && "translate-x-4")}
        aria-hidden
      />
    </button>
  );
}

/** The score on a 0–100 line: where it is today, where the change would put it, and the target. */
function ScoreTrack({ now, after, sentence, changed }: { now: number; after: number; sentence: string; changed: boolean }) {
  const diff = after - now;
  const lo = Math.min(now, after);
  const hi = Math.max(now, after);
  const band = scoreBand(after);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="flex items-center gap-2">
            <IconTile tone="info" size="sm">
              <HeartPulse />
            </IconTile>
            <Caps>Health score</Caps>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="tnum text-muted text-2xl font-medium tracking-tight">{now.toFixed(1)}</span>
            <span className="text-faint text-xl" aria-hidden>
              →
            </span>
            <span className="tnum from-brand-a-ink to-brand-b-ink bg-linear-to-r bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
              <AnimatedNumber value={after} format={(n) => n.toFixed(1)} />
            </span>
            <span className="sr-only">
              from {now.toFixed(1)} to {after.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pb-1.5">
          <Pill tone={band.tone}>{band.label}</Pill>
          <Pill tone={Math.abs(diff) < 0.05 ? "neutral" : diff > 0 ? "good" : "bad"} className="tnum font-mono">
            {signed(diff)} points
          </Pill>
        </div>
      </div>

      <div className="relative mt-6 mb-7 h-2" aria-hidden>
        <div className="bg-line absolute inset-0 rounded-full" />
        <div
          className={cn("absolute inset-y-0 rounded-full transition-[left,width] duration-500", diff >= 0 ? "bg-good-dot" : "bg-bad-dot")}
          style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        />
        <span className="bg-ink-2 absolute -top-1.5 h-5 w-px" style={{ left: "80%" }} />
        <span className="text-muted absolute top-4 -translate-x-1/2 font-mono text-[11px]" style={{ left: "80%" }}>
          target 80
        </span>
        <span
          className="border-ink-2 bg-panel absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${now}%` }}
        />
        <span
          className={cn(
            "from-brand-a to-brand-b absolute top-1/2 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-linear-to-r shadow transition-[left] duration-500",
            !changed && "opacity-0",
          )}
          style={{ left: `${after}%` }}
        />
        <span className="text-muted absolute top-4 left-0 font-mono text-[11px]">0</span>
        <span className="text-muted absolute top-4 right-0 font-mono text-[11px]">100</span>
      </div>

      <p className={cn("text-[17px] leading-snug tracking-tight", changed ? "text-ink" : "text-ink-2")} aria-live="polite">
        {sentence}
      </p>
    </Card>
  );
}

function Compare({
  label,
  now,
  after,
  format,
  delta,
  diff,
}: {
  label: string;
  now: number;
  after: number;
  format: (n: number) => string;
  delta: string;
  /** Positive when the change is good for the business. */
  diff: number;
}) {
  const flat = Math.abs(diff) < 1e-6;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <Caps>{label}</Caps>
        <Pill tone={flat ? "neutral" : diff > 0 ? "good" : "bad"} className="tnum font-mono">
          {flat ? "no change" : delta}
        </Pill>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="tnum text-[26px] leading-none font-semibold tracking-tight">
          <AnimatedNumber value={after} format={format} />
        </span>
        {!flat && <span className="tnum text-muted text-sm line-through decoration-1">{format(now)}</span>}
      </div>
    </Card>
  );
}

function FactorBars({ now, after }: { now: Factor[]; after: Factor[] }) {
  return (
    <Card>
      <CardHeader
        icon={
          <IconTile tone="violet">
            <BarChart3 />
          </IconTile>
        }
        title="What moves the score"
        sub="Each of the five parts, today and with your changes."
        right={
          <ul className="text-ink-2 flex shrink-0 items-center gap-3 text-xs" aria-label="Legend">
            <li className="inline-flex items-center gap-1.5">
              <span className="bg-ch-out h-1.5 w-3 rounded-full" aria-hidden /> Today
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="bg-info-dot h-1.5 w-3 rounded-full" aria-hidden /> With changes
            </li>
          </ul>
        }
      />
      <ul className="space-y-4 px-5 pt-4 pb-5">
        {now.map((f, i) => {
          const a = after[i];
          const diff = a.points - f.points;
          return (
            <li key={f.key} className="grid grid-cols-[8.5rem_minmax(0,1fr)_7.5rem] items-center gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm">{FACTOR_NAME[f.key] ?? f.label}</div>
                <div className="tnum text-muted font-mono text-xs">{a.reading}</div>
              </div>
              <div className="space-y-1" aria-hidden>
                <div className="bg-hover h-1.5 overflow-hidden rounded-full">
                  <div className="bg-ch-out h-full rounded-full" style={{ width: `${f.value * 100}%` }} />
                </div>
                <div className="bg-hover h-1.5 overflow-hidden rounded-full">
                  <div className="bg-info-dot h-full rounded-full transition-[width] duration-500" style={{ width: `${a.value * 100}%` }} />
                </div>
              </div>
              <div className="tnum flex items-center justify-end gap-2 text-right font-mono text-[13px]">
                <span>
                  {a.points.toFixed(1)}
                  <span className="text-faint">/{f.weight}</span>
                </span>
                <span
                  className={cn(
                    "w-11 text-xs",
                    Math.abs(diff) < 0.05 ? "text-faint" : diff > 0 ? "text-good font-medium" : "text-bad font-medium",
                  )}
                >
                  {Math.abs(diff) < 0.05 ? "—" : signed(diff)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
