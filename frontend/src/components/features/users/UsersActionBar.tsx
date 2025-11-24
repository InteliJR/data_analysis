import React, { useState } from "react";
import { Search, Plus, Download } from "lucide-react";
import { Select } from "@/components/common/Select";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { useDebounce } from "@/hooks/useDebounce";
import type { UserRole } from "@/types/user";

interface UsersActionBarProps {
  onNewUserClick: () => void;
  onSearchChange: (search: string) => void;
  onRoleFilterChange: (role: UserRole | undefined) => void;
  onStatusFilterChange: (isActive: boolean | undefined) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function UsersActionBar({
  onNewUserClick,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onExport,
  isExporting = false,
}: UsersActionBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce((value: string) => {
    onSearchChange(value);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Linha 1: Busca e Botão Novo */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email"
              value={searchValue}
              onChange={handleSearchChange}
              className="w-[448px] h-10 bg-white text-sm pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <SecondaryButton
            variant="secondary"
            leftIcon={Download}
            onClick={onExport}
            className="cursor-pointer"
          >
            Exportar CSV
          </SecondaryButton>

          <SecondaryButton
            variant="primary"
            leftIcon={Plus}
            onClick={onNewUserClick}
            className="cursor-pointer"
          >
            Novo Usuário
          </SecondaryButton>
        </div>
      </div>

      {/* Linha 2: Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select
            onChange={(e) => {
              const value = e.target.value;
              onRoleFilterChange(
                value === "" ? undefined : (value as UserRole)
              );
            }}
          >
            <option value="">Todas as funções</option>
            <option value="ADMIN">ADMIN</option>
            <option value="COMERCIAL">COMERCIAL</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="IMPOSTO">IMPOSTO</option>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select
            onChange={(e) => {
              const value = e.target.value;
              onStatusFilterChange(value === "" ? undefined : value === "true");
            }}
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
