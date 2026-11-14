import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { LeaksView } from "@/components/leaks/LeaksView";

export const metadata: Metadata = { title: "Leaks" };

export default function LeaksPage() {
  return (
    <Ready>
      <LeaksView />
    </Ready>
  );
}
