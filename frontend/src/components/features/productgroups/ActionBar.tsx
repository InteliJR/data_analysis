import { useState } from "react";
import { Plus, Download, Search } from "lucide-react";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { ExportModal } from "./ExportModal";
import { useDebounce } from "@/hooks/useDebounce";
import type { FindAllProductGroupsQuery } from "@/api/productgroups";

interface ActionBarProps {
  onNewGroup: () => void;
  onFilterChange: (filters: Partial<FindAllProductGroupsQuery>) => void;
  onExport: (filters: Partial<FindAllProductGroupsQuery>) => void;
  currentFilters: FindAllProductGroupsQuery;
}

export function ActionBar({
  onNewGroup,
  onFilterChange,
  onExport,
  currentFilters,
}: ActionBarProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  // Lógica de Debounce para a busca
  const debouncedSearch = useDebounce((value: string) => {
    onFilterChange({ search: value || undefined });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Linha única: Busca e Botões Principais */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Campo de Busca */}
          <div className="w-full sm:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome do grupo..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-[448px] pl-10 h-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white focus:border-blue-500 transition-color stext-sm"
              />
            </div>
          </div>

          {/* Botões de Ação (Exportar e Novo) */}
          <div className="flex gap-2 w-full sm:w-auto">
            <SecondaryButton
              variant="secondary"
              leftIcon={Download}
              onClick={() => setIsExportModalOpen(true)}
              className="cursor-pointer"
            >
              Exportar CSV
            </SecondaryButton>

            <SecondaryButton
              variant="primary"
              leftIcon={Plus}
              onClick={onNewGroup}
              className="cursor-pointer"
            >
              Novo grupo de produto
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* Modal de Exportação */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={onExport}
        currentFilters={currentFilters}
      />
    </>
  );
}
