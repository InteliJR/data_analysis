// Adicione estas interfaces ao arquivo src/types/index.ts existente

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  porcentage?: number;
  volumevendasconsiderar?: number;
  productsCount: number;
  volumePercentageByQuantity: number;
  volumePercentageByValue: number;
  averagePrice: number;
  createdAt: string;
  totalValue: number;
  updatedAt: string;
}

export interface CreateProductGroupDTO {
  name: string;
  description?: string;
  porcentage?: number;
  volumevendasconsiderar?: number;
}

export interface UpdateProductGroupDTO {
  name?: string;
  description?: string;
  porcentage?: number;
  volumevendasconsiderar?: number;
}