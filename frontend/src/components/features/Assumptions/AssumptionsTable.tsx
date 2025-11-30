// src/components/features/assumptions/AssumptionsTable.tsx

import React from 'react';
import type { AssumptionItem } from '@/types';
import { Text } from '@/components/common/Text';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface AssumptionsTableProps {
  items: AssumptionItem[];
}

// Helper para formatar a porcentagem
const formatPercent = (value: number) => {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}%`;
};

export function AssumptionsTable({ items }: AssumptionsTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeaderCell>Itens</TableHeaderCell>
            <TableHeaderCell sortable>Grupo de Estruturas 1</TableHeaderCell>
            <TableHeaderCell sortable>Grupo de Estruturas 2</TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            // Cores alternadas
            <tr 
              key={item.id} 
              className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {/* Nome do Item */}
              <td className="px-4 py-3">
                <Text variant="caption" className="font-semibold text-gray-900">
                  {item.item}
                </Text>
              </td>
              {/* Grupo 1 Valor */}
              <td className="px-4 py-3">
                <Text variant="caption">{formatPercent(item.group1)}</Text>
              </td>
              {/* Grupo 2 Valor */}
              <td className="px-4 py-3">
                <Text variant="caption">{formatPercent(item.group2)}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}