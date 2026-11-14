"use client";

import { RefreshCw } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { longDay } from "@/lib/date";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/primitives";
import { AlertBanner, KpiRow } from "@/components/overview/Kpis";
import { HealthCard } from "@/components/overview/HealthCard";
import { LevelCard, MissionsRail } from "@/components/overview/Missions";
import { OrderFeed, ProfitBridge, TopLeaks } from "@/components/overview/Money";
import { AdviserPrompt, PlanStrip } from "@/components/overview/Plan";

export function OverviewView() {
  const d = useDerived();
  const simulateOrder = useStore((s) => s.simulateOrder);

  return (
    <>
      <PageHeader
        title="Overview"
        sub={`${longDay(d.today)} · how the shop is really doing, and the one thing to do next.`}
        actions={
          <Button onClick={simulateOrder}>
            <RefreshCw className="size-3.5" /> Simulate order
          </Button>
        }
      />
      <div className="space-y-4">
        <AlertBanner />
        <KpiRow />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <HealthCard />
            <OrderFeed />
            <ProfitBridge />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <MissionsRail />
            <LevelCard />
            <TopLeaks />
            <AdviserPrompt />
          </div>
        </div>
        <PlanStrip />
      </div>
    </>
  );
}
