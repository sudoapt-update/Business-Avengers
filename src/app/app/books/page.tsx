import { Suspense } from "react";
import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { BooksView } from "@/components/books/BooksView";

export const metadata: Metadata = { title: "Books" };

export default function BooksPage() {
  return (
    <Ready>
      {/* BooksView reads ?tab= with useSearchParams, which needs a Suspense boundary when prerendering. */}
      <Suspense fallback={null}>
        <BooksView />
      </Suspense>
    </Ready>
  );
}
