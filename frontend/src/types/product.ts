// src/types/products.ts

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
}

export interface FixedCost {
  id: string;
  description: string;
  code?: string;
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
}

export interface ProductRawMaterial {
  productId: string;
  rawMaterialId: string;
  quantity: number;
  rawMaterial?: RawMaterial;
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
    quantity: number;
  }>;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
