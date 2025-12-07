// src/components/features/products/ProductForm.tsx

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Product } from "@/types/products";

import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Textarea } from "@/components/common/Textarea";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Text } from "@/components/common/Text";
import { Select } from "@/components/common/Select";
import { Autocomplete } from "@/components/common/Autocomplete";

import { FiTrash2, FiUser, FiCalendar, FiClock } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";
import { calculateFreightCostWithTaxes } from "@/lib/costs";

import { useRawMaterialsQuery } from "@/api/rawMaterials";
import { useFixedCostsQuery, useFixedCostByIdQuery } from "@/api/fixedCosts";
import { useProductGroupsQuery } from "@/api/productgroups";
import { useFreightsQuery } from "@/api/freights";
import { toast } from "react-hot-toast";

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const validateNotEmpty = (value: string | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

export function ProductForm({
  product,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  // Converte strings como "1.234,56" para número 1234.56
  const toNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isFinite(val) ? val : 0;
    if (typeof val === "string") {
      const s = val.trim();
      if (s === "") return 0;
      // Heurística: se tiver ambos "." e "," => "." milhares, "," decimal
      if (s.includes(".") && s.includes(",")) {
        const cleaned = s.replace(/\./g, "").replace(/,/g, ".");
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
      }
      // Se tem apenas "," -> vírgula como decimal
      if (s.includes(",")) {
        const cleaned = s.replace(/,/g, ".");
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
      }
      // Caso contrário, tenta direto ("." como decimal ou inteiro simples)
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    }
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const [rawMaterialSearch, setRawMaterialSearch] = useState("");
  const [freightSearch, setFreightSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<any>({
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description || "",
          fixedCostId: product.fixedCostId || "",
          productGroupId: product.productGroupId || "",
          freightIds: product.freights?.map((f) => f.id) || [],
          rawMaterials: product.productRawMaterials.map((rm) => ({
            rawMaterialId: rm.rawMaterialId,
            rawMaterialLocationPivotId: rm.rawMaterialLocationPivotId,
            quantity: rm.quantity,
          })),
        }
      : {
          code: "",
          name: "",
          description: "",
          fixedCostId: "",
          productGroupId: "",
          freightIds: [],
          rawMaterials: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rawMaterials",
  });

  // --- QUERIES ---
  const { data: rawMaterialsData, isLoading: isLoadingRM } =
    useRawMaterialsQuery({
      page: 1,
      limit: 50,
      search: rawMaterialSearch,
    });

  // Lista para o Select (Paginada)
  const { data: fixedCostsList } = useFixedCostsQuery({
    page: 1,
    limit: 50,
    search: "",
  });

  const { data: productGroupsData } = useProductGroupsQuery({
    page: 1,
    limit: 50,
    search: "",
  });

  const { data: freightsData } = useFreightsQuery({
    page: 1,
    limit: 50,
    search: freightSearch,
  });

  // --- WATCHERS ---
  const rawMaterials = watch("rawMaterials") || [];
  const selectedFixedCostId = watch("fixedCostId");
  const selectedProductGroupId = watch("productGroupId");
  const selectedFreightIds = watch("freightIds") || [];

  const usedPivotIds = useMemo(() => {
    return new Set(
      (rawMaterials || [])
        .map((rm: any) => rm.rawMaterialLocationPivotId)
        .filter(Boolean)
    );
  }, [rawMaterials]);

  const getFreightCostBreakdown = (freight: any) => {
    const baseCost = toNumber(freight?.unitPrice);
    const totalCost = calculateFreightCostWithTaxes(freight);
    const taxesCost = Math.max(totalCost - baseCost, 0);
    return { baseCost, taxesCost, totalCost };
  };

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // Buscamos o custo fixo específico selecionado para garantir o cálculo correto
  // mesmo que ele não esteja na primeira página da lista do Select.
  const { data: selectedFixedCostData } = useFixedCostByIdQuery(
    selectedFixedCostId || null
  );

  const getRawMaterialRecord = (rawMaterialId: string) => {
    const fromApi = rawMaterialsData?.data?.find((r) => r.id === rawMaterialId);
    if (fromApi) return fromApi;

    return product?.productRawMaterials?.find(
      (rm) => rm.rawMaterialId === rawMaterialId
    )?.rawMaterial;
  };

  const getPivotOptions = (rawMaterialId: string) => {
    const fromApi = rawMaterialsData?.data?.find((r) => r.id === rawMaterialId);
    if (fromApi?.locations?.length) {
      return fromApi.locations;
    }

    const fallbackOptions = product?.productRawMaterials
      ?.filter((rm) => rm.rawMaterialId === rawMaterialId)
      ?.map((rm) => rm.locationPivot)
      .filter(Boolean) as any[] | undefined;

    return fallbackOptions && fallbackOptions.length > 0
      ? (fallbackOptions as any[])
      : undefined;
  };

  const resolvePivot = (rawMaterialId: string, pivotId?: string) => {
    const options = getPivotOptions(rawMaterialId) || [];
    if (pivotId) {
      const match = options.find((loc: any) => loc.id === pivotId);
      if (match) return match;
    }

    if (pivotId) {
      const fallback = product?.productRawMaterials?.find(
        (rm) =>
          rm.rawMaterialId === rawMaterialId &&
          rm.rawMaterialLocationPivotId === pivotId
      );
      if (fallback?.locationPivot) {
        return fallback.locationPivot as any;
      }
    }

    return options[0];
  };

  // --- CÁLCULO CONSOLIDADO ---
  const calculatePrices = () => {
    let baseSubtotal = 0;
    let nonRecoverableMpTaxes = 0;
    let recoverableCreditsTotal = 0;
    let mpFreightServiceTotal = 0;
    let mpFreightTaxesTotal = 0;

    rawMaterials.forEach((rm: any) => {
      const pivot = resolvePivot(
        rm.rawMaterialId,
        rm.rawMaterialLocationPivotId
      );
      if (!pivot) return;

      const quantity = toNumber(rm.quantity);
      const brl = toNumber(pivot.priceConvertedBrl);
      const acquisition = toNumber(pivot.acquisitionPrice);
      const baseUnit = brl > 0 ? brl : acquisition;
      const additionalUnit = toNumber(pivot.additionalCost ?? 0);
      const subtotal = (baseUnit + additionalUnit) * quantity;
      baseSubtotal += subtotal;

      (pivot.locationTaxes || []).forEach((tax: any) => {
        const rate = toNumber(tax.rate ?? tax.tax?.defaultRate ?? 0);
        const taxValue = (subtotal * rate) / 100;
        if (tax.recoverable) {
          recoverableCreditsTotal += taxValue;
        } else {
          nonRecoverableMpTaxes += taxValue;
        }
      });

      (pivot.freights || []).forEach((freight: any) => {
        const serviceCost = toNumber(freight.unitPrice) * quantity;
        mpFreightServiceTotal += serviceCost;
        (freight.freightTaxes || []).forEach((fTax: any) => {
          const taxValue = (serviceCost * toNumber(fTax.rate)) / 100;
          mpFreightTaxesTotal += taxValue;
        });
      });
    });

    let productFreightServiceCost = 0;
    let productFreightTaxes = 0;

    selectedFreightIds.forEach((freightId: string) => {
      const freight =
        freightsData?.data?.find((f) => f.id === freightId) ||
        product?.freights?.find((f) => f.id === freightId);

      if (!freight) return;

      const serviceCost = toNumber(freight.unitPrice);
      productFreightServiceCost += serviceCost;
      (freight.freightTaxes || []).forEach((fTax: any) => {
        const taxValue = (serviceCost * toNumber(fTax.rate)) / 100;
        productFreightTaxes += taxValue;
      });
    });

    const productsFinalCost =
      baseSubtotal +
      nonRecoverableMpTaxes +
      mpFreightServiceTotal +
      mpFreightTaxesTotal;

    const structureFreightTotal =
      productFreightServiceCost + productFreightTaxes;

    const fixedCostTotal = toNumber(selectedFixedCostData?.totalCost ?? 0);

    const priceWithTaxesAndFreight =
      productsFinalCost + structureFreightTotal + fixedCostTotal;

    let groupOverhead = 0;
    if (selectedProductGroupId) {
      const pg = productGroupsData?.data?.find(
        (p: any) => p.id === selectedProductGroupId
      );
      if (pg?.overheadPerUnit) {
        groupOverhead = Number(pg.overheadPerUnit) || 0;
      }
    } else if (product?.productGroup?.overheadPerUnit) {
      groupOverhead = Number(product.productGroup.overheadPerUnit) || 0;
    }

    const finalPrice = priceWithTaxesAndFreight + groupOverhead;

    return {
      baseSubtotal,
      nonRecoverableMpTaxes,
      recoverableCreditsTotal,
      mpFreightServiceTotal,
      mpFreightTaxesTotal,
      productsFinalCost,
      structureFreightTotal,
      fixedCostTotal,
      priceWithTaxesAndFreight,
      groupOverhead,
      finalPrice,
    };
  };

  const prices = calculatePrices();

  const addRawMaterial = (rawMaterialId: string) => {
    const options = getPivotOptions(rawMaterialId) || [];
    if (!options.length) {
      toast.error("Esta matéria-prima não possui localizações cadastradas.");
      return;
    }

    const availableLocation = options.find(
      (loc: any) => !usedPivotIds.has(loc.id)
    );

    if (!availableLocation) {
      toast.error(
        "Todas as localizações desta matéria-prima já foram utilizadas na estrutura."
      );
      return;
    }

    append({
      rawMaterialId,
      rawMaterialLocationPivotId: availableLocation.id,
      quantity: 1,
    });
    setRawMaterialSearch("");
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
    setFreightSearch("");
  };

  const truncate = (str: string, max = 25) => {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "..." : str;
  };

  const handleFormSubmit = (data: any) => {
    if (data.rawMaterials.length === 0) {
      return;
    }

    const cleanedData = {
      ...data,
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || "",
      fixedCostId: data.fixedCostId || undefined,
      productGroupId: data.productGroupId || undefined,
      freightIds: data.freightIds || [],
    };

    const pivotSet = new Set<string>();
    for (const item of cleanedData.rawMaterials) {
      if (!item.rawMaterialLocationPivotId) {
        toast.error("Selecione a localização de cada matéria-prima.");
        return;
      }
      if (pivotSet.has(item.rawMaterialLocationPivotId)) {
        toast.error(
          "A mesma combinação de produto e localização foi informada mais de uma vez."
        );
        return;
      }
      pivotSet.add(item.rawMaterialLocationPivotId);
    }
    onSubmit(cleanedData);
  };

  return (
    <form
      id="product-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className="max-h-[70vh] overflow-y-auto px-2 space-y-6"
    >
      {/* DADOS DE AUDITORIA */}
      {product && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <FiUser className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <Text className="text-xs text-gray-500">Autor</Text>
                <Text className="font-medium text-gray-900">
                  {truncate(product.creator?.name, 20) || "N/A"}
                </Text>
                <Text className="text-xs text-gray-500">
                  {truncate(product.creator?.email, 25)}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500 shrink-0" />
              <div>
                <Text className="text-xs text-gray-500">Criado em</Text>
                <Text className="font-medium text-gray-900">
                  {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-gray-500 shrink-0" />
              <div>
                <Text className="text-xs text-gray-500">
                  Última modificação em
                </Text>
                <Text className="font-medium text-gray-900">
                  {new Date(product.updatedAt).toLocaleDateString("pt-BR")}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}

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
              type="text"
              placeholder="Ex: 001, 002..."
              maxLength={20}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(
                  /\D/g,
                  ""
                );
              }}
              {...register("code", {
                required: "Código é obrigatório",
                validate: {
                  numeric: (value) =>
                    /^\d+$/.test(value) || "Apenas números são permitidos",
                },
              })}
              error={errors.code?.message}
            />
          </div>

          <div>
            <Label htmlFor="name">
              Nome da Estrutura <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Estrutura A"
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
              placeholder="Detalhes sobre a Estrutura..."
              rows={4}
              maxLength={500}
              className="min-h-[100px] max-h-[240px]"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Descrição deve ter no máximo 500 caracteres",
                },
              })}
            />
            <Text className="text-xs text-gray-400 mt-1">
              Máximo de 500 caracteres
            </Text>
          </div>

          {/* CORREÇÃO: Usar Select em vez de Autocomplete */}
          <div className="sm:col-span-2">
            <Select
              id="productGroupId"
              label="Grupo de Estruturas (Opcional)"
              value={selectedProductGroupId}
              onChange={(e) => setValue("productGroupId", e.target.value)}
            >
              <option value="">Selecione um grupo</option>
              {productGroupsData?.data?.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Custo Fixo com tratamento para item selecionado fora da lista */}
          <div className="sm:col-span-2">
            <Select
              id="fixedCostId"
              label="Custo Fixo (Opcional)"
              value={selectedFixedCostId}
              onChange={(e) => setValue("fixedCostId", e.target.value)}
            >
              <option value="">Selecione um custo fixo</option>

              {/* Renderiza a lista padrão */}
              {fixedCostsList?.data?.map((fc) => (
                <option key={fc.id} value={fc.id}>
                  {fc.description} - {fc.code || "S/C"}
                </option>
              ))}

              {/* Renderiza o item selecionado SE ele não estiver na lista acima (para evitar duplicata visual ou campo vazio) */}
              {selectedFixedCostData &&
                !fixedCostsList?.data?.find(
                  (f) => f.id === selectedFixedCostData.id
                ) && (
                  <option
                    key={selectedFixedCostData.id}
                    value={selectedFixedCostData.id}
                  >
                    {selectedFixedCostData.description} -{" "}
                    {selectedFixedCostData.code || "S/C"}
                  </option>
                )}
            </Select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PRODUTOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Produtos <span className="text-red-500">*</span>
          </h3>
          <Text className="text-xs text-gray-500">Mínimo: 1 item</Text>
        </div>

        <div className="mb-4">
          <Autocomplete
            options={
              rawMaterialsData?.data
                ?.filter((rm) =>
                  (rm.locations || []).some(
                    (loc: any) => !usedPivotIds.has(loc.id)
                  )
                )
                .map((rm) => ({
                  value: rm.id,
                  label: `${rm.code} - ${rm.name}`,
                  description: `${formatCurrency(
                    toNumber(
                      rm.locations?.[0]?.priceConvertedBrl ??
                        rm.locations?.[0]?.acquisitionPrice ??
                        0
                    ) + toNumber(rm.locations?.[0]?.additionalCost ?? 0)
                  )} - ${rm.measurementUnit} • ${
                    rm.locations?.[0]?.city || "-"
                  } / ${rm.locations?.[0]?.stateUf || "-"}`,
                })) || []
            }
            value=""
            searchValue={rawMaterialSearch}
            onChange={addRawMaterial}
            onSearchChange={setRawMaterialSearch}
            placeholder="Buscar e adicionar produtos..."
            emptyMessage="Nenhum produto encontrado"
            isLoading={isLoadingRM}
          />
        </div>

        {fields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <Text className="text-gray-500 text-sm">
              Nenhum produto adicionado. Busque e adicione pelo menos um.
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const rawMaterialId = rawMaterials[index]?.rawMaterialId;
              const rawMat = rawMaterialId
                ? getRawMaterialRecord(rawMaterialId)
                : undefined;
              const selectedPivotId =
                rawMaterials[index]?.rawMaterialLocationPivotId;
              const matchedPivot = rawMaterialId
                ? resolvePivot(rawMaterialId, selectedPivotId)
                : undefined;
              const pivotOptions = rawMaterialId
                ? getPivotOptions(rawMaterialId) || []
                : [];
              const pivotFreightTotals = (matchedPivot?.freights || []).reduce(
                (
                  acc: { base: number; taxes: number; total: number },
                  freight: any
                ) => {
                  const breakdown = getFreightCostBreakdown(freight);
                  return {
                    base: acc.base + breakdown.baseCost,
                    taxes: acc.taxes + breakdown.taxesCost,
                    total: acc.total + breakdown.totalCost,
                  };
                },
                { base: 0, taxes: 0, total: 0 }
              );

              return (
                <div
                  key={field.id}
                  className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {rawMat
                          ? `${rawMat.code} - ${rawMat.name}`
                          : "Carregando..."}
                      </Text>
                    </div>

                    {/* Localidade por produto */}
                    {pivotOptions.length > 0 ? (
                      <div className="mb-2">
                        <Label>Localização</Label>
                        <Select
                          value={selectedPivotId || matchedPivot?.id || ""}
                          onChange={(e) =>
                            setValue(
                              `rawMaterials.${index}.rawMaterialLocationPivotId`,
                              e.target.value
                            )
                          }
                        >
                          {pivotOptions.map((loc: any) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.location?.city || "-"}/
                              {loc.location?.stateUf || "-"} •{" "}
                              {formatCurrency(
                                (toNumber(loc.priceConvertedBrl) > 0
                                  ? toNumber(loc.priceConvertedBrl)
                                  : toNumber(loc.acquisitionPrice)) +
                                  toNumber(loc.additionalCost ?? 0)
                              )}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 mb-2">
                        Nenhuma localização disponível para esta matéria-prima.
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      {matchedPivot?.location && (
                        <div>
                          Local:{" "}
                          <span className="font-medium">
                            {matchedPivot.location.name || ""} •{" "}
                            {matchedPivot.location.city}/
                            {matchedPivot.location.stateUf}
                          </span>
                        </div>
                      )}
                      <div>
                        Preço unitário:{" "}
                        <span className="font-medium">
                          {formatCurrency(
                            (toNumber(matchedPivot?.priceConvertedBrl) > 0
                              ? toNumber(matchedPivot?.priceConvertedBrl)
                              : toNumber(matchedPivot?.acquisitionPrice)) +
                              toNumber(matchedPivot?.additionalCost ?? 0)
                          )}
                        </span>
                      </div>
                      <div>
                        Unidade:{" "}
                        <span className="font-medium">
                          {rawMat?.measurementUnit || "-"}
                        </span>
                      </div>
                      {Array.isArray(matchedPivot?.locationTaxes) &&
                        matchedPivot.locationTaxes.length > 0 && (
                          <div>
                            Impostos (Localidade):{" "}
                            <span className="font-medium">
                              {matchedPivot.locationTaxes
                                .map((t: any) => {
                                  const nm = t?.tax?.name || "Imposto";
                                  const rate = toNumber(t?.rate);
                                  const rec = t?.recoverable
                                    ? "recuperável"
                                    : "não recuperável";
                                  return `${nm} ${rate}% (${rec})`;
                                })
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      {pivotFreightTotals.total > 0 && (
                        <div>
                          Frete (Total):{" "}
                          <span className="font-medium">
                            {formatCurrency(pivotFreightTotals.total)}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            Serviço {formatCurrency(pivotFreightTotals.base)} +
                            Impostos {formatCurrency(pivotFreightTotals.taxes)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qtd."
                      {...register(`rawMaterials.${index}.quantity`, {
                        required: "Quantidade é obrigatória",
                        min: {
                          value: 0.01,
                          message: "Mínimo: 0.01",
                        },
                        valueAsNumber: true,
                      })}
                      error={errors.rawMaterials?.[index]?.quantity?.message}
                    />
                  </div>

                  <div className="w-32 flex flex-col justify-center">
                    <Text className="text-xs text-gray-600 mb-1">
                      Subtotal:
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(
                        ((toNumber(matchedPivot?.priceConvertedBrl) > 0
                          ? toNumber(matchedPivot?.priceConvertedBrl)
                          : toNumber(matchedPivot?.acquisitionPrice)) +
                          toNumber(matchedPivot?.additionalCost ?? 0)) *
                          toNumber(rawMaterials[index]?.quantity)
                      )}
                    </Text>
                  </div>

                  <SecondaryButton
                    type="button"
                    variant="ghost"
                    leftIcon={FiTrash2}
                    onClick={() => remove(index)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                    aria-label={`Remover Produto ${index + 1}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {fields.length === 0 && (
          <Text className="text-xs text-red-600 mt-2">
            Adicione pelo menos um produto para criar a estrutura.
          </Text>
        )}
      </div>

      {/* SEÇÃO 3: FRETES DO PRODUTO */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Fretes do Estrutura (Opcional)
        </h3>

        <div className="mb-4">
          <Autocomplete
            options={
              freightsData?.data
                ?.filter((f) => !selectedFreightIds.includes(f.id))
                .map((f) => {
                  const breakdown = getFreightCostBreakdown(f);
                  const breakdownLabel = `${formatCurrency(
                    breakdown.totalCost
                  )} (serviço ${formatCurrency(
                    breakdown.baseCost
                  )} + impostos ${formatCurrency(breakdown.taxesCost)})`;
                  return {
                    value: f.id,
                    label: f.name,
                    description: `${breakdownLabel} - ${f.originCity}/${f.originUf} → ${f.destinationCity}/${f.destinationUf}`,
                  };
                }) || []
            }
            value=""
            searchValue={freightSearch}
            onChange={toggleFreight}
            onSearchChange={setFreightSearch}
            placeholder="Buscar e adicionar frete..."
            emptyMessage="Nenhum frete encontrado"
          />
        </div>

        {selectedFreightIds.length > 0 && (
          <div className="space-y-2">
            {selectedFreightIds.map((freightId: string) => {
              const freight = freightsData?.data?.find(
                (f) => f.id === freightId
              );
              if (!freight) return null;
              const breakdown = getFreightCostBreakdown(freight);

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
                      {formatCurrency(breakdown.totalCost)}
                      <span className="block text-[11px] text-gray-400">
                        Serviço {formatCurrency(breakdown.baseCost)} + Impostos{" "}
                        {formatCurrency(breakdown.taxesCost)}
                      </span>
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

      {/* SEÇÃO 4: PREVIEW */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <Text className="font-semibold text-blue-900">
          Preview de Valores (Calculado Automaticamente)
        </Text>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Text className="text-gray-700">Custo base (produtos):</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.baseSubtotal)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">
              Impostos Não Recuperáveis (MP):
            </Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.nonRecoverableMpTaxes)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Fretes das matérias-primas:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(
                prices.mpFreightServiceTotal + prices.mpFreightTaxesTotal
              )}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Fretes da estrutura:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.structureFreightTotal)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Custo Fixo:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.fixedCostTotal)}
            </Text>
          </div>

          <div className="flex justify-between pt-2 border-t border-blue-300">
            <Text className="text-gray-700 font-medium">
              Preço total sem overhead:
            </Text>
            <Text className="font-semibold text-blue-700">
              {formatCurrency(prices.priceWithTaxesAndFreight)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Impostos Recuperáveis (MP):</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.recoverableCreditsTotal)}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text className="text-gray-700">Overhead do Grupo:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.groupOverhead || 0)}
            </Text>
          </div>

          <div className="flex justify-between pt-2 border-t-2 border-blue-400">
            <Text className="text-gray-900 font-bold text-base">
              Preço Final:
            </Text>
            <Text className="font-bold text-lg text-green-700">
              {formatCurrency(prices.finalPrice)}
            </Text>
          </div>

          {prices.finalPrice > prices.priceBase && prices.priceBase > 0 && (
            <div className="text-xs text-gray-600 text-right">
              +
              {(
                ((prices.finalPrice - prices.priceBase) / prices.priceBase) *
                100
              ).toFixed(1)}
              % de impostos, frete e custos fixos
            </div>
          )}
        </div>

        <div className="bg-white rounded p-3 mt-3 text-xs text-gray-600">
          <p className="font-medium mb-1">ℹ️ Como o preço é calculado:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>
              Custo base = (Preço por localização + custo adicional) ×
              quantidade
            </li>
            <li>
              Custo final do produto = Custo base + impostos não recuperáveis
              (MP) + fretes da matéria-prima (serviço + impostos)
            </li>
            <li>
              Estrutura = Σ(Produtos) + fretes da estrutura (serviço + impostos)
              + custo fixo
            </li>
            <li>Créditos recuperáveis são apenas informados (não somados)</li>
            <li>
              <strong>Preço Final = Estrutura + Overhead do Grupo</strong>
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
