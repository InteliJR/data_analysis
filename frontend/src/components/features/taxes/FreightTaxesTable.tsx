// src/components/features/taxes/FreightTaxesTable.tsx

import type { FreightTax } from "@/types/taxes";
import { Text } from "@/components/common/Text";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit2, FiTrash2, FiChevronUp } from "react-icons/fi";
import { format } from "date-fns";

interface FreightTaxesTableProps {
  taxes: FreightTax[];
  onEdit: (tax: FreightTax) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function FreightTaxesTable({
  taxes,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: FreightTaxesTableProps) {
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

  const truncateClass =
    "max-w-[180px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader
                column="name"
                label="Nome do Imposto"
                width="300px"
              />
              <SortableHeader column="rate" label="Taxa (%)" width="150px" />
              <SortableHeader
                column="freightsCount"
                label="Qtd. Fretes"
                width="150px"
              />
              <SortableHeader
                column="createdAt"
                label="Data de Criação"
                width="200px"
              />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[120px]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {taxes.map((tax) => (
              <tr
                key={tax.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Nome */}
                <td className="px-4 py-3" title={tax.name}>
                  <div className={truncateClass}>
                    <Text
                      variant="caption"
                      className="font-semibold text-gray-900"
                    >
                      {tax.name}
                    </Text>
                  </div>
                </td>

                {/* Taxa */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {tax.rate}%
                  </span>
                </td>

                {/* Quantidade de Fretes */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {tax.freightsCount || 0}
                  </span>
                </td>

                {/* Data de Criação */}
                <td className="px-4 py-3">
                  <Text variant="caption" className="text-gray-600">
                    {format(new Date(tax.createdAt), "dd/MM/yyyy HH:mm")}
                  </Text>
                </td>

                {/* Ações */}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton
                      icon={FiEdit2}
                      aria-label="Editar imposto"
                      onClick={() => onEdit(tax)}
                      className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                    />
                    <IconButton
                      icon={FiTrash2}
                      aria-label="Excluir imposto"
                      onClick={() => onDelete(tax.id)}
                      className="text-red-600 hover:bg-red-50 cursor-pointer"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
