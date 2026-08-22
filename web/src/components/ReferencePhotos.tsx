"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReferencePhoto } from "@/lib/serpapi";
import type { SerpapiUsage } from "@/lib/serpapiUsage";

export function ReferencePhotos({ query }: { query: string }) {
  const [photos, setPhotos] = useState<ReferencePhoto[]>([]);
  const [usage, setUsage] = useState<SerpapiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    const res = await fetch(`/api/photos?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return {
      photos: (data.photos ?? []) as ReferencePhoto[],
      usage: data.usage as SerpapiUsage | undefined,
    };
  }, [query]);

  const apply = useCallback(
    (list: ReferencePhoto[], usage?: SerpapiUsage) => {
      setUsage(usage ?? null);
      setPhotos(list);
      if (!list.length) {
        setError(
          usage && usage.remaining === 0
            ? "Limite de buscas de fotos atingido neste mês."
            : "Nenhuma foto encontrada (verifique a chave SERPAPI_API_KEY).",
        );
      } else {
        setError(null);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetchPhotos()
      .then(({ photos, usage }) => {
        if (cancelled) return;
        apply(photos, usage);
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
  }, [fetchPhotos, apply]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { photos, usage } = await fetchPhotos();
      apply(photos, usage);
    } catch {
      setError("Falha ao buscar fotos de referência.");
    } finally {
      setLoading(false);
    }
  }

  const lowThreshold = usage ? Math.floor(usage.limit * 0.2) : 0;
  const warnLow = usage !== null && usage.remaining > 0 && usage.remaining <= lowThreshold;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          Fotos de referência
        </h3>
        <div className="flex items-center gap-3">
          {usage && (
            <span
              className={`text-xs ${
                usage.remaining === 0
                  ? "font-medium text-red-600"
                  : warnLow
                    ? "font-medium text-amber-600"
                    : "text-zinc-400"
              }`}
              title="Buscas de fotos usadas neste mês no plano SerpAPI"
            >
              {usage.used}/{usage.limit} buscas este mês
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            Atualizar
          </button>
        </div>
      </div>

      {warnLow && (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Atenção: restam apenas {usage?.remaining} buscas de fotos este mês.
        </p>
      )}
      {usage && usage.remaining === 0 && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Limite de {usage.limit} buscas de fotos atingido este mês.
        </p>
      )}

      {loading && <p className="text-sm text-zinc-500">Buscando...</p>}
      {error && <p className="text-sm text-zinc-500">{error}</p>}
      {photos.length > 0 && (
        <>
          <p className="mb-2 text-xs text-zinc-500">
            Fotos reais de anúncios no OLX — apenas referência, não copie fotos de
            outros vendedores.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <a
                key={i}
                href={p.link || p.original}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block overflow-hidden rounded-lg border border-zinc-200"
                title={`${p.title || "Anúncio OLX"}\n${p.link}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbnail}
                  alt={p.title || "foto de referência do OLX"}
                  className="h-24 w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 left-1 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  OLX
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
