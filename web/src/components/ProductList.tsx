"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatBrl } from "@/lib/format";

export type ProductListItem = {
  id: string;
  productName: string;
  subtitle: string;
  sellPriceBrl: number | null;
};

export function ProductList({ products }: { products: ProductListItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
        >
          <Link href={`/produtos/${p.id}`} className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-900">
              {p.productName}
            </p>
            <p className="truncate text-sm text-zinc-500">{p.subtitle}</p>
          </Link>

          {p.sellPriceBrl != null && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-zinc-500">Venda</p>
              <p className="font-semibold text-emerald-700">
                {formatBrl(p.sellPriceBrl)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => remove(p.id)}
            disabled={deletingId === p.id}
            className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={`Excluir ${p.productName}`}
            title="Excluir"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
