export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  COMERCIAL: 'COMERCIAL',
  LOGISTICA: 'LOGISTICA',
  IMPOSTO: 'IMPOSTO',
} as const;

export const CURRENCIES = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
];

export const MEASUREMENT_UNITS = [
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'G', label: 'Grama (G)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ML', label: 'Mililitro (ML)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'CM', label: 'Centímetro (CM)' },
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PC', label: 'Peça (PC)' },
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};