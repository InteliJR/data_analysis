export interface Product {
  id: string;
  code: string;
  description: string;
  group: number;
  price: number;
  currency: 'Real' | 'Dólar';
  overhead: number;
}

export interface RawMaterial {
  id: string;
  code: string; 
  name: string;
  description: string;
  deadline: string; 
  price: number;
  currency: 'Real' | 'Dólar';
  additionalCosts: number;
}

export interface FixedCost {
  id: string;
  description: string;
  code?: string;
  personnel?: number;
  others?: number;
  depreciation?: number;
  percentage: number;
}

export interface OverheadGroup {
  id: string;
  groupName: string; 
  unit: string; 
  salesVolume: number; 
  overheadValue: number; 
}

export interface AssumptionItem {
  id: string;
  item: string;
  group1: number;
  group2: number;
}

export type UserStatus = 'Ativo' | 'Inativo';
export type UserRole = 'Comercial' | 'Logística' | 'Admin'; 

export interface User {
  id: string;
  email: string;
  branch: string; 
  status: UserStatus;
  role: UserRole; 
}