import { describe, it, expect } from "vitest";
import { roundTo90, sellPrice, toBrl } from "./pricing";

describe("pricing", () => {
  it("roundTo90 ends in .90 style", () => {
    expect(roundTo90(150)).toBeCloseTo(150.9);
    expect(roundTo90(149.9)).toBeCloseTo(149.9);
    expect(roundTo90(150.1)).toBeCloseTo(150.9);
  });

  it("sellPrice snaps medium + 50 down to a .90 price", () => {
    expect(sellPrice(100)).toBeCloseTo(150.9, 5);
    expect(sellPrice(99.9)).toBeCloseTo(149.9, 5);
    expect(sellPrice(249.5)).toBeCloseTo(299.9, 5);
    expect(sellPrice(10)).toBeCloseTo(60.9, 5);
  });

  it("sellPrice stays within R$1 of the medium + 50 target", () => {
    for (const medium of [10, 99.9, 100, 249.5, 1000]) {
      const target = medium + 50;
      expect(Math.abs(sellPrice(medium) - target)).toBeLessThanOrEqual(1);
    }
  });

  it("toBrl converts USD and CNY", () => {
    const fx = { USD_BRL: 5.2, CNY_BRL: 0.7 };
    expect(toBrl(10, "USD", fx)).toBeCloseTo(52);
    expect(toBrl(10, "CNY", fx)).toBeCloseTo(7);
    expect(toBrl(10, "BRL", fx)).toBeCloseTo(10);
    expect(toBrl(10, null, fx)).toBeCloseTo(10);
  });
});
