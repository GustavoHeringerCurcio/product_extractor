import { z } from "zod";

export const productInfoSchema = z.object({
  product_name: z.string(),
  category: z.string(),
  specs: z.array(z.string()),
  price: z
    .object({
      amount: z.number(),
      currency: z.enum(["USD", "CNY", "BRL"]),
    })
    .nullable(),
  medium_price_brl: z.number(),
});

export type ProductInfo = z.infer<typeof productInfoSchema>;

export const productResultSchema = z.object({
  product_name: z.string(),
  category: z.string(),
  specs: z.array(z.string()),
  price: z
    .object({
      amount: z.number(),
      currency: z.enum(["USD", "CNY", "BRL"]),
    })
    .nullable(),
  medium_price_brl: z.number(),
  title: z.string(),
  description: z.string(),
});

export type ProductResult = z.infer<typeof productResultSchema>;

export type Currency = "USD" | "CNY" | "BRL";

export type AnalyzedProduct = {
  id?: string;
  productName: string;
  category: string | null;
  specs: string[];
  aliPrice: number | null;
  currency: Currency | null;
  mediumPriceBrl: number;
  sellPriceBrl: number;
  title: string;
  description: string;
};

export const saveProductSchema = z.object({
  productName: z.string().min(1),
  category: z.string().nullish(),
  specs: z.array(z.string()),
  aliPrice: z.number().nullish(),
  currency: z.enum(["USD", "CNY", "BRL"]).nullish(),
  mediumPriceBrl: z.number(),
  sellPriceBrl: z.number(),
  title: z.string().min(1),
  description: z.string(),
});

export type SaveProductInput = z.infer<typeof saveProductSchema>;
