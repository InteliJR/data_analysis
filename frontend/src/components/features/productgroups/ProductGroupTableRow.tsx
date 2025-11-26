import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import type { ProductGroup } from "@/types/productGroup";

interface ProductGroupTableRowProps {
  group: ProductGroup;
  onEdit: (group: ProductGroup) => void;
  onDelete: (group: ProductGroup) => void;
}

export function ProductGroupTableRow({
  group,
  onEdit,
  onDelete,
}: ProductGroupTableRowProps) {
  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {group.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
        <span title={group.description || ""}>
          {truncateText(group.description, 50)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatPercentage(group.volumePercentageByQuantity)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatCurrency(group.averagePrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
        {formatCurrency(group.overheadPerUnit ?? 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {group.porcentage !== undefined && group.porcentage !== null ? `${group.porcentage}%` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {group.volumevendasconsiderar ?? '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <IconButton
            icon={Pencil}
            onClick={() => onEdit(group)}
            aria-label={`Editar ${group.name}`}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
          />
          <IconButton
            icon={Trash2}
            onClick={() => onDelete(group)}
            aria-label={`Excluir ${group.name}`}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
          />
        </div>
      </td>
    </tr>
  );
}
