// src/components/features/rawMaterials/RawMaterialTable.tsx

import type { RawMaterial } from "@/types/rawMaterial";
import { RawMaterialTableRow } from "./RawMaterialTableRow";
import { FiChevronUp } from "react-icons/fi";

interface RawMaterialTableProps {
  rawMaterials: RawMaterial[];
  onEdit: (rawMaterial: RawMaterial) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function RawMaterialTable({
  rawMaterials,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: RawMaterialTableProps) {
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

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader column="code" label="Código" width="120px" />
              <SortableHeader column="name" label="Nome" width="200px" />
              <SortableHeader
                column="measurementUnit"
                label="Unidade"
                width="100px"
              />
              <SortableHeader column="inputGroup" label="Grupo" width="140px" />
              <SortableHeader
                column="paymentTerm"
                label="Prazo Pgto"
                width="120px"
              />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[160px]">
                Localidades
              </th>
              <SortableHeader
                column="acquisitionPrice"
                label="Preços"
                width="160px"
              />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[140px]">
                Frete
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[160px]">
                Impostos
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[100px]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {rawMaterials.map((rawMaterial) => (
              <RawMaterialTableRow
                key={rawMaterial.id}
                rawMaterial={rawMaterial}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
