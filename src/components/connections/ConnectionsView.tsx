"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Lock, PenLine, Plug, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/store";
import { useDerived } from "@/store/derived";
import { CONNECTORS, CONNECTOR_GROUPS, CONNECT_REWARD, extraConnectionsFor, type Connector } from "@/lib/connectors";
import { cn } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Explainer } from "@/components/app/Explainer";
import { Button, Card, Caps, IconTile, Pill } from "@/components/ui/primitives";
import { BrandIcon } from "@/components/ui/brand";

export function ConnectionsView() {
  const d = useDerived();
  const extra = d.data.connections ?? [];
  const builtIn = CONNECTORS.filter((c) => c.builtIn).length;
  const connected = builtIn + extra.length;
  const limit = extraConnectionsFor(d.tier.id);
  const rewardOpen = !d.data.badges.some((b) => b.id === "connected");

  return (
    <>
      <PageHeader title="Connections" sub="Where FinPath reads your sales, fees and payouts from. Connect a platform once and its orders arrive on their own." />
      <div className="space-y-4">
        <div className="rounded-card border-info-dot/30 bg-info-bg flex items-center gap-3 border px-4 py-3 sm:px-5">
          <span className="bg-panel text-info grid size-8 shrink-0 place-items-center rounded-lg" aria-hidden>
            <ShieldCheck className="size-4" />
          </span>
          <p className="text-ink-2 text-[13px]">
            <span className="text-ink font-medium">Demo connections — no real account is accessed.</span> Connecting here asks for no
            password and sends nothing anywhere. Sample orders keep arriving from Shopify and Amazon.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-4 sm:p-5">
            <IconTile tone="good" size="lg">
              <Plug />
            </IconTile>
            <div>
              <Caps>Connected</Caps>
              <div className="tnum mt-1 text-2xl leading-none font-semibold tracking-tight">
                {connected}
                <span className="text-muted ml-1 text-base font-medium">of {CONNECTORS.length}</span>
              </div>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4 sm:p-5">
            <IconTile tone="violet" size="lg">
              <Lock />
            </IconTile>
            <div className="min-w-0">
              <Caps>{d.tier.name} plan</Caps>
              <div className="mt-1 text-sm font-medium">
                {limit === Infinity ? "Every platform included" : `${Math.max(0, limit - extra.length)} of ${limit} extra connections left`}
              </div>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4 sm:p-5">
            <IconTile tone="warn" size="lg">
              <Check />
            </IconTile>
            <div className="min-w-0">
              <Caps>First new connection</Caps>
              <div className="mt-1 text-sm font-medium">
                {rewardOpen ? `Earns +${Math.round(CONNECT_REWARD * d.tier.rewardMultiplier)} tokens and a badge` : "Reward earned"}
              </div>
            </div>
          </Card>
        </div>

        <Explainer>
          Each platform takes its fees before the money reaches you, and each reports them differently. A connection pulls the orders in
          with the fees already split out, so the Health Score and Books stay current without typing. Market sales taken in cash have no
          platform to connect; those you add by hand in{" "}
          <Link href="/app/books" className="text-ink underline underline-offset-2">
            Books
          </Link>
          .
        </Explainer>

        {CONNECTOR_GROUPS.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 px-1 pt-2">
              <h2 className="text-[15px] font-semibold tracking-tight">{g.group}</h2>
              <p className="text-muted text-[13px]">{g.sub}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CONNECTORS.filter((c) => c.group === g.group).map((c) => (
                <ConnectorCard key={c.id} c={c} on={!!c.builtIn || extra.includes(c.id)} />
              ))}
              {g.group === "Marketplaces" && (
                <li className="rounded-card border-line-strong flex items-center gap-3 border border-dashed p-4">
                  <BrandIcon id="market" size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Weekend market</div>
                    <div className="text-muted text-[13px]">Cash and card sales at the stall</div>
                  </div>
                  <Link
                    href="/app/books"
                    className="border-line-strong bg-panel hover:bg-hover inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium"
                  >
                    <PenLine className="size-3.5" /> Add by hand
                  </Link>
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function ConnectorCard({ c, on }: { c: Connector; on: boolean }) {
  const { connectPlatform, disconnectPlatform } = useStore.getState();
  const [busy, setBusy] = useState(false);

  const connect = () => {
    setBusy(true);
    // A short pause stands in for the platform's sign-in step.
    setTimeout(() => {
      connectPlatform(c.id);
      setBusy(false);
    }, 900);
  };

  return (
    <li className={cn("rounded-card bg-panel flex items-center gap-3 border p-4 transition-colors", on ? "border-good-dot/40" : "border-line")}>
      <BrandIcon id={c.id} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{c.name}</span>
          {on && (
            <Pill tone="good" className="animate-pop">
              <Check className="size-3" strokeWidth={3} /> Connected · demo
            </Pill>
          )}
        </div>
        <div className="text-muted truncate text-[13px]" title={c.reads}>
          {c.reads}
        </div>
      </div>
      {on ? (
        c.builtIn ? (
          <span className="text-muted shrink-0 font-mono text-xs">syncing</span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => disconnectPlatform(c.id)} aria-label={`Disconnect ${c.name}`}>
            Disconnect
          </Button>
        )
      ) : (
        <Button size="sm" variant="primary" onClick={connect} disabled={busy} aria-label={`Connect ${c.name}`}>
          {busy ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Connecting
            </>
          ) : (
            "Connect"
          )}
        </Button>
      )}
    </li>
  );
}
