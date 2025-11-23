// src/components/features/rawMaterials/RawMaterialForm.tsx

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { RawMaterial } from "@/types/rawMaterial";
import type { CreateRawMaterialDTO } from "@/api/rawMaterials";

import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Text } from "@/components/common/Text";
import { Checkbox } from "@/components/common/Checkbox";
import { Autocomplete } from "@/components/common/Autocomplete";

import { FiPlus, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

import { useFreightsQuery } from "@/api/freights";
import { useRawMaterialTaxesQuery } from "@/api/taxes";
import { useDebounce } from "@/hooks/useDebounce";

const MEASUREMENT_UNITS = [
  { value: "KG", label: "Quilograma (kg)" },
  { value: "G", label: "Grama (g)" },
  { value: "L", label: "Litro (l)" },
  { value: "ML", label: "Mililitro (ml)" },
  { value: "M", label: "Metro (m)" },
  { value: "CM", label: "Centímetro (cm)" },
  { value: "UN", label: "Unidade (un)" },
  { value: "CX", label: "Caixa (cx)" },
  { value: "PC", label: "Peça (pc)" },
];

interface RawMaterialFormProps {
  rawMaterial?: RawMaterial | null;
  onSubmit: (data: CreateRawMaterialDTO) => void;
  isLoading?: boolean;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function RawMaterialForm({
  rawMaterial,
  onSubmit,
  isLoading,
}: RawMaterialFormProps) {
  const [freightSearch, setFreightSearch] = useState("");
  const [taxSearch, setTaxSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateRawMaterialDTO>({
    // CORREÇÃO: Forçamos a conversão para Number aqui para evitar strings no input
    defaultValues: rawMaterial
      ? {
          code: rawMaterial.code,
          name: rawMaterial.name,
          description: rawMaterial.description || "",
          measurementUnit: rawMaterial.measurementUnit,
          inputGroup: rawMaterial.inputGroup || "",
          paymentTerm: Number(rawMaterial.paymentTerm),
          acquisitionPrice: Number(rawMaterial.acquisitionPrice),
          currency: rawMaterial.currency,
          priceConvertedBrl: Number(rawMaterial.priceConvertedBrl),
          additionalCost: Number(rawMaterial.additionalCost || 0),
          freightIds: rawMaterial.freights?.map((f) => f.id) || [],
          rawMaterialTaxes: rawMaterial.rawMaterialTaxes || [],
        }
      : {
          code: "",
          name: "",
          description: "",
          measurementUnit: "KG",
          inputGroup: "",
          paymentTerm: 30,
          acquisitionPrice: 0,
          currency: "BRL",
          priceConvertedBrl: 0,
          additionalCost: 0,
          freightIds: [],
          rawMaterialTaxes: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rawMaterialTaxes",
  });

  // Queries
  const { data: freightsData, isLoading: isLoadingFreights } = useFreightsQuery(
    {
      page: 1,
      limit: 50,
      search: freightSearch,
    }
  );

  const { data: existingTaxesData } = useRawMaterialTaxesQuery({
    page: 1,
    limit: 50,
    search: taxSearch,
  });

  const debouncedSetFreightSearch = useDebounce((value: string) => {
    setFreightSearch(value);
  }, 300);

  const acquisitionPrice = Number(watch("acquisitionPrice")) || 0;
  const additionalCost = Number(watch("additionalCost")) || 0;
  const currency = watch("currency");
  const rawMaterialTaxes = watch("rawMaterialTaxes") || [];
  const selectedFreightIds = watch("freightIds") || [];

  const totalBeforeTaxes = acquisitionPrice + additionalCost;

  const recoverableTaxes = rawMaterialTaxes.reduce((sum, tax) => {
    if (tax.recoverable) {
      const rate = Number(tax.rate) || 0;
      return sum + totalBeforeTaxes * (rate / 100);
    }
    return sum;
  }, 0);

  const nonRecoverableTaxes = rawMaterialTaxes.reduce((sum, tax) => {
    if (!tax.recoverable) {
      const rate = Number(tax.rate) || 0;
      return sum + totalBeforeTaxes * (rate / 100);
    }
    return sum;
  }, 0);

  const totalCost = totalBeforeTaxes + nonRecoverableTaxes;

  const addTax = () => {
    append({ name: "", rate: 0, recoverable: false });
  };

  const addExistingTax = (taxId: string) => {
    const tax = existingTaxesData?.data?.find((t) => t.id === taxId);
    if (tax) {
      append({
        id: tax.id,
        name: tax.name,
        rate: Number(tax.rate), // Garante número
        recoverable: tax.recoverable,
      });
    }
    setTaxSearch("");
  };

  const toggleFreight = (freightId: string) => {
    const current = selectedFreightIds || [];
    if (current.includes(freightId)) {
      setValue(
        "freightIds",
        current.filter((id: string) => id !== freightId)
      );
    } else {
      setValue("freightIds", [...current, freightId]);
    }
  };

  const handleFormSubmit = (data: CreateRawMaterialDTO) => {
    // CORREÇÃO CRÍTICA: Convertemos tudo para Number antes de enviar ao backend
    const cleanedData = {
      ...data,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || "",
      inputGroup: data.inputGroup?.trim() || "",
      paymentTerm: Number(data.paymentTerm),
      acquisitionPrice: Number(data.acquisitionPrice),
      additionalCost: Number(data.additionalCost),
      // Se for BRL, o convertido é igual ao aquisição. Se não, mantemos o que veio (ou 0 se nulo)
      priceConvertedBrl: data.currency === 'BRL' 
        ? Number(data.acquisitionPrice) 
        : Number(data.priceConvertedBrl || 0),
        
      rawMaterialTaxes: data.rawMaterialTaxes.map((tax) => ({
        ...tax,
        name: tax.name.trim(),
        rate: Number(tax.rate), // Garante que a taxa é number
      })),
    };
    onSubmit(cleanedData);
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols = { BRL: "R$", USD: "US$", EUR: "€" };
    return symbols[curr as keyof typeof symbols] || curr;
  };

  return (
    <form
      id="raw-material-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="max-h-[70vh] overflow-y-auto px-2 space-y-6"
    >
      {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="code">
              Código <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Ex: MP001"
              maxLength={30}
              {...register("code", {
                required: "Código é obrigatório",
                validate: {
                  notEmpty: (value) =>
                    validateNotEmpty(value) ||
                    "Código não pode conter apenas espaços",
                },
                minLength: {
                  value: 2,
                  message: "Código deve ter no mínimo 2 caracteres",
                },
                maxLength: {
                  value: 30,
                  message: "Código deve ter no máximo 30 caracteres",
                },
              })}
              error={errors.code?.message}
            />
          </div>

          <div>
            <Label htmlFor="name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Farinha de Trigo"
              maxLength={100}
              {...register("name", {
                required: "Nome é obrigatório",
                validate: {
                  notEmpty: (value) =>
                    validateNotEmpty(value) ||
                    "Nome não pode conter apenas espaços",
                },
                minLength: {
                  value: 3,
                  message: "Nome deve ter no mínimo 3 caracteres",
                },
                maxLength: {
                  value: 100,
                  message: "Nome deve ter no máximo 100 caracteres",
                },
              })}
              error={errors.name?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a matéria-prima..."
              rows={3}
              maxLength={500}
              className="min-h-[80px] max-h-[200px]"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Descrição deve ter no máximo 500 caracteres",
                },
              })}
            />
          </div>

          <div>
            <Label htmlFor="measurementUnit">
              Unidade de Medida <span className="text-red-500">*</span>
            </Label>
            <Select
              id="measurementUnit"
              {...register("measurementUnit", {
                required: "Unidade de medida é obrigatória",
              })}
              error={errors.measurementUnit?.message}
            >
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="inputGroup">Grupo de Insumo (Opcional)</Label>
            <Input
              id="inputGroup"
              placeholder="Ex: Farinhas, Temperos"
              maxLength={60}
              {...register("inputGroup", {
                maxLength: {
                  value: 60,
                  message: "Grupo deve ter no máximo 60 caracteres",
                },
              })}
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: VALORES */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Valores e Custos
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="acquisitionPrice">
              Preço de Aquisição <span className="text-red-500">*</span>
            </Label>
            <CurrencyInput
              id="acquisitionPrice"
              value={acquisitionPrice}
              currency={currency}
              onChange={(value) =>
                setValue("acquisitionPrice", value, { shouldValidate: true })
              }
              placeholder="0,00"
            />
            {acquisitionPrice <= 0 && (
              <Text className="text-xs text-red-600 mt-1">
                Preço deve ser maior que zero
              </Text>
            )}
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select id="currency" {...register("currency")}>
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="additionalCost">Custo Adicional (Opcional)</Label>
            <CurrencyInput
              id="additionalCost"
              value={additionalCost}
              currency={currency}
              onChange={(value) => setValue("additionalCost", value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="paymentTerm">
              Prazo de Pagamento (dias) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentTerm"
              type="number"
              min="0"
              max="365"
              {...register("paymentTerm", {
                required: "Prazo de pagamento é obrigatório",
                min: { value: 0, message: "Prazo deve ser no mínimo 0" },
                max: {
                  value: 365,
                  message: "Prazo deve ser no máximo 365 dias",
                },
                valueAsNumber: true,
              })}
              error={errors.paymentTerm?.message}
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: FRETES */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Fretes (Opcional)
        </h3>

        <div className="mb-4">
          <Autocomplete
            options={
              freightsData?.data
                ?.filter((f) => !selectedFreightIds.includes(f.id))
                .map((f) => ({
                  value: f.id,
                  label: f.name,
                  description: `${getCurrencySymbol(
                    f.currency
                  )} ${formatCurrency(Number(f.unitPrice) || 0)
                    .replace("R$", "")
                    .trim()} - ${f.originCity}/${f.originUf} → ${
                    f.destinationCity
                  }/${f.destinationUf}`,
                })) || []
            }
            value=""
            searchValue={freightSearch}
            onChange={toggleFreight}
            onSearchChange={(value) => {
              setFreightSearch(value);
              debouncedSetFreightSearch(value);
            }}
            placeholder="Buscar e adicionar frete..."
            emptyMessage="Nenhum frete encontrado"
            isLoading={isLoadingFreights}
          />
        </div>

        {selectedFreightIds.length > 0 && (
          <div className="space-y-2">
            {selectedFreightIds.map((freightId: string) => {
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
                    onClick={() => toggleFreight(freightId)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                    aria-label="Remover frete"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 4: IMPOSTOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Impostos da Matéria-Prima
          </h3>
          <SecondaryButton
            type="button"
            variant="secondary"
            leftIcon={FiPlus}
            onClick={addTax}
            className="cursor-pointer"
          >
            Novo Imposto
          </SecondaryButton>
        </div>

        <div className="mb-4">
          <Autocomplete
            options={
              existingTaxesData?.data
                ?.filter((t) => !rawMaterialTaxes.some((rt) => rt.id === t.id))
                .map((t) => ({
                  value: t.id,
                  label: t.name,
                  description: `${t.rate}% ${
                    t.recoverable ? "(Recuperável)" : "(Não Recuperável)"
                  }`,
                })) || []
            }
            value=""
            searchValue={taxSearch}
            onChange={addExistingTax}
            onSearchChange={setTaxSearch}
            placeholder="Buscar e adicionar imposto existente..."
            emptyMessage="Nenhum imposto encontrado"
          />
        </div>

        {fields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <Text className="text-gray-500 text-sm">
              Nenhum imposto adicionado. Clique em "Novo Imposto" ou busque um
              existente.
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex-1 min-w-[190px]">
                  <Input
                    placeholder="Nome do imposto (ICMS, IPI...)"
                    maxLength={40}
                    {...register(`rawMaterialTaxes.${index}.name`, {
                      required: "Nome do imposto é obrigatório",
                      validate: {
                        notEmpty: (value) =>
                          validateNotEmpty(value) ||
                          "Nome do imposto não pode conter apenas espaços",
                      },
                      maxLength: {
                        value: 40,
                        message: "Nome deve ter no máximo 40 caracteres",
                      },
                    })}
                    error={errors.rawMaterialTaxes?.[index]?.name?.message}
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="Taxa %"
                    className="w-[60px] text-center p-0"
                    {...register(`rawMaterialTaxes.${index}.rate`, {
                      required: "Taxa é obrigatória",
                      min: {
                        value: 0.01,
                        message: "Taxa deve ser maior que 0%",
                      },
                      max: {
                        value: 100,
                        message: "Taxa deve ser no máximo 100%",
                      },
                      valueAsNumber: true,
                    })}
                    error={errors.rawMaterialTaxes?.[index]?.rate?.message}
                  />
                  <p className="font-bold">%</p>
                </div>

                <div className="flex justify-center w-[140px]">
                  <label
                    htmlFor={`tax-recoverable-${index}`}
                    className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                  >
                    <Checkbox
                      id={`tax-recoverable-${index}`}
                      {...register(`rawMaterialTaxes.${index}.recoverable`)}
                    />
                    Recuperável
                  </label>
                </div>

                <SecondaryButton
                  type="button"
                  variant="ghost"
                  leftIcon={FiTrash2}
                  onClick={() => remove(index)}
                  className="cursor-pointer text-red-600 hover:bg-red-50"
                  aria-label={`Remover imposto ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <Text className="font-semibold text-blue-900">Preview de Custos</Text>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <Text className="text-gray-600">Preço Base:</Text>
            <Text className="font-semibold">
              {formatCurrency(acquisitionPrice)}
            </Text>
          </div>
          <div>
            <Text className="text-gray-600">Custo Adicional:</Text>
            <Text className="font-semibold">
              {formatCurrency(additionalCost)}
            </Text>
          </div>
          <div>
            <Text className="text-gray-600">Impostos Recuperáveis:</Text>
            <Text className="font-semibold text-green-600">
              {formatCurrency(recoverableTaxes)}
            </Text>
          </div>
          <div>
            <Text className="text-gray-600">Impostos Não Recuperáveis:</Text>
            <Text className="font-semibold text-red-600">
              {formatCurrency(nonRecoverableTaxes)}
            </Text>
          </div>
          <div className="col-span-2 pt-2 border-t border-blue-300">
            <Text className="text-gray-600">Custo Total Final:</Text>
            <Text className="font-bold text-lg text-blue-900">
              {formatCurrency(totalCost)}
            </Text>
          </div>
        </div>
      </div>

      {acquisitionPrice <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-1 px-2">
          <Text className="text-red-700 text-sm font-small">
            O preço de aquisição deve ser maior que zero para submeter o
            formulário
          </Text>
        </div>
      )}

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}