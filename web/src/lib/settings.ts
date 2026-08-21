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
