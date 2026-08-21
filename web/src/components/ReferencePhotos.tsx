"use client";

import { useState } from "react";
import type { ReferencePhoto } from "@/lib/serpapi";

export function ReferencePhotos({ query }: { query: string }) {
  const [photos, setPhotos] = useState<ReferencePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    if (photos.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const list = (data.photos ?? []) as ReferencePhoto[];
      setPhotos(list);
      if (!list.length) {
        setError(
          "Nenhuma foto encontrada (verifique a chave SERPAPI_API_KEY).",
        );
      }
    } catch {
      setError("Falha ao buscar fotos de referência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={load}
        className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
      >
        {open ? "Fotos de referência" : "Buscar fotos de referência"}
      </button>

      {open && (
        <div className="mt-3">
          {loading && <p className="text-sm text-zinc-500">Buscando...</p>}
          {error && <p className="text-sm text-zinc-500">{error}</p>}
          {photos.length > 0 && (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                Apenas referência — não copie fotos de outros vendedores.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <a
                    key={i}
                    href={p.original}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-zinc-200"
                    title={p.title || p.source}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnail}
                      alt={p.title || "foto de referência"}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
