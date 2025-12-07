import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { FindAllProductGroupsQuery } from '@/api/productgroups';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Partial<FindAllProductGroupsQuery>) => void;
  currentFilters: FindAllProductGroupsQuery;
}

export function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [search, setSearch] = useState(currentFilters.search || '');
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || '');
  const [sortOrder, setSortOrder] = useState(currentFilters.sortOrder || 'asc');

  useEffect(() => {
    if (isOpen) {
      setSearch(currentFilters.search || '');
      setSortBy(currentFilters.sortBy || '');
      setSortOrder(currentFilters.sortOrder || 'asc');
    }
  }, [isOpen, currentFilters]);

  const handleApply = () => {
    onApply({
      search: search || undefined,
      sortBy: sortBy as FindAllProductGroupsQuery['sortBy'] || undefined,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    onClose();
  };

  const handleClear = () => {
    setSearch('');
    setSortBy('');
    setSortOrder('asc');
    onApply({});
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={handleClear}>
        Limpar filtros
      </Button>
      <Button onClick={handleApply}>
        Aplicar filtros
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrar Grupos"
      footer={footer}
    >
      <div className="space-y-4">
        <Input
          label="Buscar por nome"
          placeholder="Digite o nome do grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          label="Ordenar por"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="name">Nome</option>
          <option value="volumePercentageByQuantity">% Volume (Quantidade)</option>
          <option value="volumePercentageByValue">% Volume (Valor)</option>
          <option value="averagePrice">Preço Médio</option>
        </Select>

        {sortBy && (
          <Select
            label="Ordem"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </Select>
        )}
      </div>
    </Modal>
  );
}