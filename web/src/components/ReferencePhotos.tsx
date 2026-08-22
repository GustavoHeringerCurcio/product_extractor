"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReferencePhoto } from "@/lib/serpapi";

export function ReferencePhotos({ query }: { query: string }) {
  const [photos, setPhotos] = useState<ReferencePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (): Promise<ReferencePhoto[]> => {
    const res = await fetch(`/api/photos?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.photos ?? []) as ReferencePhoto[];
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    fetchPhotos()
      .then((list) => {
        if (cancelled) return;
        setPhotos(list);
        if (!list.length) {
          setError("Nenhuma foto encontrada (verifique a chave SERPAPI_API_KEY).");
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Falha ao buscar fotos de referência.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPhotos]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPhotos();
      setPhotos(list);
      if (!list.length) {
        setError("Nenhuma foto encontrada (verifique a chave SERPAPI_API_KEY).");
      }
    } catch {
      setError("Falha ao buscar fotos de referência.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          Fotos de referência
        </h3>
        <button
          type="button"
          onClick={refresh}
          className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
        >
          Atualizar
        </button>
      </div>

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
  );
}
