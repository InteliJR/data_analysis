// src/components/features/taxes/FreightTaxForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Text } from "@/components/common/Text";
import { Autocomplete } from "@/components/common/Autocomplete";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { FiTrash2 } from "react-icons/fi";
import { useFreightsQuery } from "@/api/freights";
import { useDebounce } from "@/hooks/useDebounce";
import type { FreightTax } from "@/types/taxes";
import type { CreateFreightTaxDTO } from "@/api/taxes";
import { formatCurrency } from "@/lib/utils";

interface FreightTaxFormProps {
  tax?: FreightTax | null;
  onSubmit: (data: CreateFreightTaxDTO) => void;
  isLoading?: boolean;
}

export function FreightTaxForm({
  tax,
  onSubmit,
}: FreightTaxFormProps) {
  const [freightSearch, setFreightSearch] = useState("");
  const [selectedFreightIds, setSelectedFreightIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateFreightTaxDTO>({
    defaultValues: tax
      ? {
          name: tax.name,
          rate: Number(tax.rate),
          freightIds: [],
        }
      : {
          name: "",
          rate: 0,
          freightIds: [],
        },
  });

  // Query para buscar fretes
  const { data: freightsData, isLoading: isLoadingFreights } = useFreightsQuery(
    {
      page: 1,
      limit: 100,
      search: freightSearch,
    }
  );

  const debouncedSetFreightSearch = useDebounce((value: string) => {
    setFreightSearch(value);
  }, 300);

  const rate = watch("rate");

  // Obter IDs dos fretes já associados ao imposto (se editando)
  const alreadyAssociatedFreightIds = tax?.freights?.map((f) => f.id) || [];

  // Adicionar frete à seleção
  const addFreight = (freightId: string) => {
    if (!selectedFreightIds.includes(freightId)) {
      const newSelection = [...selectedFreightIds, freightId];
      setSelectedFreightIds(newSelection);
      setValue("freightIds", newSelection);
    }
    setFreightSearch("");
  };

  // Remover frete da seleção
  const removeFreight = (freightId: string) => {
    const newSelection = selectedFreightIds.filter((id) => id !== freightId);
    setSelectedFreightIds(newSelection);
    setValue("freightIds", newSelection);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  const handleFormSubmit = (data: CreateFreightTaxDTO) => {
    const cleanedData = {
      ...data,
      name: data.name.trim(),
      rate: Number(data.rate),
      freightIds:
        selectedFreightIds.length > 0 ? selectedFreightIds : undefined,
    };
    onSubmit(cleanedData);
  };

  // Fretes disponíveis para seleção (excluindo já associados e já selecionados)
  const availableFreights =
    freightsData?.data?.filter(
      (freight) =>
        !alreadyAssociatedFreightIds.includes(freight.id) &&
        !selectedFreightIds.includes(freight.id)
    ) || [];

  return (
    <form
      id="freight-tax-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {/* Nome */}
      <div>
        <Label htmlFor="name">
          Nome do Imposto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: ICMS, PIS, COFINS"
          maxLength={40}
          {...register("name", {
            required: "Nome é obrigatório",
            minLength: {
              value: 2,
              message: "Nome deve ter no mínimo 2 caracteres",
            },
            maxLength: {
              value: 40,
              message: "Nome deve ter no máximo 40 caracteres",
            },
          })}
          error={errors.name?.message}
        />
      </div>

      {/* Taxa */}
      <div>
        <Label htmlFor="rate">
          Taxa (%) <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            placeholder="0.00"
            className="flex-1"
            {...register("rate", {
              required: "Taxa é obrigatória",
              min: { value: 0.01, message: "Taxa deve ser maior que 0%" },
              max: { value: 100, message: "Taxa deve ser no máximo 100%" },
              valueAsNumber: true,
            })}
            error={errors.rate?.message}
          />
          <span className="text-gray-700 font-medium">%</span>
        </div>
      </div>

      {/* Fretes Associados */}
      <div>
        <Label>Fretes Associados (Opcional)</Label>
        <div className="space-y-3">
          <Autocomplete
            options={availableFreights.map((freight) => ({
              value: freight.id,
              label: freight.name,
              description: `${getCurrencySymbol(
                freight.currency
              )} ${formatCurrency(Number(freight.unitPrice) || 0)
                .replace("R$", "")
                .trim()} • ${freight.originCity}/${freight.originUf} → ${
                freight.destinationCity
              }/${freight.destinationUf}`,
            }))}
            value=""
            searchValue={freightSearch}
            onChange={addFreight}
            onSearchChange={(value) => {
              setFreightSearch(value);
              debouncedSetFreightSearch(value);
            }}
            placeholder="Buscar e adicionar frete..."
            emptyMessage="Nenhum frete disponível"
            isLoading={isLoadingFreights}
          />

          {availableFreights.length === 0 &&
            !isLoadingFreights &&
            !freightSearch && (
              <Text className="text-sm text-gray-500">
                Nenhum frete disponível
              </Text>
            )}

          {selectedFreightIds.length > 0 && (
            <div className="space-y-2">
              <Text className="text-sm font-medium text-gray-700">
                {selectedFreightIds.length} frete(s) novo(s) selecionado(s)
              </Text>
              {selectedFreightIds.map((freightId) => {
                const freight = freightsData?.data?.find(
                  (f) => f.id === freightId
                );
                if (!freight) return null;

                return (
                  <div
                    key={freightId}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <Text variant="caption" className="font-semibold">
                        {freight.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {freight.originCity}/{freight.originUf} →{" "}
                        {freight.destinationCity}/{freight.destinationUf} •{" "}
                        {getCurrencySymbol(freight.currency)}{" "}
                        {formatCurrency(Number(freight.unitPrice) || 0)
                          .replace("R$", "")
                          .trim()}
                      </Text>
                    </div>
                    <SecondaryButton
                      type="button"
                      variant="ghost"
                      leftIcon={FiTrash2}
                      onClick={() => removeFreight(freightId)}
                      className="cursor-pointer text-red-600 hover:bg-red-50"
                      aria-label="Remover frete"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Text className="font-semibold text-blue-900 mb-2">
          Preview do Imposto
        </Text>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <Text className="text-gray-600">Taxa:</Text>
            <Text className="font-semibold">{rate.toFixed(2)}%</Text>
          </div>
          <div className="flex justify-between">
            <Text className="text-gray-600">Fretes selecionados:</Text>
            <Text className="font-semibold">{selectedFreightIds.length}</Text>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
