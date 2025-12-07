// src/components/features/fixedCosts/FixedCostsSummaryTable.tsx

import type { FixedCost } from '@/types/fixed_costs';
import { Text } from '@/components/common/Text';
import { IconButton } from '@/components/common/IconButton';
import { FiEdit2, FiTrash2, FiChevronUp } from 'react-icons/fi';
import { formatCurrency } from '@/lib/utils';

interface FixedCostsSummaryTableProps {
  costs: FixedCost[];
  onEdit: (cost: FixedCost) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function FixedCostsSummaryTable({
  costs,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: FixedCostsSummaryTableProps) {
  
  const calculateTotals = (costs: FixedCost[]) => {
    return costs.reduce((acc, cost) => {
      const c: any = cost;
      const personnelExpenses = Number(c.personnelExpenses) || 0;
      const generalExpenses = Number(c.generalExpenses) || 0;
      const proLabore = Number(c.proLabore) || 0;
      const depreciation = Number(c.depreciation) || 0;
      const totalCost = Number(c.totalCost) || 0;

      acc.personnelExpenses += personnelExpenses;
      acc.generalExpenses += generalExpenses;
      acc.proLabore += proLabore;
      acc.depreciation += depreciation;
      acc.totalCost += totalCost;
      return acc;
    }, {
      personnelExpenses: 0,
      generalExpenses: 0,
      proLabore: 0,
      depreciation: 0,
      totalCost: 0,
    });
  };

  const totals = calculateTotals(costs);

  /** Ícone animado com rotação suave */
  const SortIcon = ({ column }: { column: string }) => {
    const isActive = sortBy === column;

    return (
      <span
        className={`
          text-blue-600 w-4 h-4 transition-transform duration-200 
          ${isActive ? 'opacity-100' : 'opacity-0'} 
          ${isActive && sortOrder === 'desc' ? 'rotate-180' : ''}
        `}
      >
        <FiChevronUp />
      </span>
    );
  };

  const SortableHeader = ({
    column,
    label,
  }: {
    column: string;
    label: string;
  }) => (
    <th
      onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}`}
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon column={column} />
      </span>
    </th>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto mb-8">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableHeader column="description" label="Descrição" />
            <SortableHeader column="code" label="Código" />
            <SortableHeader column="personnelExpenses" label="Pessoal" />
            <SortableHeader column="generalExpenses" label="Outros" />
            <SortableHeader column="proLabore" label="Pró-Labore" />
            <SortableHeader column="depreciation" label="Depreciação" />
            <SortableHeader column="totalCost" label="Total" />

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              % Gastos
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {costs.map((cost) => {

            return (
              <tr
                key={cost.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Text variant="caption" className="font-semibold text-gray-900">
                    {cost.description}
                  </Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{cost.code || '-'}</Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{formatCurrency(Number((cost as any).personnelExpenses) || 0)}</Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{formatCurrency(Number((cost as any).generalExpenses) || 0)}</Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{formatCurrency(Number((cost as any).proLabore) || 0)}</Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{formatCurrency(Number((cost as any).depreciation) || 0)}</Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption" className="font-semibold">
                    {formatCurrency(Number((cost as any).totalCost) || 0)}
                  </Text>
                </td>
                <td className="px-4 py-3">
                  <Text variant="caption">{Number((cost as any).considerationPercentage) || 0}%</Text>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton
                      icon={FiEdit2}
                      aria-label="Editar custo fixo"
                      onClick={() => onEdit(cost)}
                      className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                    />
                    <IconButton
                      icon={FiTrash2}
                      aria-label="Excluir custo fixo"
                      onClick={() => onDelete(cost.id)}
                      className="text-red-600 hover:bg-red-50 cursor-pointer"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
          <tr>
            <th className="px-4 py-3 text-left" colSpan={2}>
              <Text variant="caption" className="font-bold uppercase text-gray-700">
                TOTAL GERAL
              </Text>
            </th>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold">
                {formatCurrency(totals.personnelExpenses)}
              </Text>
            </th>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold">
                {formatCurrency(totals.generalExpenses)}
              </Text>
            </th>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold">
                {formatCurrency(totals.proLabore)}
              </Text>
            </th>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold">
                {formatCurrency(totals.depreciation)}
              </Text>
            </th>
            <th className="px-4 py-3 text-left">
              <Text variant="caption" className="font-bold">
                {formatCurrency(totals.totalCost)}
              </Text>
            </th>
            <th />
            <th />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
