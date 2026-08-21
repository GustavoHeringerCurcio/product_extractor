"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copiar",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable in insecure contexts.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 ${
        copied ? "border-emerald-500 text-emerald-600" : ""
      } ${className}`}
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}
