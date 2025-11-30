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

  // Frete total
  const totalFreightCost = (rawMaterial.freights || []).reduce(
    (sum, freight) => sum + Number(freight.unitPrice || 0),
    0
  );

  const freightCount = rawMaterial.freights?.length || 0;

  // Base e final
  const basePrice =
    Number(rawMaterial.acquisitionPrice) +
    Number(rawMaterial.additionalCost || 0);

    const nonRecoverableTaxes = (rawMaterial.rawMaterialTaxes || [])
      .filter((tax) => !tax.recoverable)
      .reduce((sum, tax) => sum + basePrice * (Number(tax.rate) / 100), 0);

    const recoverableTaxes = (rawMaterial.rawMaterialTaxes || [])
      .filter((tax) => tax.recoverable)
      .reduce((sum, tax) => sum + basePrice * (Number(tax.rate) / 100), 0);

    // Regra: NÃO somar impostos não recuperáveis ao custo final
    const finalPrice = basePrice + totalFreightCost - recoverableTaxes;

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors align-top">
      {/* Código */}
      <td className="px-4 py-3" title={rawMaterial.code}>
        <Text variant="caption" className="font-semibold text-gray-900">
          <span className="max-w-[110px] inline-block truncate">
            {rawMaterial.code}
          </span>
        </Text>
      </td>

      {/* Nome + Descrição com multiline + truncamento por overflow */}
      <td className="px-4 py-3">
        <div
          className="max-w-[260px] max-h-[56px] overflow-hidden"
          title={rawMaterial.name}
        >
          <Text
            variant="caption"
            className="font-semibold text-gray-900 leading-tight"
          >
            {rawMaterial.name}
          </Text>
        </div>

        {rawMaterial.description && (
          <div
            className="text-gray-500 text-xs mt-1 max-w-[260px] max-h-[48px] overflow-hidden leading-snug"
            title={rawMaterial.description}
          >
            {rawMaterial.description}
          </div>
        )}
      </td>

      {/* Unidade */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {getMeasurementUnitLabel(rawMaterial.measurementUnit)}
        </span>
      </td>

      {/* Grupo */}
      <td className="px-4 py-3" title={rawMaterial.inputGroup || "-"}>
        <span className="max-w-[140px] inline-block overflow-hidden text-ellipsis whitespace-nowrap">
          {rawMaterial.inputGroup || <span className="text-gray-400">-</span>}
        </span>
      </td>

      {/* Prazo */}
      <td className="px-4 py-3">
        <Text variant="caption" className="text-gray-700">
          {rawMaterial.paymentTerm} dias
        </Text>
      </td>

      {/* Preços */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div>
            <Text variant="small" className="text-gray-500">
              Base:
            </Text>
            <Text variant="caption" className="font-medium text-gray-900">
              {getCurrencySymbol(rawMaterial.currency)}{" "}
              {formatCurrency(basePrice).replace("R$", "").trim()}
            </Text>
          </div>

          <div className="pt-1 border-t border-gray-200">
            <Text variant="small" className="text-gray-500">
              Final:
            </Text>
            <Text variant="caption" className="font-semibold text-blue-900">
              {getCurrencySymbol(rawMaterial.currency)}{" "}
              {formatCurrency(finalPrice).replace("R$", "").trim()}
            </Text>
          </div>
        </div>
      </td>

      {/* Fretes */}
      <td className="px-4 py-3">
        {freightCount > 0 ? (
          <div
            className="max-w-[160px] max-h-[56px] overflow-hidden"
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
            <Text variant="small" className="text-gray-500 block">
              Total: {formatCurrency(totalFreightCost)}
            </Text>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Impostos - multiline + truncate por overflow */}
      <td className="px-4 py-3">
        <div
          className="max-w-[200px] max-h-[64px] overflow-hidden"
          title={rawMaterial.rawMaterialTaxes
            ?.map((t) => `${t.name} (${t.rate}%)`)
            .join(", ")}
        >
          {rawMaterial.rawMaterialTaxes?.length ? (
            <div className="flex flex-wrap gap-1">
              {rawMaterial.rawMaterialTaxes.map((tax, index) => (
                <span
                  key={tax.id || index}
                  className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {tax.name} ({tax.rate}%)
                </span>
              ))}
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
            aria-label="Editar Produto"
            onClick={() => onEdit(rawMaterial)}
            className="text-blue-600 hover:bg-blue-50 cursor-pointer"
          />
          <IconButton
            icon={FiTrash2}
            aria-label="Excluir Produto"
            onClick={() => onDelete(rawMaterial.id)}
            className="text-red-600 hover:bg-red-50 cursor-pointer"
          />
        </div>
      </td>
    </tr>
  );
}
