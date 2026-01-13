// src/components/features/rawMaterials/FreightSelector.tsx

import { useState } from "react";
import { useFreightsQuery } from "@/api/freights";
import { Autocomplete } from "@/components/common/Autocomplete";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface FreightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FreightSelector({ value, onChange, error }: FreightSelectorProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFreightsQuery({
    page: 1,
    limit: 50,
    search,
    sortBy: "name",
    sortOrder: "asc",
  });

  const debouncedSetSearch = useDebounce((value: string) => {
    setSearch(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const freights = data?.data || [];
  const selectedFreight = freights.find((f) => f.id === value);

  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  return (
    <div className="space-y-2">
      <Autocomplete
        label="Selecionar Frete"
        required
        placeholder="Buscar frete por nome, cidade..."
        value={value}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onChange={onChange}
        options={freights.map((freight) => ({
          value: freight.id,
          label: freight.name,
        }))}
        isLoading={isLoading}
        error={error}
        renderOption={(freight) => (
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <Text variant="caption" className="font-medium text-gray-900 truncate">
                {freight.name}
              </Text>
              <Text variant="small" className="text-gray-500 truncate">
                {freight.originCity}, {freight.originUf} → {freight.destinationCity}, {freight.destinationUf}
              </Text>
            </div>
            <Text variant="caption" className="font-semibold text-gray-700 ml-2 flex-shrink-0">
              {getCurrencySymbol(freight.currency)} {formatCurrency(freight.unitPrice).replace("R$", "").trim()}
            </Text>
          </div>
        )}
      />

      {/* Preview do frete selecionado */}
      {selectedFreight && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
          <Text variant="caption" className="font-semibold text-gray-900">
            {selectedFreight.name}
          </Text>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <Text variant="small" className="text-gray-600">Origem:</Text>
              <Text variant="small" className="font-medium">
                {selectedFreight.originCity}, {selectedFreight.originUf}
              </Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">Destino:</Text>
              <Text variant="small" className="font-medium">
                {selectedFreight.destinationCity}, {selectedFreight.destinationUf}
              </Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">Tipo de Carga:</Text>
              <Text variant="small" className="font-medium">{selectedFreight.cargoType}</Text>
            </div>
            <div>
              <Text variant="small" className="text-gray-600">Preço:</Text>
              <Text variant="small" className="font-semibold text-blue-900">
                {getCurrencySymbol(selectedFreight.currency)} {formatCurrency(selectedFreight.unitPrice).replace("R$", "").trim()}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}