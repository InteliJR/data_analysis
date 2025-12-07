// src/lib/changeLogs.ts

const BASE_FIELD_LABELS: Record<string, string> = {
  code: "Código",
  name: "Nome",
  description: "Descrição",
  measurementUnit: "Unidade de Medida",
  inputGroup: "Grupo de Insumo",
  paymentTerm: "Prazo de Pagamento",
  acquisitionPrice: "Preço de Aquisição",
  currency: "Moeda",
  priceConvertedBrl: "Preço em BRL",
  additionalCost: "Custo Adicional",
  freights: "Fretes",
  taxes: "Impostos",
  created: "Criação do Registro",
};

const LOCATION_FIELD_LABELS: Record<string, string> = {
  freights: "Fretes",
  taxes: "Impostos",
  created: "Localização adicionada",
  updated: "Localização atualizada",
  removed: "Localização removida",
  snapshot: "Resumo da localização",
};

export function getChangeLogFieldLabel(field: string): string {
  if (!field) return "Campo";

  if (field.startsWith("location:")) {
    const parts = field.split(":");
    // Format: location:<label>:<detail>
    if (parts.length >= 3) {
      const locationLabel = parts[1];
      const detailKey = parts[2];
      const detailLabel = LOCATION_FIELD_LABELS[detailKey] || detailKey;
      return `Localização ${locationLabel} • ${detailLabel}`;
    }
    // Fallback if format unexpected
    return field.replace("location:", "Localização • ");
  }

  return BASE_FIELD_LABELS[field] || field;
}
