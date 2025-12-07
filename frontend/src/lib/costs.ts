// src/lib/costs.ts

export type FreightLike = {
  unitPrice?: number | string | null;
  freightTaxes?: Array<{ rate?: number | string | null } | null> | null;
};

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/**
 * Calculates the freight cost including its tax percentages.
 * If no taxes are attached, it returns the base unit price.
 */
export function calculateFreightCostWithTaxes(
  freight?: FreightLike | null
): number {
  if (!freight) return 0;
  const basePrice = toNumber(freight.unitPrice);
  const totalRate = (freight.freightTaxes ?? []).reduce((sum, tax) => {
    if (!tax) return sum;
    return sum + toNumber(tax.rate);
  }, 0);

  return basePrice * (1 + totalRate / 100);
}
