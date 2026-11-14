import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { PlansView } from "@/components/plans/PlansView";

export const metadata: Metadata = { title: "Plans" };

export default function PlansPage() {
  return (
    <Ready>
      <PlansView />
    </Ready>
  );
}
