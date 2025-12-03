export interface FixedCost {
  id: string;
  description: string;
  code?: string | null;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  totalCost: number;
  considerationPercentage: number;
  calculationDate: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface FixedCostFormData {
  description: string;
  code?: string;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  considerationPercentage: number;
}

export interface FixedCostsListResponse {
  data: FixedCost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExportFixedCostsPayload {
  format: 'csv';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  columns?: string[];
  includeProducts?: boolean;
}

// Manter mockado - aguardando implementação
export interface OverheadGroup {
  id: string;
  groupName: string;
  unit: string;
  salesVolume: number;
  overheadValue: number;
}
export interface FindAllFixedCostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}