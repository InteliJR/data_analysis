// src/components/features/rawMaterials/PageHeader.tsx

import React from "react";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/common/Input";
import { FiPlus, FiDownload, FiSearch } from "react-icons/fi";

interface PageHeaderProps {
  onNewRawMaterialClick: () => void;
  onExportClick: () => void;
  onNewLocationClick: () => void;
  onSearchChange: (value: string) => void;
  searchValue: string;
}

export function PageHeader({
  onNewRawMaterialClick,
  onExportClick,
  onNewLocationClick,
  onSearchChange,
  searchValue,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Heading as="h1" variant="title" className="mb-4">
        Produto
      </Heading>

      <div className="flex items-center justify-between gap-3">
        {/* Campo de Busca à esquerda */}
        <div className="flex-1 max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar por código, nome, grupo..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botões à direita */}
        <div className="flex gap-3 flex-shrink-0">
          <SecondaryButton
            variant="ghost"
            leftIcon={FiPlus}
            onClick={onNewLocationClick}
            className="cursor-pointer"
          >
            Nova Localização
          </SecondaryButton>
          <SecondaryButton
            variant="secondary"
            leftIcon={FiDownload}
            onClick={onExportClick}
            className="cursor-pointer"
          >
            Exportar CSV
          </SecondaryButton>

          <SecondaryButton
            variant="primary"
            leftIcon={FiPlus}
            onClick={onNewRawMaterialClick}
            className="cursor-pointer"
          >
            Novo Produto
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
