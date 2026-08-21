import { generateText, Output, zodSchema } from "ai";
import { openai } from "@ai-sdk/openai";
import { productResultSchema, type ProductResult } from "./schema";
import type { FxRates } from "./pricing";

function buildSystemPrompt(fx: FxRates): string {
  return `Você é um assistente especialista em criar anúncios para marketplaces brasileiros (OLX e Facebook Marketplace).

Tarefa: analise a imagem (um screenshot de um produto no AliExpress) e produza um JSON com os seguintes campos:

- product_name: nome claro do produto em português (marca + modelo quando visível).
- category: categoria do produto.
- specs: lista das principais especificações/características visíveis na imagem.
- price: objeto com o preço exibido na imagem { "amount": número, "currency": "USD" | "CNY" | "BRL" }. Se não houver preço visível, use null.
- medium_price_brl: preço médio aproximado desse produto no AliExpress, já convertido para reais (BRL). Use a taxa de câmbio fornecida. Arredonde para um valor comercial (ex: 149,90).
- titles: array com EXATAMENTE 5 títulos sugeridos em português, seguindo as regras abaixo.
- description: UMA única descrição em português.

Regras para os títulos:
- Curtos e objetivos: "nome do produto + estado de conservação".
- NÃO use palavras como "vendo", "compro", "oportunidade" nem símbolos especiais (@, #, $, %, *, etc.).

Regras para a descrição:
- Clara e persuasiva, com as especificações e motivos para comprar.
- Sem links e sem e-mails.

Regras gerais:
- Sempre responda em português do Brasil.
- Taxa de câmbio para conversão: 1 USD = ${fx.USD_BRL} BRL, 1 CNY = ${fx.CNY_BRL} BRL.
- Não invente preços absurdos; baseie-se no preço visível na imagem e na taxa de câmbio.`;
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
  fx: FxRates,
): Promise<ProductResult> {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(fx),
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
      schema: zodSchema(productResultSchema),
      name: "product_ad",
    }),
  });

  return result.output;
}
