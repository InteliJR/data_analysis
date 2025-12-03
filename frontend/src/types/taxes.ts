// src/types/taxes.ts

export interface FreightTax {
  id: string;
  name: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
  freights?: Array<{
    id: string;
    name: string;
  }>;
  freightsCount?: number;
}

export interface RawMaterialTax {
  id: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt: string;
  updatedAt: string;
  rawMaterials?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  rawMaterialsCount?: number;
  productsCount?: number;
}

export interface FreightTaxFormData {
  name: string;
  rate: number;
  freightIds?: string[]; // Array para múltiplos fretes
}

export interface RawMaterialTaxFormData {
  name: string;
  rate: number;
  recoverable: boolean;
  rawMaterialIds?: string[]; // Array para múltiplas matérias-primas
}
