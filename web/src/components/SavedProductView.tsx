"use client";

import { useRouter } from "next/navigation";
import { ProductResultCard } from "./ProductResultCard";
import type { AnalyzedProduct } from "@/lib/schema";

export function SavedProductView({ product }: { product: AnalyzedProduct }) {
  const router = useRouter();
  return (
    <ProductResultCard
      product={product}
      mode="saved"
      onDeleted={() => {
        router.push("/produtos");
        router.refresh();
      }}
    />
  );
}
