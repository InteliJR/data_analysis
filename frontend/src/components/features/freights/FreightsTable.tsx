// src/components/features/freights/FreightsTable.tsx

import type { Freight } from "@/types";
import { Text } from "@/components/common/Text";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit2, FiTrash2, FiChevronUp } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

interface FreightsTableProps {
  freights: Freight[];
  onEdit: (freight: Freight) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function FreightsTable({
  freights,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: FreightsTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    const isActive = sortBy === column;

    return (
      <span
        className={`
          text-blue-600 w-4 h-4 transition-transform duration-200 
          ${isActive ? "opacity-100" : "opacity-0"} 
          ${isActive && sortOrder === "desc" ? "rotate-180" : ""}
        `}
      >
        <FiChevronUp />
      </span>
    );
  };

  const SortableHeader = ({
    column,
    label,
    width,
  }: {
    column: string;
    label: string;
    width?: string;
  }) => (
    <th
      onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}`}
      style={{ width }}
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        {label}
        <SortIcon column={column} />
      </span>
    </th>
  );

  const getOperationTypeLabel = (type: string) =>
    type === "INTERNAL" ? "Interno" : "Externo";

  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  const calculateFinalPrice = (freight: Freight): number => {
    const unitPrice =
      typeof freight.unitPrice === "string"
        ? parseFloat(freight.unitPrice)
        : freight.unitPrice;

    if (!freight.freightTaxes || freight.freightTaxes.length === 0) {
      return unitPrice;
    }

    // Sum tax percentage rates
    const totalRatePercent = freight.freightTaxes.reduce(
      (sum: number, tax: any) => {
        const rate =
          typeof tax.rate === "string" ? parseFloat(tax.rate) : tax.rate;
        return sum + (rate || 0);
      },
      0
    );

    // Final price is base plus tax percentage (non-recoverable impact)
    const final = unitPrice * (1 + totalRatePercent / 100);
    return final;
  };

  // 📌 Classe utilitária para truncamento
  const truncateClass =
    "max-w-[140px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  const truncateWide =
    "max-w-[220px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader column="name" label="Nome" width="200px" />
              <SortableHeader
                column="originCity"
                label="Origem"
                width="160px"
              />
              <SortableHeader
                column="destinationCity"
                label="Destino"
                width="160px"
              />
              <SortableHeader
                column="cargoType"
                label="Tipo de Carga"
                width="160px"
              />
              <SortableHeader
                column="operationType"
                label="Operação"
                width="120px"
              />
              <SortableHeader
                column="unitPrice"
                label="Preço Base"
                width="130px"
              />

              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[180px]">
                Impostos
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[140px]">
                Preço Final
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[100px]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {freights.map((freight) => {
              const finalPrice = calculateFinalPrice(freight);
              const unitPrice =
                typeof freight.unitPrice === "string"
                  ? parseFloat(freight.unitPrice)
                  : freight.unitPrice;

              return (
                <tr
                  key={freight.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Nome + descrição */}
                  <td className="px-4 py-3 align-top">
                    <div title={freight.name} className={truncateWide}>
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {freight.name.slice(0, 22)}
                        {freight.name.length > 22 && "..."}
                      </Text>
                    </div>

                    {freight.description && (
                      <div
                        title={freight.description}
                        className="text-gray-500 text-xs mt-1 max-w-[220px] truncate"
                      >
                        {freight.description.slice(0, 33)}
                        {freight.description.length > 33 && "..."}
                      </div>
                    )}
                  </td>

                  {/* Origem */}
                  <td
                    className="px-4 py-3"
                    title={`${freight.originCity}, ${freight.originUf}`}
                  >
                    <span className={truncateClass}>
                      {freight.originCity.slice(0, 12)}
                      {freight.originCity.length > 12 && "..."},{" "}
                      {freight.originUf}
                    </span>
                  </td>

                  {/* Destino */}
                  <td
                    className="px-4 py-3"
                    title={`${freight.destinationCity}, ${freight.destinationUf}`}
                  >
                    <span className={truncateClass}>
                      {freight.destinationCity.slice(0, 12)}
                      {freight.destinationCity.length > 12 && "..."},{" "}
                      {freight.destinationUf}
                    </span>
                  </td>

                  {/* Tipo de carga */}
                  <td className="px-4 py-3" title={freight.cargoType}>
                    <span className={truncateClass}>
                      {freight.cargoType.slice(0, 18)}
                      {freight.cargoType.length > 18 && "..."}
                    </span>
                  </td>

                  {/* Operação */}
                  <td className="px-4 py-3">
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${
                          freight.operationType === "INTERNAL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }
                      `}
                    >
                      {getOperationTypeLabel(freight.operationType)}
                    </span>
                  </td>

                  {/* Preço base */}
                  <td className="px-4 py-3 font-semibold">
                    {getCurrencySymbol(freight.currency)}{" "}
                    {formatCurrency(unitPrice).replace("R$", "").trim()}
                  </td>

                  {/* Impostos (com truncamento) */}
                  <td className="px-4 py-3">
                    <div
                      className="max-w-[170px] truncate"
                      title={freight.freightTaxes
                        ?.map((t: any) => `${t.name} (${t.rate}%)`)
                        .join(", ")}
                    >
                      {freight.freightTaxes?.length ? (
                        <div className="flex gap-1 flex-nowrap overflow-hidden">
                          {freight.freightTaxes.map(
                            (tax: any, index: number) => (
                              <span
                                key={tax.id || index}
                                className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 whitespace-nowrap"
                              >
                                {tax.name} ({tax.rate}%)
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Preço Final */}
                  <td className="px-4 py-3">
                    <div>
                      <Text
                        variant="caption"
                        className="font-bold text-gray-900"
                      >
                        {getCurrencySymbol(freight.currency)}{" "}
                        {formatCurrency(finalPrice).replace("R$", "").trim()}
                      </Text>

                      {freight.freightTaxes?.length ? (
                        <Text
                          variant="caption"
                          className="text-xs text-gray-500"
                        >
                          {(() => {
                            const percentage = unitPrice
                              ? ((finalPrice - unitPrice) / unitPrice) * 100
                              : 0;
                            const formatted = percentage.toFixed(2);
                            const sign = percentage > 0 ? "+" : "";
                            return `(${sign}${formatted}%)`;
                          })()}
                        </Text>
                      ) : null}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        icon={FiEdit2}
                        aria-label="Editar frete"
                        onClick={() => onEdit(freight)}
                        className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                      />
                      <IconButton
                        icon={FiTrash2}
                        aria-label="Excluir frete"
                        onClick={() => onDelete(freight.id)}
                        className="text-red-600 hover:bg-red-50 cursor-pointer"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
