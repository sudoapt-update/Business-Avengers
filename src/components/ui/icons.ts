import {
  AppWindow,
  Boxes,
  Droplets,
  Mail,
  Megaphone,
  Package,
  PenTool,
  Printer,
  Store,
  Warehouse,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory } from "@/lib/types";
import type { TileTone } from "./primitives";

export const CATEGORY_ICON: Record<ExpenseCategory, LucideIcon> = {
  Software: AppWindow,
  Advertising: Megaphone,
  Packaging: Package,
  "Market booth": Store,
  Utilities: Wifi,
  Other: Warehouse,
};

/** What kind of tool a leak is about, keyed by the expense row it reads. */
const LEAK_ICON: Record<string, { icon: LucideIcon; tone: TileTone; kind: string }> = {
  e3: { icon: Mail, tone: "info", kind: "Email marketing" },
  e4: { icon: Boxes, tone: "violet", kind: "Inventory app" },
  e6: { icon: Printer, tone: "warn", kind: "Shipping labels" },
  e7: { icon: PenTool, tone: "good", kind: "Design tool" },
};

export const leakIcon = (expenseId: string) => LEAK_ICON[expenseId] ?? { icon: Droplets, tone: "bad" as TileTone, kind: "Subscription" };
