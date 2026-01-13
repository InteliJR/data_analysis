import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function triggerCsvDownload(blob: Blob, filename: string) {
  // Cria uma URL temporária para o blob
  const url = window.URL.createObjectURL(blob);
  
  // Cria um link <a> invisível
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename; // Define o nome do arquivo
  
  // Adiciona o link ao DOM, clica nele e remove
  document.body.appendChild(a);
  a.click();
  
  // Limpa a URL e remove o link
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}