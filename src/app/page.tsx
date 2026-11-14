import { redirect } from "next/navigation";

// This route only redirects, so there is nothing to render instantly.
export const instant = false;

// The landing page is built after the core app (see docs/PLAN.md). Until then, go straight to the demo.
export default function Home() {
  redirect("/app");
}
