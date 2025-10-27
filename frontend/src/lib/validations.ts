import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'COMERCIAL', 'LOGISTICA', 'IMPOSTO']).optional(),
});

// Tax
export const taxItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  rate: z.number().min(0).max(100),
  recoverable: z.boolean().default(false),
});

export const taxSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  items: z.array(taxItemSchema).min(1, 'Adicione pelo menos 1 item'),
});

// Freight
export const freightTaxSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  rate: z.number().min(0).max(100),
});

export const freightSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  paymentTerm: z.number().int().positive(),
  unitPrice: z.number().positive(),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  additionalCosts: z.number().min(0),
  freightTaxes: z.array(freightTaxSchema),
});

// Raw Material
export const rawMaterialSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  measurementUnit: z.enum(['KG', 'G', 'L', 'ML', 'M', 'CM', 'UN', 'CX', 'PC']),
  inputGroup: z.string().optional(),
  paymentTerm: z.number().int().positive(),
  acquisitionPrice: z.number().positive(),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  priceConvertedBrl: z.number().positive(),
  additionalCost: z.number().min(0),
  taxId: z.string().uuid(),
  freightId: z.string().uuid(),
});

// Product
export const productRawMaterialSchema = z.object({
  rawMaterialId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const productSchema = z.object({
  code: z.string().regex(/^\d+$/, 'Código deve conter apenas números'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  fixedCostId: z.string().uuid().optional(),
  rawMaterials: z.array(productRawMaterialSchema).min(1, 'Adicione pelo menos 1 matéria-prima'),
});

// Fixed Cost
export const fixedCostSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  code: z.string().optional(),
  personnelExpenses: z.number().min(0),
  generalExpenses: z.number().min(0),
  proLabore: z.number().min(0),
  depreciation: z.number().min(0),
  considerationPercentage: z.number().min(0).max(100),
  salesVolume: z.number().positive(),
});

// User
export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3).max(100),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'COMERCIAL', 'LOGISTICA', 'IMPOSTO']),
  isActive: z.boolean(),
});