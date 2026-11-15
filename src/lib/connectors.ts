import type { Tier } from "./types";

// Mock connections. Nothing here reaches a real account: connecting only flips a flag in the demo's own state.

export type ConnectorGroup = "Online stores" | "Marketplaces" | "Payments" | "Accounting";

export interface Connector {
  id:
    | "shopify"
    | "woocommerce"
    | "bigcommerce"
    | "squarespace"
    | "wix"
    | "amazon"
    | "etsy"
    | "ebay"
    | "walmart"
    | "tiktok"
    | "stripe"
    | "paypal"
    | "square"
    | "quickbooks"
    | "xero";
  name: string;
  group: ConnectorGroup;
  /** What FinPath would read from it. */
  reads: string;
  /** Connected in the sample store from the start. */
  builtIn?: boolean;
}

export const CONNECTOR_GROUPS: { group: ConnectorGroup; sub: string }[] = [
  { group: "Online stores", sub: "Orders, refunds and checkout fees from your own shop." },
  { group: "Marketplaces", sub: "Orders with referral and fulfilment fees split out." },
  { group: "Payments", sub: "Payouts and card fees, matched to the orders they belong to." },
  { group: "Accounting", sub: "Send clean books to the tool your accountant uses." },
];

export const CONNECTORS: Connector[] = [
  { id: "shopify", name: "Shopify", group: "Online stores", reads: "Orders, payouts, shipping labels", builtIn: true },
  { id: "woocommerce", name: "WooCommerce", group: "Online stores", reads: "Orders and refunds" },
  { id: "bigcommerce", name: "BigCommerce", group: "Online stores", reads: "Orders and refunds" },
  { id: "squarespace", name: "Squarespace", group: "Online stores", reads: "Orders and transaction fees" },
  { id: "wix", name: "Wix", group: "Online stores", reads: "Orders and transaction fees" },
  { id: "amazon", name: "Amazon", group: "Marketplaces", reads: "Orders, referral and fulfilment fees", builtIn: true },
  { id: "etsy", name: "Etsy", group: "Marketplaces", reads: "Orders, listing and transaction fees" },
  { id: "ebay", name: "eBay", group: "Marketplaces", reads: "Orders and final value fees" },
  { id: "walmart", name: "Walmart Marketplace", group: "Marketplaces", reads: "Orders and referral fees" },
  { id: "tiktok", name: "TikTok Shop", group: "Marketplaces", reads: "Orders, commission and affiliate fees" },
  { id: "stripe", name: "Stripe", group: "Payments", reads: "Payouts and processing fees" },
  { id: "paypal", name: "PayPal", group: "Payments", reads: "Payments and processing fees" },
  { id: "square", name: "Square", group: "Payments", reads: "Card-reader sales at the market" },
  { id: "quickbooks", name: "QuickBooks", group: "Accounting", reads: "Sends income and expenses" },
  { id: "xero", name: "Xero", group: "Accounting", reads: "Sends income and expenses" },
];

/** How many platforms a plan can add on top of the two built in. Starter keeps it small. */
export const extraConnectionsFor = (tier: Tier) => (tier === "starter" ? 2 : Infinity);
export const CONNECT_REWARD = 25;
