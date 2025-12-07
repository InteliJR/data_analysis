// src/components/features/fixedCosts/PageHeader.tsx

import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/common/Input";
import { FiPlus, FiDownload, FiSearch } from "react-icons/fi";

interface PageHeaderProps {
  onNewFixedCostClick: () => void;
  onExportClick: () => void;
  onSearchChange: (value: string) => void;
  searchValue: string;
}

export function PageHeader({
  onNewFixedCostClick,
  onExportClick,
  onSearchChange,
  searchValue,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Heading as="h1" variant="title" className="mb-4">
        Custos fixos e Overhead
      </Heading>

      <div className="flex items-center justify-between gap-3">
        {/* Campo de Busca à esquerda */}
        <div className="flex-1 max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar por descrição ou código..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botões à direita */}
        <div className="flex gap-3 flex-shrink-0">
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
            onClick={onNewFixedCostClick}
            className="cursor-pointer"
          >
            Novo custo fixo
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
