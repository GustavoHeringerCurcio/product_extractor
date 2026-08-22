import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SavedProductView } from "@/components/SavedProductView";
import type { AnalyzedProduct } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function ProdutoDetalhePage(
  props: PageProps<"/produtos/[id]">,
) {
  const { id } = await props.params;

  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) notFound();

  const product: AnalyzedProduct = {
    id: row.id,
    productName: row.productName,
    category: row.category,
    specs: (row.specs as string[]) ?? [],
    aliPrice: row.aliPrice,
    currency: (row.currency as AnalyzedProduct["currency"]) ?? null,
    mediumPriceBrl: row.mediumPriceBrl ?? 0,
    sellPriceBrl: row.sellPriceBrl ?? 0,
    title: row.title,
    description: row.description,
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/produtos"
        className="mb-6 inline-block text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Voltar para Meus produtos
      </Link>
      <SavedProductView product={product} />
    </div>
  );
}
