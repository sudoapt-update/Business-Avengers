import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { OverviewView } from "@/components/overview/OverviewView";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <Ready>
      <OverviewView />
    </Ready>
  );
}
