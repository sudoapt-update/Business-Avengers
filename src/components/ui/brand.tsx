import { Store } from "lucide-react";
import { cn } from "@/lib/format";
import type { Channel } from "@/lib/types";
import { BRAND_PATHS } from "./brand-paths";

export type BrandId = keyof typeof BRAND_PATHS | "market";

/** Chart colour for each sales channel. The same channel keeps the same colour on every screen. */
export const CHANNEL_COLOR: Record<Channel, string> = {
  shopify: "var(--color-ch-shopify)",
  amazon: "var(--color-ch-amazon)",
  market: "var(--color-ch-market)",
};

const SIZES = {
  xs: { tile: "size-5 rounded-[5px]", icon: "size-3" },
  sm: { tile: "size-7 rounded-md", icon: "size-4" },
  md: { tile: "size-9 rounded-lg", icon: "size-5" },
  lg: { tile: "size-11 rounded-[10px]", icon: "size-6" },
} as const;

/** A platform's logo on a small white tile. The market stall has no brand, so it gets a plain icon. */
export function BrandIcon({ id, size = "sm", className }: { id: BrandId; size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={cn("border-line bg-panel grid shrink-0 place-items-center border", s.tile, className)} aria-hidden>
      {id === "market" ? (
        <Store className={s.icon} style={{ color: "var(--color-ch-market)" }} strokeWidth={2} />
      ) : (
        <svg viewBox="0 0 24 24" className={cn(s.icon, id === "woocommerce" && "scale-[1.35]")} fill={BRAND_PATHS[id].hex}>
          <path d={BRAND_PATHS[id].d} />
        </svg>
      )}
    </span>
  );
}
