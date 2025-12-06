// src/components/features/rawMaterials/RawMaterialTableRow.tsx

import { useMemo } from "react";
import type { RawMaterial } from "@/types/RawMaterials";
import { Text } from "@/components/common/Text";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

interface LocationColumnMeta {
  id: string;
  title: string;
  subtitle?: string;
}

interface RawMaterialTableRowProps {
  rawMaterial: RawMaterial;
  onEdit: (rawMaterial: RawMaterial) => void;
  onDelete: (id: string) => void;
  locationColumns: LocationColumnMeta[];
}

export function RawMaterialTableRow({
  rawMaterial,
  onEdit,
  onDelete,
  locationColumns,
}: RawMaterialTableRowProps) {
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

  const locationMetrics = useMemo(() => {
    const map = new Map<string, { currency: string; base: number; final: number }>();

    rawMaterial.locations?.forEach((pivot) => {
      if (!pivot?.locationId) return;
      const acquisition = Number(pivot.acquisitionPrice ?? 0);
      const additional = Number(pivot.additionalCost ?? 0);
      const basePrice = acquisition + additional;

      const freightTotal = (pivot.freights ?? []).reduce((sum, freight) => {
        return sum + Number(freight.unitPrice ?? 0);
      }, 0);

      const recoverableTaxes = (pivot.locationTaxes ?? []).reduce((sum, tax) => {
        if (!tax.recoverable) return sum;
        const rate = Number(tax.rate ?? 0) / 100;
        return sum + basePrice * rate;
      }, 0);

      const finalPrice = basePrice + freightTotal - recoverableTaxes;

      map.set(pivot.locationId, {
        currency: pivot.currency ?? "BRL",
        base: basePrice,
        final: finalPrice,
      });
    });

    return map;
  }, [rawMaterial.locations]);

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

      {/* Preços por localidade */}
      {locationColumns.length > 0 ? (
        locationColumns.map((column) => {
          const metrics = locationMetrics.get(column.id);

          return (
            <td key={`${rawMaterial.id}-${column.id}`} className="px-4 py-3 align-top">
              {metrics ? (
                <div className="space-y-2">
                  <div>
                    <Text variant="small" className="text-gray-500">
                      Base:
                    </Text>
                    <Text variant="caption" className="font-medium text-gray-900">
                      {formatCurrency(metrics.base, metrics.currency)}
                    </Text>
                  </div>
                  <div className="pt-1 border-t border-gray-200">
                    <Text variant="small" className="text-gray-500">
                      Final:
                    </Text>
                    <Text variant="caption" className="font-semibold text-blue-900">
                      {formatCurrency(metrics.final, metrics.currency)}
                    </Text>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
          );
        })
      ) : (
        <td className="px-4 py-3 text-gray-400">Nenhuma localidade cadastrada</td>
      )}

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
