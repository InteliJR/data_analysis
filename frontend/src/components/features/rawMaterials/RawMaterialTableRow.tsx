// src/components/features/rawMaterials/RawMaterialTableRow.tsx

import type { RawMaterial } from "@/types/rawMaterial";
import { Text } from "@/components/common/Text";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

interface RawMaterialTableRowProps {
  rawMaterial: RawMaterial;
  onEdit: (rawMaterial: RawMaterial) => void;
  onDelete: (id: string) => void;
}

export function RawMaterialTableRow({
  rawMaterial,
  onEdit,
  onDelete,
}: RawMaterialTableRowProps) {
  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  const getMeasurementUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      KG: "kg",
      G: "g",
      L: "l",
      ML: "ml",
      M: "m",
      CM: "cm",
      UN: "un",
      CX: "cx",
      PC: "pc",
    };
    return labels[unit] || unit;
  };

  const truncateClass =
    "max-w-[140px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  const truncateWide =
    "max-w-[200px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  // Calcular total de fretes
  const totalFreightCost = (rawMaterial.freights || []).reduce(
    (sum, freight) => sum + Number(freight.unitPrice || 0),
    0
  );

  const freightCount = rawMaterial.freights?.length || 0;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Código */}
      <td className="px-4 py-3" title={rawMaterial.code}>
        <Text variant="caption" className="font-semibold text-gray-900">
          <span className="max-w-[110px] truncate inline-block">
            {rawMaterial.code}
          </span>
        </Text>
      </td>

      {/* Nome + Descrição */}
      <td className="px-4 py-3 align-top">
        <div title={rawMaterial.name} className={truncateWide}>
          <Text variant="caption" className="font-semibold text-gray-900">
            {rawMaterial.name.slice(0, 25)}
            {rawMaterial.name.length > 25 && "..."}
          </Text>
        </div>
        {rawMaterial.description && (
          <div
            title={rawMaterial.description}
            className="text-gray-500 text-xs mt-1 max-w-[200px] truncate"
          >
            {rawMaterial.description.slice(0, 35)}
            {rawMaterial.description.length > 35 && "..."}
          </div>
        )}
      </td>

      {/* Unidade de Medida */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {getMeasurementUnitLabel(rawMaterial.measurementUnit)}
        </span>
      </td>

      {/* Grupo de Insumo */}
      <td className="px-4 py-3" title={rawMaterial.inputGroup || "-"}>
        <span className={truncateClass}>
          {rawMaterial.inputGroup || <span className="text-gray-400">-</span>}
        </span>
      </td>

      {/* Prazo de Pagamento */}
      <td className="px-4 py-3">
        <Text variant="caption" className="text-gray-700">
          {rawMaterial.paymentTerm} dias
        </Text>
      </td>

      {/* Preço */}
      <td className="px-4 py-3">
        <div>
          <Text variant="caption" className="font-semibold text-gray-900">
            {getCurrencySymbol(rawMaterial.currency)}{" "}
            {formatCurrency(rawMaterial.acquisitionPrice)
              .replace("R$", "")
              .trim()}
          </Text>
          {rawMaterial.additionalCost > 0 && (
            <Text variant="caption" className="text-xs text-gray-500">
              +{formatCurrency(rawMaterial.additionalCost)} adicional
            </Text>
          )}
        </div>
      </td>

      {/* Frete(s) - CORRIGIDO */}
      <td className="px-4 py-3">
        {freightCount > 0 ? (
          <div
            className="max-w-[140px]"
            title={rawMaterial.freights
              ?.map(
                (f) =>
                  `${f.name}: ${getCurrencySymbol(f.currency)} ${formatCurrency(
                    Number(f.unitPrice || 0)
                  )
                    .replace("R$", "")
                    .trim()}`
              )
              .join(" | ")}
          >
            <Text variant="caption" className="text-gray-700 font-medium">
              {freightCount} {freightCount === 1 ? "frete" : "fretes"}
            </Text>
            <Text variant="small" className="text-gray-500">
              Total: {formatCurrency(totalFreightCost)}
            </Text>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Impostos */}
      <td className="px-4 py-3">
        <div
          className="max-w-[150px] truncate"
          title={rawMaterial.rawMaterialTaxes
            ?.map((t) => `${t.name} (${t.rate}%)`)
            .join(", ")}
        >
          {rawMaterial.rawMaterialTaxes?.length ? (
            <div className="flex gap-1 flex-nowrap overflow-hidden">
              {rawMaterial.rawMaterialTaxes.slice(0, 2).map((tax, index) => (
                <span
                  key={tax.id || index}
                  className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 whitespace-nowrap"
                >
                  {tax.name} ({tax.rate}%)
                </span>
              ))}
              {rawMaterial.rawMaterialTaxes.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{rawMaterial.rawMaterialTaxes.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </td>

      {/* Ações */}
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <IconButton
            icon={FiEdit2}
            aria-label="Editar matéria-prima"
            onClick={() => onEdit(rawMaterial)}
            className="text-blue-600 hover:bg-blue-50 cursor-pointer"
          />
          <IconButton
            icon={FiTrash2}
            aria-label="Excluir matéria-prima"
            onClick={() => onDelete(rawMaterial.id)}
            className="text-red-600 hover:bg-red-50 cursor-pointer"
          />
        </div>
      </td>
    </tr>
  );
}
