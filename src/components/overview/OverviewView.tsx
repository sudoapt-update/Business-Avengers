"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, ChevronsDownUp, ChevronsUpDown, Compass, RefreshCw, Sun } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { diffDays, longDay } from "@/lib/date";
import { weeklyCashflow } from "@/lib/engine";
import { money, signedMoney } from "@/lib/format";
import { SECTION_IDS, loadSections, saveSections, type SectionId, type SectionState } from "@/lib/sections";
import { PageHeader } from "@/components/app/PageHeader";
import { Band, BandStat, Button } from "@/components/ui/primitives";
import { AlertBanner, KpiRow } from "@/components/overview/Kpis";
import { HealthCard } from "@/components/overview/HealthCard";
import { LevelCard, MissionsRail, OPEN_SECTION_EVENT } from "@/components/overview/Missions";
import { CashFlowCard, OrderFeed, ProfitBridge, TopLeaks } from "@/components/overview/Money";
import { AdviserPrompt, PlanStrip } from "@/components/overview/Plan";

export function OverviewView() {
  const d = useDerived();
  const simulateOrder = useStore((s) => s.simulateOrder);
  // This component only mounts in the browser, after <Ready> has loaded the demo store, so it is
  // never part of the server-rendered HTML. Reading localStorage in the initializer therefore
  // cannot cause a hydration mismatch, and the saved state is there on the first paint (no flicker).
  const [open, setOpenState] = useState<SectionState>(loadSections);
  const latest = useRef(open);
  // Every change goes through here, so the state is saved in the handler that caused it, not in an effect.
  const update = useCallback((change: (o: SectionState) => SectionState) => {
    const next = change(latest.current);
    latest.current = next;
    setOpenState(next);
    saveSections(next);
  }, []);
  const toggle = (id: SectionId) => update((o) => ({ ...o, [id]: !o[id] }));
  const allOpen = SECTION_IDS.every((id) => open[id]);

  // Actions elsewhere on the page (a mission) can ask for a section to open.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<SectionId>).detail;
      update((o) => (o[id] ? o : { ...o, [id]: true }));
    };
    window.addEventListener(OPEN_SECTION_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SECTION_EVENT, onOpen);
  }, [update]);

  const m = d.metrics;
  const net = weeklyCashflow(d.data, d.today, 8).reduce((s, w) => s + w.net, 0);
  const planDay = Math.min(90, diffDays(d.today, d.data.planStart) + 1);

  return (
    <>
      <PageHeader
        title="Overview"
        sub={`${longDay(d.today)} · how the shop is really doing, and the one thing to do next.`}
        actions={
          <Button
            onClick={() => {
              simulateOrder();
              // The new order lands in the Money section, so show it.
              update((o) => (o.money ? o : { ...o, money: true }));
            }}
          >
            <RefreshCw className="size-3.5" /> Simulate order
          </Button>
        }
      />
      <div className="space-y-4">
        <AlertBanner />
        <KpiRow />

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-muted text-[13px]">Open a section for the detail behind these numbers.</p>
          <button
            type="button"
            onClick={() => update(() => ({ today: !allOpen, money: !allOpen, next: !allOpen }))}
            className="text-ink-2 hover:bg-hover inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium"
          >
            {allOpen ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <Band
          id="today"
          icon={<Sun />}
          tone="warn"
          title="Today"
          sub="Your score and the missions that move it."
          open={open.today}
          onToggle={() => toggle("today")}
          summary={
            <>
              <BandStat label="Score" value={m.score.toFixed(1)} />
              <BandStat label="Missions" value={`${d.missionsDone}/${d.missions.length}`} />
              <BandStat label="Streak" value={`${d.streak}d`} />
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <HealthCard />
              <LevelCard />
            </div>
            <div className="lg:col-span-4">
              <MissionsRail />
            </div>
          </div>
        </Band>

        <Band
          id="money"
          icon={<Banknote />}
          tone="good"
          title="Money"
          sub="What came in, what went out and what you kept."
          open={open.money}
          onToggle={() => toggle("money")}
          summary={
            <>
              <BandStat label="Net, 8 wk" value={signedMoney(net)} />
              <BandStat label="Profit, 30d" value={money(m.trueProfit)} />
              <BandStat label="Cash" value={money(m.cash)} />
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <CashFlowCard />
            </div>
            <div className="lg:col-span-5">
              <ProfitBridge />
            </div>
            <div className="lg:col-span-12">
              <OrderFeed />
            </div>
          </div>
        </Band>

        <Band
          id="next"
          icon={<Compass />}
          tone="info"
          title="Next steps"
          sub="Leaks to stop, the plan you are on and questions worth asking."
          open={open.next}
          onToggle={() => toggle("next")}
          summary={
            <>
              <BandStat label="Leaks" value={`${m.leakCount} · ${money(m.leakMonthly)}/mo`} />
              <BandStat label="Plan" value={`Day ${planDay}/90`} />
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <PlanStrip />
            </div>
            <div className="lg:col-span-6">
              <TopLeaks />
            </div>
            <div className="lg:col-span-6">
              <AdviserPrompt />
            </div>
          </div>
        </Band>
      </div>
    </>
  );
}
