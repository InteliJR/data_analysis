// src/types/products.ts

import type { RawMaterialLocation } from "./RawMaterials";

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  overheadPerUnit?: number;
}

export interface FixedCost {
  id: string;
  description: string;
  code?: string;
  totalCost?: number;
}

export interface FreightTax {
  id: string;
  name: string;
  rate: number;
}

export interface Freight {
  id: string;
  name: string;
  unitPrice: number;
  currency: string;
  originCity: string;
  originUf: string;
  destinationCity: string;
  destinationUf: string;
  freightTaxes?: FreightTax[];
}

export interface RawMaterialTax {
  id: string;
  name: string;
  rate: number;
  recoverable: boolean;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  measurementUnit: string;
  priceConvertedBrl: number;
  freights?: Freight[];
  rawMaterialTaxes?: RawMaterialTax[];
  locations?: RawMaterialLocation[];
}

export interface ProductRawMaterial {
  productId: string;
  rawMaterialId: string;
  rawMaterialLocationPivotId: string;
  quantity: number;
  rawMaterial?: RawMaterial;
  locationPivot?: RawMaterialLocation;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  creatorId: string;
  fixedCostId?: string;
  productGroupId?: string;
  priceWithoutTaxesAndFreight?: number;
  priceWithTaxesAndFreight?: number;
  totalCostWithAllFreights?: number;
  createdAt: string;
  updatedAt: string;

  // Relações
  creator?: User;
  fixedCost?: FixedCost;
  productGroup?: ProductGroup;
  productRawMaterials: ProductRawMaterial[];
  freights?: Freight[]; // IMPORTANTE: Fretes do produto
}

export interface CreateProductDTO {
  code: string;
  name: string;
  description?: string;
  fixedCostId?: string;
  productGroupId?: string;
  freightIds?: string[];
  rawMaterials: Array<{
    rawMaterialId: string;
    rawMaterialLocationPivotId: string;
    quantity: number;
  }>;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
