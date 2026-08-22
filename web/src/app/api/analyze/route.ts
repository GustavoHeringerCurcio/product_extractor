import { analyzeImage } from "@/lib/ai";
import { getFxRates } from "@/lib/settings";
import { sellPrice, toBrl, type FxRates } from "@/lib/pricing";
import type { AnalyzedProduct, ProductResult } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const CONCURRENCY = 3;

function toAnalyzedProduct(result: ProductResult, fx: FxRates): AnalyzedProduct {
  const imagePriceBrl = result.price
    ? toBrl(result.price.amount, result.price.currency, fx)
    : null;
  const mediumPriceBrl = imagePriceBrl ?? result.medium_price_brl;
  return {
    productName: result.product_name,
    category: result.category,
    specs: result.specs,
    aliPrice: result.price?.amount ?? null,
    currency: result.price?.currency ?? null,
    mediumPriceBrl,
    sellPriceBrl: sellPrice(mediumPriceBrl),
    titles: result.titles,
    description: result.description,
  };
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Requisição inválida: envie imagens como multipart/form-data." },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => typeof File !== "undefined" && f instanceof File);

  if (files.length === 0) {
    return Response.json(
      { error: "Nenhuma imagem enviada." },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return Response.json(
      { error: `Máximo de ${MAX_FILES} imagens por vez.` },
      { status: 400 },
    );
  }

  const fx = await getFxRates();

  const items = await mapLimit(files, CONCURRENCY, async (file, index) => {
    try {
      if (file.size > MAX_BYTES) {
        return {
          index,
          status: "error" as const,
          message: `Imagem "${file.name}" excede 5 MB.`,
        };
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/png";

      const result = await analyzeImage(base64, mimeType, fx);
      return {
        index,
        status: "ok" as const,
        product: toAnalyzedProduct(result, fx),
      };
    } catch (err) {
      return {
        index,
        status: "error" as const,
        message: err instanceof Error ? err.message : "Falha ao analisar a imagem.",
      };
    }
  });

  return Response.json({ items });
}
