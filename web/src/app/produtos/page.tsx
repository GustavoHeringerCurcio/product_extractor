import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductList } from "@/components/ProductList";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const products = rows.map((row) => ({
    id: row.id,
    productName: row.productName,
    subtitle: row.title ?? row.description,
    sellPriceBrl: row.sellPriceBrl,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Meus produtos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seus anúncios salvos, prontos para copiar e publicar de novo.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">
            Nenhum produto salvo ainda.{" "}
            <Link
              href="/"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Crie seu primeiro anúncio
            </Link>
            .
          </p>
        </div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
}
