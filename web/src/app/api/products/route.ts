import { prisma } from "@/lib/prisma";
import { saveProductSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  productName: string;
  category: string | null;
  specs: unknown;
  aliPrice: number | null;
  currency: string | null;
  mediumPriceBrl: number | null;
  sellPriceBrl: number | null;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(row: ProductRow) {
  return {
    id: row.id,
    productName: row.productName,
    category: row.category,
    specs: (row.specs as string[]) ?? [],
    aliPrice: row.aliPrice,
    currency: row.currency,
    mediumPriceBrl: row.mediumPriceBrl,
    sellPriceBrl: row.sellPriceBrl,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET() {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ products: rows.map(toDto) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = saveProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const row = await prisma.product.create({
    data: {
      productName: data.productName,
      category: data.category ?? null,
      specs: data.specs,
      aliPrice: data.aliPrice ?? null,
      currency: data.currency ?? null,
      mediumPriceBrl: data.mediumPriceBrl,
      sellPriceBrl: data.sellPriceBrl,
      title: data.title,
      description: data.description,
    },
  });

  return Response.json({ product: toDto(row) }, { status: 201 });
}
