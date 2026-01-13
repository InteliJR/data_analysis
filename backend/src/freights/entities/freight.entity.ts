// src/freights/entities/freight.entity.ts

import { Currency, FreightOperationType } from '@prisma/client';

/**
 * Entity que representa um Frete no sistema.
 * Corresponde ao modelo Freight do Prisma schema atualizado.
 */
export class Freight {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  currency: Currency;
  originUf: string;
  originCity: string;
  destinationUf: string;
  destinationCity: string;
  cargoType: string;
  operationType: FreightOperationType;
  createdAt: Date;
  updatedAt: Date;

  // Relações (opcionais, aparecem quando usamos include no Prisma)
  freightTaxes?: FreightTax[];
  rawMaterials?: RawMaterial[];
  _count?: {
    rawMaterials: number;
  };
}

/**
 * Entity que representa um Imposto de Frete no sistema.
 * Corresponde ao modelo FreightTax do Prisma schema.
 */
export class FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: Date;
  updatedAt: Date;

  // Relação
  freight?: Freight;
}

/**
 * Interface simplificada de RawMaterial para relações
 */
interface RawMaterial {
  id: string;
  code: string;
  name: string;
}