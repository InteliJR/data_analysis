export type Currency = 'BRL' | 'USD' | 'EUR';
export type FreightOperationType = 'INTERNAL' | 'EXTERNAL';

export interface FreightTax {
  id: string;
  freightId?: string;
  name: string;
  rate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Freight {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: Currency;
  originUf: string;
  originCity: string;
  destinationUf: string;
  destinationCity: string;
  cargoType: string;
  operationType: FreightOperationType;
  createdAt: string;
  updatedAt: string;
  freightTaxes: FreightTax[];
  _count?: {
    rawMaterialLocations: number;
    products: number;
  };
}

export interface FreightFormData {
  name: string;
  description?: string;
  unitPrice: number;
  currency: Currency;
  originUf: string;
  originCity: string;
  destinationUf: string;
  destinationCity: string;
  cargoType: string;
  operationType: FreightOperationType;
  freightTaxes: {
    id?: string;
    name: string;
    rate: number;
  }[];
}