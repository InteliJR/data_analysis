// src/components/features/products/ProductForm.tsx

import { useState } from "react";
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

import { useRawMaterialsQuery } from "@/api/rawMaterials";
import { useFixedCostsQuery, useFixedCostByIdQuery } from "@/api/fixedCosts";
import { useProductGroupsQuery } from "@/api/productgroups";
import { useFreightsQuery } from "@/api/freights";

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

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // Buscamos o custo fixo específico selecionado para garantir o cálculo correto
  // mesmo que ele não esteja na primeira página da lista do Select.
  const { data: selectedFixedCostData } = useFixedCostByIdQuery(
    selectedFixedCostId || null
  );

  // --- CÁLCULO CONSOLIDADO ---
  const calculatePrices = () => {
    let totalRawMaterials = 0;
    // Separar impostos para evitar dupla contagem e permitir subtração de recuperáveis
    let nonRecoverableMpTaxes = 0; // impostos não recuperáveis das matérias-primas
    let recoverableCreditsTotal = 0; // impostos recuperáveis das matérias-primas (créditos)
    let freightTaxesTotal = 0; // impostos dos fretes (MP + produto)
    let totalRawMaterialFreightService = 0; // serviço de frete das MPs (sem impostos)

    // 1. Calcular custos das matérias-primas
    rawMaterials.forEach((rm: any) => {
      let rawMat = rawMaterialsData?.data?.find(
        (r) => r.id === rm.rawMaterialId
      );

      if (!rawMat && product) {
        const originalRm = product.productRawMaterials?.find(
          (prm) => prm.rawMaterialId === rm.rawMaterialId
        );
        if (originalRm) {
          rawMat = originalRm.rawMaterial;
        }
      }

      if (!rawMat) return;

      const quantity = Number(rm.quantity) || 0;
      const unitPrice =
        Number(rawMat.priceConvertedBrl || rawMat.acquisitionPrice) || 0;
      const materialCost = unitPrice * quantity;

      totalRawMaterials += materialCost;

      // Impostos da matéria-prima
      const taxes = rawMat.rawMaterialTaxes || [];
      taxes.forEach((tax: any) => {
        const taxValue = (materialCost * Number(tax.rate)) / 100;
        if (tax.recoverable) {
          recoverableCreditsTotal += taxValue;
        } else {
          nonRecoverableMpTaxes += taxValue;
        }
      });

      // Fretes da matéria-prima
      const freights = rawMat.freights || [];
      freights.forEach((freight: any) => {
        const freightCost = Number(freight.unitPrice) || 0;
        const freightServiceCost = freightCost * quantity;
        totalRawMaterialFreightService += freightServiceCost;

        // IMPOSTOS DO FRETE DA MATÉRIA-PRIMA
        const freightTaxes = freight.freightTaxes || [];
        freightTaxes.forEach((fTax: any) => {
          const taxValue = (freightServiceCost * Number(fTax.rate)) / 100;
          freightTaxesTotal += taxValue;
        });
      });
    });

    // 2. Fretes do produto
    let productFreightServiceCost = 0;
    let productFreightTaxesTotal = 0; // impostos dos fretes do produto

    selectedFreightIds.forEach((freightId: string) => {
      let freight = freightsData?.data?.find((f) => f.id === freightId);

      if (!freight && product) {
        freight = product.freights?.find((f) => f.id === freightId);
      }

      if (freight) {
        const freightCost = Number(freight.unitPrice) || 0;
        productFreightServiceCost += freightCost;

        // CRÍTICO: IMPOSTOS DO FRETE DO PRODUTO
        const freightTaxes = freight.freightTaxes || [];
        freightTaxes.forEach((fTax: any) => {
          const taxValue = (freightCost * Number(fTax.rate)) / 100;
          freightTaxesTotal += taxValue;
          productFreightTaxesTotal += taxValue; // Para debug
        });
      }
    });

    const totalFreightService =
      totalRawMaterialFreightService + productFreightServiceCost;

    // 3. Cálculos finais
    const priceBase = totalRawMaterials;
    // Alinhar com backend: Base + impostos não recuperáveis (MP) + frete (serviço + impostos) - créditos recuperáveis
    // NOVA REGRA: NÃO somar impostos não recuperáveis de MP ao preço final
    // Fórmula: Base + Frete (serviço + impostos) - Créditos Recuperáveis
    const priceWithTaxesAndFreight =
      priceBase + totalFreightService + freightTaxesTotal - recoverableCreditsTotal;

    // Overhead do grupo (se selecionado)
    let groupOverhead = 0;
    if (selectedProductGroupId) {
      const pg = productGroupsData?.data?.find((p: any) => p.id === selectedProductGroupId);
      if (pg?.overheadPerUnit) {
        groupOverhead = Number(pg.overheadPerUnit) || 0;
      }
    } else if (product?.productGroup?.overheadPerUnit) {
      groupOverhead = Number(product.productGroup.overheadPerUnit) || 0;
    }

    // 4. Custo fixo (overhead agora é por Grupo; não somar aqui)
    const fixedCostOverhead = 0; // Mantido 0; overhead agora vem do grupo

    // 5. Preço final
    const finalPrice = priceWithTaxesAndFreight + groupOverhead;

    return {
      priceBase,
      nonRecoverableMpTaxes,
      recoverableCreditsTotal,
      totalFreight: totalFreightService + freightTaxesTotal,
      groupOverhead,
      priceWithTaxesAndFreight,
      fixedCostOverhead,
      finalPrice,
    };
  };

  const prices = calculatePrices();

  const addRawMaterial = (rawMaterialId: string) => {
    const exists = rawMaterials.some(
      (rm: any) => rm.rawMaterialId === rawMaterialId
    );
    if (!exists) {
      append({ rawMaterialId, quantity: 1 });
    }
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
              Nome do Produto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Produto A"
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
              placeholder="Detalhes sobre o produto..."
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
              label="Grupo de Produto (Opcional)"
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
                    {selectedFixedCostData.description} - {" "}
                    {selectedFixedCostData.code || "S/C"}
                  </option>
                )}
            </Select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: MATÉRIAS-PRIMAS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Matérias-Primas <span className="text-red-500">*</span>
          </h3>
          <Text className="text-xs text-gray-500">Mínimo: 1 item</Text>
        </div>

        <div className="mb-4">
          <Autocomplete
            options={
              rawMaterialsData?.data
                ?.filter(
                  (rm) =>
                    !rawMaterials.some((r: any) => r.rawMaterialId === rm.id)
                )
                .map((rm) => ({
                  value: rm.id,
                  label: `${rm.code} - ${rm.name}`,
                  description: `${formatCurrency(
                    Number(rm.priceConvertedBrl) || 0
                  )} - ${rm.measurementUnit}`,
                })) || []
            }
            value=""
            searchValue={rawMaterialSearch}
            onChange={addRawMaterial}
            onSearchChange={setRawMaterialSearch}
            placeholder="Buscar e adicionar matéria-prima..."
            emptyMessage="Nenhuma matéria-prima encontrada"
            isLoading={isLoadingRM}
          />
        </div>

        {fields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <Text className="text-gray-500 text-sm">
              Nenhuma matéria-prima adicionada. Busque e adicione pelo menos
              uma.
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const rawMat = rawMaterialsData?.data?.find(
                (r) => r.id === rawMaterials[index]?.rawMaterialId
              );

              const totalFreightUnit = (rawMat?.freights || []).reduce(
                (acc, f) => acc + Number(f.unitPrice),
                0
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

                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Preço unitário:{" "}
                        <span className="font-medium">
                          {formatCurrency(
                            Number(rawMat?.priceConvertedBrl) || 0
                          )}
                        </span>
                      </div>
                      <div>
                        Unidade:{" "}
                        <span className="font-medium">
                          {rawMat?.measurementUnit || "-"}
                        </span>
                      </div>
                      {totalFreightUnit > 0 && (
                        <div>
                          Frete (Total):{" "}
                          <span className="font-medium">
                            {formatCurrency(totalFreightUnit)}
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
                        (Number(rawMat?.priceConvertedBrl) || 0) *
                          (Number(rawMaterials[index]?.quantity) || 0)
                      )}
                    </Text>
                  </div>

                  <SecondaryButton
                    type="button"
                    variant="ghost"
                    leftIcon={FiTrash2}
                    onClick={() => remove(index)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                    aria-label={`Remover matéria-prima ${index + 1}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {fields.length === 0 && (
          <Text className="text-xs text-red-600 mt-2">
            Adicione pelo menos uma matéria-prima para criar o produto
          </Text>
        )}
      </div>

      {/* SEÇÃO 3: FRETES DO PRODUTO */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Fretes do Produto (Opcional)
        </h3>

        <div className="mb-4">
          <Autocomplete
            options={
              freightsData?.data
                ?.filter((f) => !selectedFreightIds.includes(f.id))
                .map((f) => ({
                  value: f.id,
                  label: f.name,
                  description: `${formatCurrency(Number(f.unitPrice) || 0)} - ${
                    f.originCity
                  }/${f.originUf} → ${f.destinationCity}/${f.destinationUf}`,
                })) || []
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
                      {formatCurrency(Number(freight.unitPrice) || 0)}
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
            <Text className="text-gray-700">Custo de Matérias-Primas:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.priceBase)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Impostos Não Recuperáveis (MP):</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.nonRecoverableMpTaxes)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Fretes (Total):</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.totalFreight)}
            </Text>
          </div>

          <div className="flex justify-between pt-2 border-t border-blue-300">
            <Text className="text-gray-700 font-medium">
              Preço sem Custo Fixo:
            </Text>
            <Text className="font-semibold text-blue-700">
              {formatCurrency(prices.priceWithTaxesAndFreight)}
            </Text>
          </div>

          {prices.fixedCostOverhead > 0 && (
            <div className="flex justify-between">
              <Text className="text-gray-700">Custo Fixo (Overhead):</Text>
              <Text className="font-semibold text-gray-900">
                {formatCurrency(prices.fixedCostOverhead)}
              </Text>
            </div>
          )}

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
            <li>Preço Base: soma (matéria-prima × quantidade)</li>
            <li>Fretes: soma fretes das matérias + fretes do produto (+ impostos de frete)</li>
            <li>Impostos Recuperáveis: subtraídos do preço final</li>
            <li>Impostos Não Recuperáveis (MP): exibidos, porém não adicionados</li>
            <li><strong>Preço Final: Base + Frete (serviço + impostos) − Impostos Recuperáveis + Overhead do Grupo</strong></li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
