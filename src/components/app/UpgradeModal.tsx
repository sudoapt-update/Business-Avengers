"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useStore } from "@/store/store";
import { TIERS, tierRank } from "@/lib/tiers";
import { useDerived } from "@/store/derived";
import { cn, money, num } from "@/lib/format";
import { Button, Pill } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";

export function UpgradeModal() {
  const upgrade = useStore((s) => s.upgrade);
  const tier = useStore((s) => s.tier);
  const { openUpgrade, setTier } = useStore.getState();
  const options = TIERS.filter((t) => tierRank(t.id) > tierRank(tier)).slice(0, 2);
  const leaks = useDerived().metrics.leakMonthly;

  return (
    <Dialog open={!!upgrade} onClose={() => openUpgrade(null)} title={upgrade?.title ?? ""} sub={upgrade?.body}>
      <div className="space-y-3 p-5">
        {leaks > 0 && options[0] && (
          <p className="rounded-lg bg-canvas px-3 py-2 text-[13px] text-ink-2">
            This store is leaking <span className="tnum font-mono font-medium text-ink">{money(leaks)}/mo</span>. {options[0].name} costs $
            {options[0].price}, so fixing the leaks pays for it {(leaks / options[0].price).toFixed(1)} times over.
          </p>
        )}
        {options.map((t, i) => (
          <div key={t.id} className={cn("rounded-card border p-4", i === 0 ? "border-ink" : "border-line")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{t.name}</span>
                {t.id === "growth" && <Pill tone="good">Recommended</Pill>}
              </div>
              <span className="tnum font-mono text-sm">${t.price}/mo</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-[13px] text-ink-2">
              {t.adds.map((a) => (
                <li key={a} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-good" />
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-muted">
                {num(t.tokens)} tokens/mo · {t.rewardMultiplier}× mission rewards
              </span>
              <Button
                variant={i === 0 ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setTier(t.id);
                  openUpgrade(null);
                }}
              >
                Preview {t.name}
              </Button>
            </div>
          </div>
        ))}
        {options.length === 0 && <p className="text-sm text-muted">You are viewing the top plan.</p>}
        <p className="pt-1 text-xs text-muted">
          Demo only: no payment is taken. &ldquo;Preview&rdquo; switches the demo to that plan&apos;s real limits.{" "}
          <Link href="/app/plans" className="underline underline-offset-2" onClick={() => openUpgrade(null)}>
            Compare all plans
          </Link>
        </p>
      </div>
    </Dialog>
  );
}
