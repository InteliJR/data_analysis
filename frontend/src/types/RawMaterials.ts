// src/types/rawMaterial.ts (ou src/types/RawMaterials.ts)

export interface RawMaterialChangeLog {
  id: string;
  rawMaterialId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId: string;
  changedBy: string; // String formatada: "Nome (email)"
  changedAt: string;
  user?: {
    name: string;
    email: string;
  };
  rawMaterial?: {
    name: string;
    code: string;
  };
}

export interface RawMaterialTax {
  id?: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Freight {
  id: string;
  name: string;
  unitPrice: number;
  currency: "BRL" | "USD" | "EUR";
  originCity: string;
  originUf: string;
  destinationCity: string;
  destinationUf: string;
  cargoType: string;
  operationType: "INTERNAL" | "EXTERNAL";
  freightTaxes?: Array<{
    id: string;
    name: string;
    rate: number;
  }>;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  measurementUnit: string;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: "BRL" | "USD" | "EUR";
  priceConvertedBrl: number;
  additionalCost: number;
  createdAt: string;
  updatedAt: string;

  // Relações
  freights?: Freight[]; // PLURAL - Array de fretes
  rawMaterialTaxes?: RawMaterialTax[];
  changeLogs?: RawMaterialChangeLog[];
}
