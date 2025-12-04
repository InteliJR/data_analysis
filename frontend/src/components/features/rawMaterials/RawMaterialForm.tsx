// src/components/features/rawMaterials/RawMaterialForm.tsx

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { RawMaterial } from "@/types/rawMaterial";
import type {
  CreateRawMaterialDTO,
  RawMaterialLocationDTO,
} from "@/api/rawMaterials";
import { toast } from "react-hot-toast";

import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { CurrencyInput } from "@/components/common/CurrencyInput";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Text } from "@/components/common/Text";
import { Autocomplete } from "@/components/common/Autocomplete";

import { FiPlus, FiTrash2, FiMapPin } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

import { useFreightsQuery } from "@/api/freights";
import { useRawMaterialTaxesQuery } from "@/api/taxes";
import { useLocationsQuery } from "@/api/locations";
import { useDebounce } from "@/hooks/useDebounce";
import { calculateFreightCostWithTaxes } from "@/lib/costs";

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

type TaxDraft = {
  locationIndex: number;
  name: string;
  rate: number;
  recoverable: boolean;
};

interface RawMaterialFormProps {
  rawMaterial?: RawMaterial | null;
  onSubmit: (data: CreateRawMaterialDTO) => void;
  isLoading?: boolean;
  onOpenLocationModal?: () => void;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function RawMaterialForm({
  rawMaterial,
  onSubmit,
  isLoading,
  onOpenLocationModal,
}: RawMaterialFormProps) {
  const [freightSearch, setFreightSearch] = useState("");
  const [taxSearch, setTaxSearch] = useState("");
  const [taxDraft, setTaxDraft] = useState<TaxDraft | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateRawMaterialDTO>({
    defaultValues: rawMaterial
      ? {
          code: rawMaterial.code,
          name: rawMaterial.name,
          description: rawMaterial.description || "",
          measurementUnit: rawMaterial.measurementUnit,
          inputGroup: rawMaterial.inputGroup || "",
          paymentTerm: Number(rawMaterial.paymentTerm),
          locations:
            rawMaterial.locations?.map((loc) => ({
              id: loc.id,
              locationId: loc.locationId,
              acquisitionPrice: Number(loc.acquisitionPrice || 0),
              currency: (loc.currency as any) || "BRL",
              priceConvertedBrl: Number(loc.priceConvertedBrl || 0),
              additionalCost: Number(loc.additionalCost || 0),
              freightIds: (loc.freights || []).map((f) => f.id),
              taxes: (loc.locationTaxes || []).map((t) => ({
                taxId: t.tax?.id,
                rate: Number(t.rate),
                recoverable: !!t.recoverable,
                name: t.tax?.name,
              })),
            })) || [],
        }
      : {
          code: "",
          name: "",
          description: "",
          measurementUnit: "KG",
          inputGroup: "",
          paymentTerm: 30,
          locations: [],
        },
  });

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({ control, name: "locations" });

  const { data: locationsResponse, isLoading: isLoadingLocations } =
    useLocationsQuery({
      page: 1,
      limit: 200,
    });

  const availableLocations = useMemo(() => {
    const fetched = locationsResponse?.data ?? [];
    const fromRawMaterial =
      rawMaterial?.locations
        ?.map((loc) => loc.location)
        .filter((loc): loc is NonNullable<typeof loc> => Boolean(loc)) ?? [];

    const map = new Map<string, (typeof fetched)[number]>();
    fetched.forEach((location) => {
      map.set(location.id, location);
    });
    fromRawMaterial.forEach((location) => {
      if (!map.has(location.id)) {
        map.set(location.id, location);
      }
    });

    return Array.from(map.values());
  }, [locationsResponse?.data, rawMaterial?.locations]);

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

  const locations = (watch("locations") || []) as RawMaterialLocationDTO[];

  const firstLoc = (locations[0] || {}) as RawMaterialLocationDTO;
  const acquisitionPrice = Number(firstLoc?.acquisitionPrice || 0);
  const additionalCost = Number(firstLoc?.additionalCost || 0);
  const selectedFreightIds = (firstLoc?.freightIds || []) as string[];
  const rawMaterialTaxes = (firstLoc?.taxes || []) as any[];

  const totalBeforeTaxes = acquisitionPrice + additionalCost;

  const totalFreightCost = (selectedFreightIds || []).reduce(
    (sum, freightId) => {
      const freight = freightsData?.data?.find((f) => f.id === freightId);
      return sum + calculateFreightCostWithTaxes(freight);
    },
    0
  );

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

  // Final cost must include non-recoverable taxes and freights.
  // Recoverable taxes do not increase the company's cost (they are recoverable),
  // so they must NOT be subtracted from the cost. Instead, only non-recoverable
  // taxes are added to the base cost.
  const totalCost = totalBeforeTaxes + totalFreightCost + nonRecoverableTaxes;

  const openTaxDraft = (locIndex: number) => {
    setTaxDraft({
      locationIndex: locIndex,
      name: "",
      rate: 0,
      recoverable: false,
    });
  };

  const cancelTaxDraft = () => setTaxDraft(null);

  const handleSaveTaxDraft = () => {
    if (!taxDraft) return;
    const name = taxDraft.name.trim();
    if (!name) {
      toast.error("Informe o nome do imposto");
      return;
    }
    if (
      Number.isNaN(taxDraft.rate) ||
      taxDraft.rate < 0 ||
      taxDraft.rate > 100
    ) {
      toast.error("Informe uma taxa entre 0% e 100%");
      return;
    }

    const current = (locations[taxDraft.locationIndex]?.taxes ||
      []) as RawMaterialLocationDTO["taxes"];
    const next = [
      ...(current ?? []),
      {
        name,
        rate: Number(taxDraft.rate),
        recoverable: taxDraft.recoverable,
      },
    ];

    setValue(`locations.${taxDraft.locationIndex}.taxes` as any, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTaxDraft(null);
    toast.success(`Imposto "${name}" adicionado`);
  };

  const addExistingTax = (taxId: string, locIndex: number) => {
    const tax = existingTaxesData?.data?.find((t) => t.id === taxId);
    if (tax) {
      const current = (locations[locIndex]?.taxes || []) as any[];
      const already = current.some((t) => t.taxId === tax.id);
      if (already) {
        toast.error(`O imposto "${tax.name}" já foi adicionado`);
        return;
      }
      const next = [
        ...current,
        {
          taxId: tax.id,
          name: tax.name,
          rate: Number(tax.rate),
          recoverable: tax.recoverable,
        },
      ];
      setValue(`locations.${locIndex}.taxes` as any, next, {
        shouldDirty: true,
      });
      toast.success(`Imposto "${tax.name}" adicionado`);
    }
    setTaxSearch("");
    if (taxDraft?.locationIndex === locIndex) {
      setTaxDraft(null);
    }
  };

  const removeTaxFromLocation = (locIndex: number, taxIndex: number) => {
    const current = (locations[locIndex]?.taxes ||
      []) as RawMaterialLocationDTO["taxes"];
    const next = (current ?? []).filter((_, index) => index !== taxIndex);
    setValue(`locations.${locIndex}.taxes` as any, next, { shouldDirty: true });
  };

  const handleRemoveLocation = (index: number) => {
    removeLocation(index);
    setTaxDraft((prev) => {
      if (!prev) return prev;
      if (prev.locationIndex === index) return null;
      if (prev.locationIndex > index) {
        return { ...prev, locationIndex: prev.locationIndex - 1 };
      }
      return prev;
    });
  };

  const toggleFreight = (freightId: string, locIndex: number) => {
    const current = (locations[locIndex]?.freightIds || []) as string[];
    const next = current.includes(freightId)
      ? current.filter((id) => id !== freightId)
      : [...current, freightId];
    setValue(`locations.${locIndex}.freightIds` as any, next, {
      shouldDirty: true,
    });
  };

  const handleFormSubmit = (data: CreateRawMaterialDTO) => {
    const cleanedLocations = (data.locations || [])
      .filter((loc) => !!loc.locationId)
      .map((loc) => ({
        id: loc.id,
        locationId: loc.locationId,
        acquisitionPrice: Number(loc.acquisitionPrice || 0),
        currency: loc.currency,
        priceConvertedBrl:
          loc.currency === "BRL"
            ? Number(loc.acquisitionPrice || 0)
            : Number(loc.priceConvertedBrl || 0),
        additionalCost: Number(loc.additionalCost || 0),
        freightIds: (loc.freightIds || []).slice(),
        taxes: (loc.taxes || []).map((t) => ({
          taxId: t.taxId,
          name: t.name?.trim(),
          rate: Number(t.rate || 0),
          recoverable: !!t.recoverable,
        })),
      }));

    if (cleanedLocations.length === 0) {
      toast.error("Adicione pelo menos uma localização");
      return;
    }

    const cleanedData: CreateRawMaterialDTO = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || "",
      measurementUnit: data.measurementUnit,
      inputGroup: data.inputGroup?.trim() || "",
      paymentTerm: Number(data.paymentTerm),
      locations: cleanedLocations,
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
      className="max-h-[68vh] overflow-y-auto px-2 space-y-6"
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
              placeholder="Detalhes sobre a produto..."
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

      {/* Campo: Prazo de Pagamento */}
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
            max: { value: 365, message: "Prazo deve ser no máximo 365 dias" },
            valueAsNumber: true,
          })}
          error={errors.paymentTerm?.message}
        />
      </div>

      {/* SEÇÃO 2: LOCALIZAÇÕES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Localizações</h3>
          <div className="flex gap-2">
            {onOpenLocationModal && (
              <SecondaryButton
                type="button"
                variant="ghost"
                leftIcon={FiMapPin}
                onClick={onOpenLocationModal}
                className="cursor-pointer"
              >
                Nova Localização
              </SecondaryButton>
            )}
            <SecondaryButton
              type="button"
              variant="secondary"
              leftIcon={FiPlus}
              onClick={() =>
                appendLocation({
                  locationId: "",
                  acquisitionPrice: 0,
                  currency: "BRL",
                  priceConvertedBrl: 0,
                  additionalCost: 0,
                  freightIds: [],
                  taxes: [],
                })
              }
              className="cursor-pointer"
            >
              Adicionar Localização
            </SecondaryButton>
          </div>
        </div>

        {locationFields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <Text className="text-gray-500 text-sm">
              Nenhuma localização adicionada.
            </Text>
            <Text className="text-xs text-gray-400">
              Clique em "Adicionar Localização" para definir preços por unidade.
            </Text>
          </div>
        ) : (
          <div className="space-y-6">
            {locationFields.map((field, idx) => {
              const locPrefix = `locations.${idx}` as const;
              const locValue = (locations[idx] || {}) as RawMaterialLocationDTO;
              const locCurrency = (locValue?.currency as any) || "BRL";
              const locAcq = Number(locValue?.acquisitionPrice || 0);
              const locAdd = Number(locValue?.additionalCost || 0);
              const locFreightIds = (locValue?.freightIds || []) as string[];
              const locTaxes = (locValue?.taxes || []) as any[];
              const selectedLocation = availableLocations.find(
                (location) => location.id === locValue.locationId
              );
              const hasDraftHere = taxDraft?.locationIndex === idx;
              const locTotalBeforeTaxes = locAcq + locAdd;
              const locRecoverableTaxes = locTaxes
                .filter((t) => t.recoverable)
                .reduce(
                  (s, t) => s + locTotalBeforeTaxes * (Number(t.rate) / 100),
                  0
                );
              const locNonRecoverableTaxes = locTaxes
                .filter((t) => !t.recoverable)
                .reduce(
                  (s, t) => s + locTotalBeforeTaxes * (Number(t.rate) / 100),
                  0
                );
              const locFreightTotal = locFreightIds.reduce((s, id) => {
                const f = freightsData?.data?.find((fr) => fr.id === id);
                return s + calculateFreightCostWithTaxes(f);
              }, 0);
              const locFinal =
                locTotalBeforeTaxes + locFreightTotal + locNonRecoverableTaxes;

              return (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Text className="font-semibold text-gray-800">
                      Localização #{idx + 1}
                    </Text>
                    <SecondaryButton
                      type="button"
                      variant="ghost"
                      leftIcon={FiTrash2}
                      onClick={() => handleRemoveLocation(idx)}
                      className="cursor-pointer text-red-600 hover:bg-red-50"
                    >
                      Remover
                    </SecondaryButton>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <Label>
                        Localização <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        {...register(`${locPrefix}.locationId` as any, {
                          validate: (value) => {
                            if (!value) {
                              return "Selecione uma localização";
                            }
                            const duplicated = locations.some(
                              (loc, locIndex) =>
                                locIndex !== idx && loc.locationId === value
                            );
                            return duplicated
                              ? "Esta localização já foi adicionada"
                              : true;
                          },
                        })}
                        value={locValue.locationId || ""}
                        onChange={(event) =>
                          setValue(
                            `${locPrefix}.locationId` as any,
                            event.target.value,
                            { shouldValidate: true }
                          )
                        }
                        disabled={
                          isLoadingLocations || availableLocations.length === 0
                        }
                        error={
                          (errors as any)?.locations?.[idx]?.locationId?.message
                        }
                      >
                        <option value="">
                          {isLoadingLocations
                            ? "Carregando localizações..."
                            : "Selecione uma localização"}
                        </option>
                        {availableLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} • {location.city}/{location.stateUf}
                          </option>
                        ))}
                      </Select>
                      {selectedLocation ? (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedLocation.name} • {selectedLocation.city}/
                          {selectedLocation.stateUf}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Selecione uma localização existente ou crie uma nova.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Moeda</Label>
                      <Select {...register(`${locPrefix}.currency` as any)}>
                        <option value="BRL">Real (R$)</option>
                        <option value="USD">Dólar (US$)</option>
                        <option value="EUR">Euro (€)</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Preço de Aquisição</Label>
                      <CurrencyInput
                        value={locAcq}
                        currency={locCurrency}
                        onChange={(v) =>
                          setValue(`${locPrefix}.acquisitionPrice` as any, v, {
                            shouldValidate: true,
                          })
                        }
                        placeholder="0,00"
                      />
                    </div>
                    {/* Preço em BRL removido para simplificar: usamos o de aquisição.
                        Se a moeda for BRL, setamos automaticamente no submit. */}
                    <div>
                      <Label>Custo Adicional</Label>
                      <CurrencyInput
                        value={locAdd}
                        currency={locCurrency}
                        onChange={(v) =>
                          setValue(`${locPrefix}.additionalCost` as any, v)
                        }
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  {/* Fretes da Localização */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Fretes
                    </h4>
                    <Autocomplete
                      options={
                        freightsData?.data
                          ?.filter((f) => !locFreightIds.includes(f.id))
                          .map((f) => {
                            const cost = calculateFreightCostWithTaxes(f);
                            return {
                              value: f.id,
                              label: f.name,
                              description: `${getCurrencySymbol(
                                f.currency
                              )} ${formatCurrency(cost)
                                .replace("R$", "")
                                .trim()} - ${f.originCity}/${f.originUf} → ${
                                f.destinationCity
                              }/${f.destinationUf}`,
                            };
                          }) || []
                      }
                      value=""
                      searchValue={freightSearch}
                      onChange={(v) => toggleFreight(v, idx)}
                      onSearchChange={(value) => {
                        setFreightSearch(value);
                        debouncedSetFreightSearch(value);
                      }}
                      placeholder="Buscar e adicionar frete..."
                      isLoading={isLoadingFreights}
                    />

                    {locFreightIds.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {locFreightIds.map((freightId: string) => {
                          const freight = freightsData?.data?.find(
                            (f) => f.id === freightId
                          );
                          if (!freight) return null;
                          const freightCost =
                            calculateFreightCostWithTaxes(freight);
                          return (
                            <div
                              key={freightId}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex-1">
                                <Text
                                  variant="caption"
                                  className="font-semibold"
                                >
                                  {freight.name}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {freight.originCity}/{freight.originUf} →{" "}
                                  {freight.destinationCity}/
                                  {freight.destinationUf} •{" "}
                                  {getCurrencySymbol(freight.currency)}{" "}
                                  {formatCurrency(freightCost)
                                    .replace("R$", "")
                                    .trim()}
                                </Text>
                              </div>
                              <SecondaryButton
                                type="button"
                                variant="ghost"
                                leftIcon={FiTrash2}
                                onClick={() => toggleFreight(freightId, idx)}
                                className="cursor-pointer text-red-600 hover:bg-red-50"
                                aria-label="Remover frete"
                              >
                                Remover
                              </SecondaryButton>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Impostos da Localização */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Impostos
                      </h4>
                      <SecondaryButton
                        type="button"
                        variant="secondary"
                        leftIcon={FiPlus}
                        onClick={() => openTaxDraft(idx)}
                        className="cursor-pointer"
                      >
                        Novo Imposto
                      </SecondaryButton>
                    </div>
                    <Autocomplete
                      options={
                        existingTaxesData?.data?.map((t) => ({
                          value: t.id,
                          label: t.name,
                          description: `${t.rate}% ${
                            t.recoverable
                              ? "(Recuperável)"
                              : "(Não Recuperável)"
                          }`,
                        })) || []
                      }
                      value=""
                      searchValue={taxSearch}
                      onChange={(v) => addExistingTax(v, idx)}
                      onSearchChange={setTaxSearch}
                      placeholder="Buscar e adicionar imposto existente..."
                    />

                    {(locTaxes || []).length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center mt-2">
                        <Text className="text-gray-500 text-sm">
                          Nenhum imposto adicionado.
                        </Text>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {locTaxes.map((tax, tIdx) => (
                          <div
                            key={`${tax.taxId || tax.name || tIdx}`}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <Text className="font-semibold">
                                {tax.name || "Imposto sem nome"}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {Number(tax.rate || 0).toFixed(2)}% •{" "}
                                {tax.recoverable
                                  ? "Recuperável"
                                  : "Não Recuperável"}
                              </Text>
                            </div>
                            <SecondaryButton
                              type="button"
                              variant="ghost"
                              leftIcon={FiTrash2}
                              onClick={() => removeTaxFromLocation(idx, tIdx)}
                              className="cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              Remover
                            </SecondaryButton>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasDraftHere && taxDraft && (
                      <div className="mt-3 border border-dashed border-blue-300 rounded-lg p-3 space-y-3 bg-white">
                        <Text className="text-sm font-semibold text-blue-900">
                          Novo imposto
                        </Text>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <Label>Nome</Label>
                            <Input
                              value={taxDraft.name}
                              onChange={(event) =>
                                setTaxDraft((prev) =>
                                  prev
                                    ? { ...prev, name: event.target.value }
                                    : prev
                                )
                              }
                              placeholder="Ex: ICMS"
                            />
                          </div>
                          <div>
                            <Label>Taxa (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={taxDraft.rate}
                              onChange={(event) =>
                                setTaxDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rate: Number(event.target.value || 0),
                                      }
                                    : prev
                                )
                              }
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={taxDraft.recoverable}
                            onChange={(event) =>
                              setTaxDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      recoverable: event.target.checked,
                                    }
                                  : prev
                              )
                            }
                          />
                          Recuperável
                        </label>
                        <div className="flex justify-end gap-2">
                          <SecondaryButton
                            type="button"
                            variant="ghost"
                            onClick={cancelTaxDraft}
                          >
                            Cancelar
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            variant="secondary"
                            onClick={handleSaveTaxDraft}
                          >
                            Adicionar imposto
                          </SecondaryButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview simples da localização */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <Text className="font-semibold text-blue-900">
                      Resumo Localização #{idx + 1}
                    </Text>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <Text className="text-gray-600">Preço Base:</Text>
                        <Text className="font-semibold">
                          {formatCurrency(locAcq)}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-gray-600">Custo Adicional:</Text>
                        <Text className="font-semibold">
                          {formatCurrency(locAdd)}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-gray-600">Total Fretes:</Text>
                        <Text className="font-semibold text-purple-600">
                          {formatCurrency(locFreightTotal)}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-gray-600">
                          Créditos Recuperáveis:
                        </Text>
                        <Text className="font-semibold text-green-700">
                          {formatCurrency(locRecoverableTaxes)}
                        </Text>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-blue-300">
                        <Text className="text-gray-600">
                          Custo Final (resumo):
                        </Text>
                        <Text className="font-bold text-lg text-blue-900">
                          {formatCurrency(locFinal)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seções antigas de Fretes e Impostos substituídas por controles por localização */}

      {/* PREVIEW (usa primeira localização como referência rápida) */}
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
            <Text className="text-gray-600">Total de Fretes:</Text>
            <Text className="font-semibold text-purple-600">
              {formatCurrency(totalFreightCost)}
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
