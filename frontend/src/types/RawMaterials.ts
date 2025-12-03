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

export interface RawMaterialLocationTax {
  id?: string;
  rawMaterialLocationId?: string;
  taxId?: string; // referência ao catálogo
  rate: number;
  recoverable: boolean;
  tax?: { id: string; name: string };
}

export interface RawMaterialLocation {
  id: string;
  rawMaterialId: string;
  country?: string;
  stateUf: string;
  city: string;
  acquisitionPrice: number | string;
  currency: "BRL" | "USD" | "EUR";
  priceConvertedBrl: number | string;
  additionalCost: number | string;
  createdAt?: string;
  updatedAt?: string;
  freights?: Freight[];
  locationTaxes?: RawMaterialLocationTax[];
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  measurementUnit: string;
  inputGroup?: string;
  paymentTerm: number;
  createdAt: string;
  updatedAt: string;

  // Novo modelo: localidades com preços/impostos/fretes
  locations?: RawMaterialLocation[];

  // Compat: campos antigos podem existir em respostas antigas/opcionais
  acquisitionPrice?: number;
  currency?: "BRL" | "USD" | "EUR";
  priceConvertedBrl?: number;
  additionalCost?: number;
  freights?: Freight[]; // legado
  rawMaterialTaxes?: RawMaterialTax[]; // legado
  changeLogs?: RawMaterialChangeLog[];
}
