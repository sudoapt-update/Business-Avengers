import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { ConnectionsView } from "@/components/connections/ConnectionsView";

export const metadata: Metadata = { title: "Connections" };

export default function ConnectionsPage() {
  return (
    <Ready>
      <ConnectionsView />
    </Ready>
  );
}
