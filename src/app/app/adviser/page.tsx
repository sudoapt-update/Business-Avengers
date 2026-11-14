import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { AdviserView } from "@/components/adviser/AdviserView";

export const metadata: Metadata = { title: "AI Adviser" };

export default function AdviserPage() {
  return (
    <Ready>
      <AdviserView />
    </Ready>
  );
}
