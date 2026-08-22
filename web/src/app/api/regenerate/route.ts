import { z } from "zod";
import { generateTitle, generateDescription } from "@/lib/ai";
import { getPrompts } from "@/lib/settings";
import type { ProductInfo } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const regenerateSchema = z.object({
  type: z.enum(["title", "description"]),
  current: z.string(),
  product: z.object({
    productName: z.string(),
    category: z.string().nullish(),
    specs: z.array(z.string()),
    aliPrice: z.number().nullish(),
    currency: z.enum(["USD", "CNY", "BRL"]).nullish(),
    mediumPriceBrl: z.number(),
  }),
});

function toProductInfo(
  product: z.infer<typeof regenerateSchema>["product"],
): ProductInfo {
  return {
    product_name: product.productName,
    category: product.category ?? "",
    specs: product.specs,
    price:
      product.aliPrice != null && product.currency
        ? { amount: product.aliPrice, currency: product.currency }
        : null,
    medium_price_brl: product.mediumPriceBrl,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = regenerateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { type, current, product } = parsed.data;
  const prompts = await getPrompts();
  const info = toProductInfo(product);

  const output =
    type === "title"
      ? await generateTitle(info, prompts.title, current)
      : await generateDescription(info, prompts.description, current);

  return Response.json({ output });
}
