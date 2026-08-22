import { generateText, Output, zodSchema } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  productInfoSchema,
  type ProductInfo,
  type ProductResult,
} from "./schema";
import type { FxRates } from "./pricing";

const MODEL = "gpt-4o-mini";

function buildExtractPrompt(fx: FxRates): string {
  return `Você é um assistente especialista em criar anúncios para marketplaces brasileiros (OLX e Facebook Marketplace).

Tarefa: analise a imagem (um screenshot de um produto no AliExpress) e produza um JSON com os seguintes campos:

- product_name: nome claro do produto em português (marca + modelo quando visível).
- category: categoria do produto.
- specs: lista das principais especificações/características visíveis na imagem.
- price: objeto com o preço exibido na imagem { "amount": número, "currency": "USD" | "CNY" | "BRL" }. Se não houver preço visível, use null.
- medium_price_brl: preço médio aproximado desse produto no AliExpress, já convertido para reais (BRL). Use a taxa de câmbio fornecida. Arredonde para um valor comercial (ex: 149,90).

Regras gerais:
- Sempre responda em português do Brasil.
- Taxa de câmbio para conversão: 1 USD = ${fx.USD_BRL} BRL, 1 CNY = ${fx.CNY_BRL} BRL.
- Não invente preços absurdos; baseie-se no preço visível na imagem e na taxa de câmbio.`;
}

function buildContextText(info: ProductInfo): string {
  return `Informações do produto extraídas do print do AliExpress:
- Nome: ${info.product_name}
- Categoria: ${info.category}
- Especificações: ${info.specs.length ? info.specs.join("; ") : "não informadas"}
- Preço no AliExpress: ${info.price ? `${info.price.amount} ${info.price.currency}` : "não visível"}
- Preço médio em reais: R$ ${info.medium_price_brl.toLocaleString("pt-BR")}`;
}

function buildRegenerateInstruction(current: string, what: string): string {
  return `O usuário não ficou satisfeito com o ${what} atual e quer outra versão melhor.

${what} atual: "${current}"

Gere uma versão DIFERENTE e melhor, variando o vocabulário e a estrutura da frase, sem repetir o texto atual.`;
}

export async function extractProductInfo(
  base64: string,
  mimeType: string,
  fx: FxRates,
): Promise<ProductInfo> {
  const result = await generateText({
    model: openai(MODEL),
    system: buildExtractPrompt(fx),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise este screenshot do AliExpress e retorne o JSON estruturado conforme as instruções.",
          },
          {
            type: "file",
            mediaType: mimeType,
            data: { type: "data", data: base64 },
          },
        ],
      },
    ],
    output: Output.object({
      schema: zodSchema(productInfoSchema),
      name: "product_info",
    }),
  });

  return result.output;
}

export async function generateTitle(
  info: ProductInfo,
  prompt: string,
  current?: string,
): Promise<string> {
  const messages: Array<{ role: "user"; content: string }> = [
    { role: "user", content: buildContextText(info) },
    ...(current
      ? [
          {
            role: "user" as const,
            content: buildRegenerateInstruction(current, "título"),
          },
        ]
      : []),
  ];

  const result = await generateText({
    model: openai(MODEL),
    system: prompt,
    messages,
    temperature: 1,
  });

  return result.text.trim();
}

export async function generateDescription(
  info: ProductInfo,
  prompt: string,
  current?: string,
): Promise<string> {
  const messages: Array<{ role: "user"; content: string }> = [
    { role: "user", content: buildContextText(info) },
    ...(current
      ? [
          {
            role: "user" as const,
            content: buildRegenerateInstruction(current, "descrição"),
          },
        ]
      : []),
  ];

  const result = await generateText({
    model: openai(MODEL),
    system: prompt,
    messages,
    temperature: 1,
  });

  return result.text.trim();
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
  fx: FxRates,
  prompts: { title: string; description: string },
): Promise<ProductResult> {
  const info = await extractProductInfo(base64, mimeType, fx);
  const [title, description] = await Promise.all([
    generateTitle(info, prompts.title),
    generateDescription(info, prompts.description),
  ]);

  const result: ProductResult = {
    ...info,
    title,
    description,
  };

  return result;
}
