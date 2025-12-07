// src/components/features/fixedCosts/ExportModal.tsx

import  { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { toast } from 'react-hot-toast';

type ColumnOption = {
  key: string;
  label: string;
};

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { 
    limit: number; 
    columns: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) => void;
  defaultColumns: ColumnOption[];
}

const SORT_OPTIONS = [
  { value: 'description', label: 'Descrição' },
  { value: 'code', label: 'Código' },
  { value: 'personnelExpenses', label: 'Pessoal' },
  { value: 'generalExpenses', label: 'Outros' },
  { value: 'proLabore', label: 'Pró-Labore' },
  { value: 'depreciation', label: 'Depreciação' },
  { value: 'totalCost', label: 'Total' },
  { value: 'calculationDate', label: 'Data de Cálculo' },
  { value: 'createdAt', label: 'Data de Criação' },
];

export function ExportModal({
  isOpen,
  onClose,
  onConfirm,
  defaultColumns,
}: ExportModalProps) {
  const [limit, setLimit] = useState(500);
  const [sortBy, setSortBy] = useState('calculationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns.map((col) => col.key)
  );

  // Reseta o estado quando o modal é fechado
  useEffect(() => {
    if (isOpen) {
      setLimit(500);
      setSortBy('calculationDate');
      setSortOrder('desc');
      setSelectedColumns(defaultColumns.map((col) => col.key));
    }
  }, [isOpen, defaultColumns]);

  const handleColumnChange = (key: string, checked: boolean) => {
    setSelectedColumns((prev) =>
      checked ? [...prev, key] : prev.filter((col) => col !== key)
    );
  };

  const handleSubmit = () => {
    if (selectedColumns.length === 0) {
      toast.error('Selecione pelo menos uma coluna para exportar.');
      return;
    }
    onConfirm({ limit, columns: selectedColumns, sortBy, sortOrder });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Exportação CSV">
      <div className="space-y-6">
        {/* 1. Limite de Linhas */}
        <Input
          id="limit"
          label="Limite de linhas"
          type="number"
          min="1"
          value={limit}
          onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
        />

        {/* 2. Ordenação */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="sortBy"
            label="Ordenar por"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            id="sortOrder"
            label="Ordem"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Crescente (A-Z, 0-9)</option>
            <option value="desc">Decrescente (Z-A, 9-0)</option>
          </Select>
        </div>

        {/* 3. Seleção de Colunas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colunas para incluir
          </label>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 max-h-80 overflow-y-auto">
            {defaultColumns.map((col) => (
              <Checkbox
                key={col.key}
                id={col.key}
                label={col.label}
                checked={selectedColumns.includes(col.key)}
                onChange={(e) => handleColumnChange(col.key, e.target.checked)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedColumns.length} de {defaultColumns.length} colunas selecionadas
          </p>
        </div>

        {/* 4. Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            Gerar CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}