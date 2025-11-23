// src/components/features/taxes/RawMaterialTaxForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Text } from "@/components/common/Text";
import { Checkbox } from "@/components/common/Checkbox";
import { Autocomplete } from "@/components/common/Autocomplete";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { FiTrash2 } from "react-icons/fi";
import { useRawMaterialsQuery } from "@/api/rawMaterials";
import { useDebounce } from "@/hooks/useDebounce";
import type { RawMaterialTax } from "@/types/taxes";
import type { CreateRawMaterialTaxDTO } from "@/api/taxes";
import { formatCurrency } from "@/lib/utils";

interface RawMaterialTaxFormProps {
  tax?: RawMaterialTax | null;
  onSubmit: (data: CreateRawMaterialTaxDTO) => void;
  isLoading?: boolean;
}

export function RawMaterialTaxForm({
  tax,
  onSubmit,
  isLoading,
}: RawMaterialTaxFormProps) {
  const [rawMaterialSearch, setRawMaterialSearch] = useState("");
  const [selectedRawMaterialIds, setSelectedRawMaterialIds] = useState<
    string[]
  >([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRawMaterialTaxDTO>({
    defaultValues: tax
      ? {
          name: tax.name,
          rate: Number(tax.rate),
          recoverable: tax.recoverable,
          rawMaterialIds: [],
        }
      : {
          name: "",
          rate: 0,
          recoverable: false,
          rawMaterialIds: [],
        },
  });

  // Query para buscar matérias-primas
  const { data: rawMaterialsData, isLoading: isLoadingRawMaterials } =
    useRawMaterialsQuery({
      page: 1,
      limit: 100,
      search: rawMaterialSearch,
    });

  const debouncedSetRawMaterialSearch = useDebounce((value: string) => {
    setRawMaterialSearch(value);
  }, 300);

  const rate = watch("rate");
  const recoverable = watch("recoverable");

  // Obter IDs das matérias-primas já associadas ao imposto (se editando)
  const alreadyAssociatedRawMaterialIds =
    tax?.rawMaterials?.map((rm) => rm.id) || [];

  // Adicionar matéria-prima à seleção
  const addRawMaterial = (rawMaterialId: string) => {
    if (!selectedRawMaterialIds.includes(rawMaterialId)) {
      const newSelection = [...selectedRawMaterialIds, rawMaterialId];
      setSelectedRawMaterialIds(newSelection);
      setValue("rawMaterialIds", newSelection);
    }
    setRawMaterialSearch("");
  };

  // Remover matéria-prima da seleção
  const removeRawMaterial = (rawMaterialId: string) => {
    const newSelection = selectedRawMaterialIds.filter(
      (id) => id !== rawMaterialId
    );
    setSelectedRawMaterialIds(newSelection);
    setValue("rawMaterialIds", newSelection);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  const handleFormSubmit = (data: CreateRawMaterialTaxDTO) => {
    const cleanedData = {
      ...data,
      name: data.name.trim(),
      rate: Number(data.rate),
      recoverable: data.recoverable,
      rawMaterialIds:
        selectedRawMaterialIds.length > 0 ? selectedRawMaterialIds : undefined,
    };
    onSubmit(cleanedData);
  };

  // Matérias-primas disponíveis para seleção (excluindo já associadas e já selecionadas)
  const availableRawMaterials =
    rawMaterialsData?.data?.filter(
      (rm) =>
        !alreadyAssociatedRawMaterialIds.includes(rm.id) &&
        !selectedRawMaterialIds.includes(rm.id)
    ) || [];

  return (
    <form
      id="raw-material-tax-form"
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
          placeholder="Ex: ICMS, IPI, PIS"
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

      {/* Recuperável */}
      <div>
        <Checkbox
          id="recoverable"
          label="Imposto Recuperável"
          {...register("recoverable")}
        />
        <Text className="text-xs text-gray-500 mt-1">
          Impostos recuperáveis não impactam o custo final da matéria-prima
        </Text>
      </div>

      {/* Matérias-Primas Associadas */}
      <div>
        <Label>Matérias-Primas Associadas (Opcional)</Label>
        <div className="space-y-3">
          <Autocomplete
            options={availableRawMaterials.map((rm) => ({
              value: rm.id,
              label: `${rm.code} - ${rm.name}`,
              description: `${getCurrencySymbol(rm.currency)} ${formatCurrency(
                Number(rm.acquisitionPrice) || 0
              )
                .replace("R$", "")
                .trim()} • ${rm.measurementUnit}`,
            }))}
            value=""
            searchValue={rawMaterialSearch}
            onChange={addRawMaterial}
            onSearchChange={(value) => {
              setRawMaterialSearch(value);
              debouncedSetRawMaterialSearch(value);
            }}
            placeholder="Buscar e adicionar matéria-prima..."
            emptyMessage="Nenhuma matéria-prima disponível"
            isLoading={isLoadingRawMaterials}
          />

          {availableRawMaterials.length === 0 &&
            !isLoadingRawMaterials &&
            !rawMaterialSearch && (
              <Text className="text-sm text-gray-500">
                Nenhuma matéria-prima disponível
              </Text>
            )}

          {selectedRawMaterialIds.length > 0 && (
            <div className="space-y-2">
              <Text className="text-sm font-medium text-gray-700">
                {selectedRawMaterialIds.length} matéria(s)-prima(s) nova(s)
                selecionada(s)
              </Text>
              {selectedRawMaterialIds.map((rawMaterialId) => {
                const rawMaterial = rawMaterialsData?.data?.find(
                  (rm) => rm.id === rawMaterialId
                );
                if (!rawMaterial) return null;

                return (
                  <div
                    key={rawMaterialId}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <Text variant="caption" className="font-semibold">
                        {rawMaterial.code} - {rawMaterial.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {getCurrencySymbol(rawMaterial.currency)}{" "}
                        {formatCurrency(
                          Number(rawMaterial.acquisitionPrice) || 0
                        )
                          .replace("R$", "")
                          .trim()}{" "}
                        • {rawMaterial.measurementUnit}
                      </Text>
                    </div>
                    <SecondaryButton
                      type="button"
                      variant="ghost"
                      leftIcon={FiTrash2}
                      onClick={() => removeRawMaterial(rawMaterialId)}
                      className="cursor-pointer text-red-600 hover:bg-red-50"
                      aria-label="Remover matéria-prima"
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
            <Text className="text-gray-600">Tipo:</Text>
            <Text className="font-semibold">
              {recoverable ? "Recuperável" : "Não Recuperável"}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text className="text-gray-600">Matérias-primas selecionadas:</Text>
            <Text className="font-semibold">
              {selectedRawMaterialIds.length}
            </Text>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
