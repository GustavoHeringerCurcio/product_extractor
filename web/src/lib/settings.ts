import { prisma } from "./prisma";
import type { FxRates } from "./pricing";

const DEFAULT_FX: FxRates = {
  USD_BRL: Number(process.env.FX_USD_BRL ?? 5.2),
  CNY_BRL: Number(process.env.FX_CNY_BRL ?? 0.7),
};

const KEYS = ["FX_USD_BRL", "FX_CNY_BRL"] as const;

export async function getFxRates(): Promise<FxRates> {
  const rates: FxRates = { ...DEFAULT_FX };
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...KEYS] } },
    });
    for (const row of rows) {
      const value = Number(row.value);
      if (Number.isFinite(value) && value > 0) {
        if (row.key === "FX_USD_BRL") rates.USD_BRL = value;
        if (row.key === "FX_CNY_BRL") rates.CNY_BRL = value;
      }
    }
  } catch {
    // DB unavailable: fall back to env defaults.
  }
  return rates;
}

export const DEFAULT_TITLE_PROMPT = `Você é um especialista em títulos para anúncios em marketplaces brasileiros (OLX e Facebook Marketplace).

Gere UM único título em português para o produto descrito nas informações fornecidas.

Regras:
- Curto e objetivo: "nome do produto + estado de conservação".
- Considere sempre que o produto é NOVO (novo e lacrado).
- NÃO use as frases "em ótimo estado" nem "excelente estado".
- NÃO use palavras como "vendo", "compro", "oportunidade" nem símbolos especiais (@, #, $, %, *).
- Responda APENAS com o título, sem aspas e sem texto adicional.`;

export const DEFAULT_DESCRIPTION_PROMPT = `Você é um especialista em descrições para anúncios em marketplaces brasileiros (OLX e Facebook Marketplace).

Escreva UMA única descrição em português, clara e persuasiva, com as especificações do produto e motivos para comprar, com base nas informações fornecidas.

Regras:
- Sem links e sem e-mails.
- Sempre finalize a descrição EXATAMENTE com estas duas linhas, cada uma em uma linha separada:
  "Somente retirada comigo, moro perto do shopping parksul."
  "Parcelo em Até 12x na maquininha com juros."`;

const PROMPT_KEYS = ["PROMPT_TITLE", "PROMPT_DESCRIPTION"] as const;

export type Prompts = {
  title: string;
  description: string;
};

export async function getPrompts(): Promise<Prompts> {
  const prompts: Prompts = {
    title: DEFAULT_TITLE_PROMPT,
    description: DEFAULT_DESCRIPTION_PROMPT,
  };
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...PROMPT_KEYS] } },
    });
    for (const row of rows) {
      if (row.key === "PROMPT_TITLE") prompts.title = row.value;
      if (row.key === "PROMPT_DESCRIPTION") prompts.description = row.value;
    }
  } catch {
    // DB unavailable: fall back to defaults.
  }
  return prompts;
}

export async function savePrompts(prompts: Prompts): Promise<Prompts> {
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "PROMPT_TITLE" },
      update: { value: prompts.title },
      create: { key: "PROMPT_TITLE", value: prompts.title },
    }),
    prisma.setting.upsert({
      where: { key: "PROMPT_DESCRIPTION" },
      update: { value: prompts.description },
      create: { key: "PROMPT_DESCRIPTION", value: prompts.description },
    }),
  ]);
  return prompts;
}
