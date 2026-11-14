"use client";

import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { Card } from "@/components/ui/primitives";

/** Placeholder for screens later in the build order; the Overview already covers their core action. */
export function ComingNext({ title, sub, note }: { title: string; sub: string; note: string }) {
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <Card className="p-6">
        <p className="text-ink-2 text-sm">{note}</p>
        <Link href="/app" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
          Back to Overview
        </Link>
      </Card>
    </>
  );
}
