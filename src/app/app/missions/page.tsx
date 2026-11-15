import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { MissionsView } from "@/components/missions/MissionsView";

export const metadata: Metadata = { title: "Missions" };

export default function MissionsPage() {
  return (
    <Ready>
      <MissionsView />
    </Ready>
  );
}
