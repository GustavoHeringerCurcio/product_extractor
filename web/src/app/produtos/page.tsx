import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

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
        <ul className="space-y-3">
          {rows.map((row) => {
            const titles = (row.titles as string[]) ?? [];
            return (
              <li key={row.id}>
                <Link
                  href={`/produtos/${row.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900">
                      {row.productName}
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {titles[0] ?? row.description}
                    </p>
                  </div>
                  {row.sellPriceBrl != null && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-500">Venda</p>
                      <p className="font-semibold text-emerald-700">
                        {formatBrl(row.sellPriceBrl)}
                      </p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
