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

function SparklesIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

export function ProductResultCard({ product, mode, onDeleted }: Props) {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [regenerating, setRegenerating] = useState<"title" | "description" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload: AnalyzedProduct = {
    ...product,
    title,
    description,
  };

  async function regenerate(type: "title" | "description") {
    const current = type === "title" ? title : description;
    setRegenerating(type);
    setError(null);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          current,
          product: {
            productName: product.productName,
            category: product.category,
            specs: product.specs,
            aliPrice: product.aliPrice,
            currency: product.currency,
            mediumPriceBrl: product.mediumPriceBrl,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao gerar novo texto.");
      if (type === "title") setTitle(data.output);
      else setDescription(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar novo texto.");
    } finally {
      setRegenerating(null);
    }
  }

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

  const titleLoading = regenerating === "title";
  const descriptionLoading = regenerating === "description";

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
          <h3 className="text-sm font-semibold text-zinc-900">Título</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => regenerate("title")}
              disabled={titleLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
              aria-label="Gerar outro título"
              title="Gerar outro título"
            >
              <SparklesIcon spinning={titleLoading} />
            </button>
            <CopyButton text={title} label="Copiar título" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 focus-within:border-zinc-400">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-medium text-zinc-900 focus:outline-none"
          />
          <CopyButton text={title} />
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Descrição</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => regenerate("description")}
              disabled={descriptionLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
              aria-label="Gerar outra descrição"
              title="Gerar outra descrição"
            >
              <SparklesIcon spinning={descriptionLoading} />
            </button>
            <CopyButton text={description} label="Copiar descrição" />
          </div>
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
