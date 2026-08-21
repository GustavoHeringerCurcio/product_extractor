"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzedProduct } from "@/lib/schema";
import { ProductResultCard } from "./ProductResultCard";

type QueueItem = { id: string; file: File; preview: string };
type AnalyzeItem =
  | { index: number; status: "ok"; product: AnalyzedProduct }
  | { index: number; status: "error"; message: string };
type Result = { id: string; product?: AnalyzedProduct; error?: string };

export function Analyzer() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setQueue((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) addFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  function removeFile(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function clearAll() {
    setQueue([]);
    setResults([]);
    setError(null);
  }

  async function analyze() {
    if (!queue.length || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    queue.forEach((q) => formData.append("files", q.file));

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao analisar as imagens.");

      const items = (data.items ?? []) as AnalyzeItem[];
      const out: Result[] = queue.map((q, i) => {
        const item = items.find((x) => x.index === i);
        if (item && item.status === "ok") {
          return { id: q.id, product: item.product };
        }
        const message =
          item && item.status === "error" ? item.message : "Falha ao analisar.";
        return { id: q.id, error: message };
      });
      setResults(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-zinc-900 bg-zinc-100"
            : "border-zinc-300 bg-white hover:border-zinc-400"
        }`}
      >
        <p className="text-base font-medium text-zinc-800">
          Cole (Ctrl+V), arraste ou clique para adicionar prints do AliExpress
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          PNG, JPEG ou WEBP · até 10 imagens por vez
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">
              {queue.length} imagem(ns) selecionada(s)
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
            >
              Limpar
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {queue.map((q) => (
              <div key={q.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.preview}
                  alt="prévia"
                  className="h-24 w-24 rounded-lg border border-zinc-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(q.id)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white"
                  aria-label="Remover imagem"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing}
            className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {analyzing ? "Analisando..." : "Analisar imagens"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) =>
            r.product ? (
              <ProductResultCard key={r.id} product={r.product} mode="new" />
            ) : (
              <div
                key={r.id}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {r.error}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
