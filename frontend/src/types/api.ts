// ============================================
// BASE TYPES
// ============================================

export type UserRole = 'ADMIN' | 'COMERCIAL' | 'LOGISTICA' | 'IMPOSTO';
export type Currency = 'BRL' | 'USD' | 'EUR';
export type MeasurementUnit = 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'UN' | 'CX' | 'PC';

// ============================================
// PAGINATION & COMMON
// ============================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TAX (PREMISSAS)
// ============================================

export interface TaxItem {
  id: string;
  taxId: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  taxItems: TaxItem[];
}

// Request types for Tax
export interface CreateTaxItemInput {
  name: string;
  rate: number;
  recoverable: boolean;
}

export interface UpdateTaxItemInput extends CreateTaxItemInput {
  id?: string; // Se tem ID, atualiza; se não tem, cria novo
}

export interface CreateTaxRequest {
  name: string;
  description?: string;
  items: CreateTaxItemInput[];
}

export interface UpdateTaxRequest {
  name?: string;
  description?: string;
  items?: UpdateTaxItemInput[];
}

// ============================================
// FREIGHT
// ============================================

export interface FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Freight {
  id: string;
  name: string;
  description?: string;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  createdAt: string;
  updatedAt: string;
  freightTaxes: FreightTax[];
}

// Request types for Freight
export interface CreateFreightTaxInput {
  name: string;
  rate: number;
}

export interface UpdateFreightTaxInput extends CreateFreightTaxInput {
  id?: string;
}

export interface CreateFreightRequest {
  name: string;
  description?: string;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  freightTaxes: CreateFreightTaxInput[];
}

export interface UpdateFreightRequest {
  name?: string;
  description?: string;
  paymentTerm?: number;
  unitPrice?: number;
  currency?: Currency;
  additionalCosts?: number;
  freightTaxes?: UpdateFreightTaxInput[];
}

// ============================================
// RAW MATERIAL
// ============================================

export interface RawMaterialChangeLog {
  id: string;
  rawMaterialId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  changedByUser?: {
    name: string;
    email: string;
  };
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  taxId: string;
  freightId: string;
  createdAt: string;
  updatedAt: string;
  tax?: Tax;
  freight?: Freight;
  changeLogs?: RawMaterialChangeLog[];
}

// Request types for Raw Material
export interface CreateRawMaterialRequest {
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  taxId: string;
  freightId: string;
}

export interface UpdateRawMaterialRequest {
  code?: string;
  name?: string;
  description?: string;
  measurementUnit?: MeasurementUnit;
  inputGroup?: string;
  paymentTerm?: number;
  acquisitionPrice?: number;
  currency?: Currency;
  priceConvertedBrl?: number;
  additionalCost?: number;
  taxId?: string;
  freightId?: string;
}

// ============================================
// PRODUCT
// ============================================

export interface ProductRawMaterial {
  productId: string;
  rawMaterialId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  rawMaterial?: RawMaterial;
}

export interface ProductCalculations {
  rawMaterialsSubtotal: number;
  taxesTotal: number;
  freightTotal: number;
  additionalCostsTotal: number;
  priceWithoutTaxesAndFreight: number;
  priceWithTaxesAndFreight: number;
  fixedCostOverhead?: number;
  finalPriceWithOverhead?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  creatorId: string;
  fixedCostId?: string;
  priceWithoutTaxesAndFreight?: number;
  priceWithTaxesAndFreight?: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  fixedCost?: FixedCost;
  productRawMaterials?: ProductRawMaterial[];
  calculations?: ProductCalculations;
}

// Request types for Product
export interface ProductRawMaterialInput {
  rawMaterialId: string;
  quantity: number;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  fixedCostId?: string;
  rawMaterials: ProductRawMaterialInput[];
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  description?: string;
  fixedCostId?: string;
  rawMaterials?: ProductRawMaterialInput[];
}

// Para preview de preço sem criar produto
export interface CalculatePriceRequest {
  rawMaterials: ProductRawMaterialInput[];
  fixedCostId?: string;
}

// ============================================
// FIXED COST
// ============================================

export interface FixedCost {
  id: string;
  description: string;
  code?: string;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  totalCost: number;
  considerationPercentage: number;
  salesVolume: number;
  overheadPerUnit: number;
  calculationDate: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  _count?: {
    products: number;
  };
}

// Request types for Fixed Cost
export interface CreateFixedCostRequest {
  description: string;
  code?: string;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  considerationPercentage: number;
  salesVolume: number;
}

export interface UpdateFixedCostRequest {
  description?: string;
  code?: string;
  personnelExpenses?: number;
  generalExpenses?: number;
  proLabore?: number;
  depreciation?: number;
  considerationPercentage?: number;
  salesVolume?: number;
}

// Para funcionalidade "Gerar Overhead"
export interface CalculateOverheadRequest {
  applyToProducts: boolean;
  productIds?: string[]; // Se vazio e applyToProducts=true, aplica a todos
}

export interface OverheadCalculationResult {
  fixedCost: {
    id: string;
    description: string;
    totalCost: number;
    overheadPerUnit: number;
  };
  affectedProducts: Array<{
    id: string;
    code: string;
    name: string;
    priceBeforeOverhead: number;
    overheadApplied: number;
    priceAfterOverhead: number;
    updated: boolean;
  }>;
  summary: {
    totalProductsAffected: number;
    totalOverheadDistributed: number;
    applied: boolean;
  };
}

// ============================================
// AUTOCOMPLETE & SEARCH
// ============================================

export interface AutocompleteResult<T> {
  results: T[];
  total: number;
}

export interface SearchParams {
  q: string; // Query de busca
  limit?: number;
  fields?: string; // Campos a retornar, separados por vírgula
}

// ============================================
// EXPORT
// ============================================

export interface ExportRequest {
  format: 'csv';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  includeDetails?: boolean;
  delimiter?: ',' | ';';
  encoding?: 'utf-8' | 'latin1';
  includeHeaders?: boolean;
}

// ============================================
// USER MANAGEMENT
// ============================================

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
}