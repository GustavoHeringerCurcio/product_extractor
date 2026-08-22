"use client";

import { useState } from "react";

type Props = {
  initialTitle: string;
  initialDescription: string;
  defaultTitle: string;
  defaultDescription: string;
};

export function PromptEditor({
  initialTitle,
  initialDescription,
  defaultTitle,
  defaultDescription,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlePrompt: title,
          descriptionPrompt: description,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao salvar os prompts.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar os prompts.");
    } finally {
      setSaving(false);
    }
  }

  function restoreDefaults() {
    setTitle(defaultTitle);
    setDescription(defaultDescription);
  }

  const dirty =
    title !== initialTitle || description !== initialDescription;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Prompt do título
          </h2>
          <span className="text-xs text-zinc-400">
            {title.length} caracteres
          </span>
        </div>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-relaxed text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Prompt da descrição
          </h2>
          <span className="text-xs text-zinc-400">
            {description.length} caracteres
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={14}
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-200 p-3 font-mono text-xs leading-relaxed text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar prompts"}
        </button>
        <button
          type="button"
          onClick={restoreDefaults}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Restaurar padrões
        </button>
        {dirty && !saved && (
          <span className="text-xs text-zinc-500">
            Alterações não salvas
          </span>
        )}
      </div>
    </div>
  );
}
