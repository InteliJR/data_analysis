// src/components/common/ExportModal.tsx

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Checkbox } from "./Checkbox";
import { toast } from "react-hot-toast";

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
    sortOrder: "asc" | "desc";
  }) => void;
  defaultColumns: ColumnOption[];
}

export function ExportModal({
  isOpen,
  onClose,
  onConfirm,
  defaultColumns,
}: ExportModalProps) {
  const [limit, setLimit] = useState(500);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns.map((col) => col.key)
  );
  const [sortBy, setSortBy] = useState(defaultColumns[0]?.key || "name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Reseta o estado quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setLimit(500);
      setSelectedColumns(defaultColumns.map((col) => col.key));
      setSortBy(defaultColumns[0]?.key || "name");
      setSortOrder("asc");
    }
  }, [isOpen, defaultColumns]);

  const handleColumnChange = (key: string, checked: boolean) => {
    setSelectedColumns((prev) =>
      checked ? [...prev, key] : prev.filter((col) => col !== key)
    );
  };

  const handleSubmit = () => {
    if (selectedColumns.length === 0) {
      toast.error("Selecione pelo menos uma coluna para exportar.");
      return;
    }
    onConfirm({
      limit,
      columns: selectedColumns,
      sortBy,
      sortOrder,
    });
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
          max="10000"
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
            {defaultColumns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </Select>

          <Select
            id="sortOrder"
            label="Ordem"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
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
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4 max-h-[300px] overflow-y-auto">
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
        </div>

        {/* 4. Resumo da Exportação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900 font-medium">
            📊 Resumo da Exportação
          </p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1">
            <li>
              • <strong>{limit}</strong> linhas no máximo
            </li>
            <li>
              • Ordenado por{" "}
              <strong>
                {defaultColumns.find((c) => c.key === sortBy)?.label}
              </strong>{" "}
              em ordem{" "}
              <strong>
                {sortOrder === "asc" ? "crescente" : "decrescente"}
              </strong>
            </li>
            <li>
              • <strong>{selectedColumns.length}</strong> colunas selecionadas
            </li>
          </ul>
        </div>

        {/* 5. Botões de Ação */}
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
