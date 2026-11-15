import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { TimeMachineView } from "@/components/time-machine/TimeMachineView";

export const metadata: Metadata = { title: "Time Machine" };

export default function TimeMachinePage() {
  return (
    <Ready>
      <TimeMachineView />
    </Ready>
  );
}
