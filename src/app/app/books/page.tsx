import type { Metadata } from "next";
import { Ready } from "@/components/app/Ready";
import { BooksView } from "@/components/books/BooksView";

export const metadata: Metadata = { title: "Books" };

export default function BooksPage() {
  return (
    <Ready>
      <BooksView />
    </Ready>
  );
}
