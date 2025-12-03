import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ProductGroupTableRow } from "./ProductGroupTableRow";
import type { ProductGroup } from "@/types/productGroup";
import type { FindAllProductGroupsQuery } from "@/api/productgroups";

interface ProductGroupTableProps {
  groups: ProductGroup[];
  onEdit: (group: ProductGroup) => void;
  onDelete: (group: ProductGroup) => void;
  onSort: (sortBy: string) => void;
  currentFilters: FindAllProductGroupsQuery;
}

export function ProductGroupTable({
  groups,
  onEdit,
  onDelete,
  onSort,
  currentFilters,
}: ProductGroupTableProps) {
  const getSortIcon = (columnKey: string) => {
    if (currentFilters.sortBy !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return currentFilters.sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-600" />
    );
  };

  const handleSort = (columnKey: string) => {
    onSort(columnKey);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                Nome
                {getSortIcon("name")}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descrição
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("volumePercentageByQuantity")}
            >
              <div className="flex items-center gap-2">
                % Volume (Qtd)
                {getSortIcon("volumePercentageByQuantity")}
              </div>
            </th>
            
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("averagePrice")}
            >
              <div className="flex items-center gap-2">
                Preço Médio
                {getSortIcon("averagePrice")}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort("overheadPerUnit")}
            >
              <div className="flex items-center gap-2">
                Overhead/Unidade
                {getSortIcon("overheadPerUnit")}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Grupo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volume Considerar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {groups.map((group) => (
            <ProductGroupTableRow
              key={group.id}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
