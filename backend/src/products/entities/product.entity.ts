export class Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  creatorId: string;
  fixedCostId: string | null;
  priceWithoutTaxesAndFreight: number;
  priceWithTaxesAndFreight: number;
  createdAt: Date;
  updatedAt: Date;

  // Relações
  creator?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };

  fixedCost?: {
    id: string;
    description: string;
    code: string;
    personnelExpenses?: number;
    generalExpenses?: number;
    proLabore?: number;
    depreciation?: number;
    totalCost?: number;
    considerationPercentage?: number;
    salesVolume?: number;
    overheadPerUnit: number;
  };

  productRawMaterials?: Array<{
    productId: string;
    rawMaterialId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    rawMaterial: {
      id: string;
      code: string;
      name: string;
      measurementUnit: string;
      acquisitionPrice: number;
      currency: string;
      priceConvertedBrl?: number;
      additionalCost?: number;
      // MUDANÇA AQUI: plural
      freights?: Array<{
        id: string;
        name: string;
        unitPrice: number;
        currency: string;
        freightTaxes?: Array<{
          name: string;
          rate: number;
        }>;
      }>;
      rawMaterialTaxes?: Array<any>;
    };
  }>;

  calculations?: any; // Simplificado para evitar erros de tipo profundos
}
