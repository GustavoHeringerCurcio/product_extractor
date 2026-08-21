export function roundTo90(value: number): number {
  return Math.floor(value) + 0.9;
}

export function sellPrice(mediumPriceBrl: number): number {
  return roundTo90(mediumPriceBrl + 50);
}

export type FxRates = {
  USD_BRL: number;
  CNY_BRL: number;
};

export function toBrl(amount: number, currency: string | null, fx: FxRates): number {
  if (currency === "USD") return amount * fx.USD_BRL;
  if (currency === "CNY") return amount * fx.CNY_BRL;
  return amount;
}
