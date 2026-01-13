export class Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  creatorId: string;
  fixedCostId: string | null;
  priceWithoutTaxesAndFreight: number;
  totalCostWithAllFreights: number;
  priceWithTaxesAndFreight?: number;
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
      locations?: Array<{
        id: string;
        acquisitionPrice: number;
        priceConvertedBrl?: number;
        currency: string;
        additionalCost?: number;
        location?: {
          id: string;
          name?: string | null;
          stateUf?: string | null;
          city?: string | null;
        };
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
        locationTaxes?: Array<{
          id: string;
          rate: number;
          recoverable: boolean;
          tax?: {
            id: string;
            name: string;
            defaultRate: number;
          };
        }>;
      }>;
    };
  }>;

  calculations?: any; // Simplificado para evitar erros de tipo profundos
}
