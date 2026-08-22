"use client";

import { useState } from "react";
import type { AnalyzedProduct } from "@/lib/schema";
import { formatBrl } from "@/lib/format";
import { CopyButton } from "./CopyButton";
import { ReferencePhotos } from "./ReferencePhotos";

type Props = {
  product: AnalyzedProduct;
  mode: "new" | "saved";
  onDeleted?: (id: string) => void;
};

export function ProductResultCard({ product, mode, onDeleted }: Props) {
  const [titles, setTitles] = useState<string[]>(product.titles);
  const [description, setDescription] = useState(product.description);
  const [selected, setSelected] = useState(0);
  const [showAllTitles, setShowAllTitles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload: AnalyzedProduct = {
    ...product,
    titles,
    description,
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res =
        mode === "new"
          ? await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/products/${product.id ?? ""}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao salvar.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!product.id) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) onDeleted?.(product.id);
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {product.productName}
          </h2>
          {product.category && (
            <p className="text-sm text-zinc-500">{product.category}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Preço médio (BRL)</p>
          <p className="text-lg font-semibold text-zinc-700">
            {formatBrl(product.mediumPriceBrl)}
          </p>
        </div>
      </div>

      {product.specs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {product.specs.map((spec, i) => (
            <span
              key={i}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
            >
              {spec}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-xs text-emerald-700">Preço sugerido de venda</p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatBrl(product.sellPriceBrl)}
          </p>
        </div>
        <p className="ml-auto text-xs text-emerald-700/70">
          médio + R$ 50
        </p>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            Títulos sugeridos
          </h3>
          <CopyButton text={titles[selected] ?? ""} label="Copiar selecionado" />
        </div>

        {showAllTitles ? (
          <ol className="space-y-2">
            {titles.map((title, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-lg border p-2 ${
                  selected === i
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name={`title-${product.id ?? product.productName}`}
                  checked={selected === i}
                  onChange={() => {
                    setSelected(i);
                    setShowAllTitles(false);
                  }}
                  className="shrink-0 accent-zinc-900"
                  aria-label={`Selecionar título ${i + 1}`}
                />
                <input
                  value={title}
                  onChange={(e) =>
                    setTitles((prev) =>
                      prev.map((t, j) => (j === i ? e.target.value : t)),
                    )
                  }
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-800 focus:border-zinc-300 focus:bg-white focus:outline-none"
                />
                <CopyButton text={title} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-50 p-2">
              <input
                value={titles[selected] ?? ""}
                onChange={(e) =>
                  setTitles((prev) =>
                    prev.map((t, j) => (j === selected ? e.target.value : t)),
                  )
                }
                className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-medium text-zinc-900 focus:outline-none"
              />
              <CopyButton text={titles[selected] ?? ""} />
            </div>
            <button
              type="button"
              onClick={() => setShowAllTitles(true)}
              className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Trocar título (ver as 5 opções)
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Descrição</h3>
          <CopyButton text={description} label="Copiar descrição" />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-zinc-200 p-3 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ReferencePhotos query={product.productName} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving
            ? "Salvando..."
            : saved
              ? "Salvo!"
              : mode === "new"
                ? "Salvar em Meus produtos"
                : "Salvar alterações"}
        </button>
        {mode === "saved" && (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Excluir
          </button>
        )}
      </div>
    </article>
  );
}
