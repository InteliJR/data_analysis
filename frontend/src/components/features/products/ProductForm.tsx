// src/components/features/products/ProductForm.tsx

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Product } from "@/types/products";

import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Textarea } from "@/components/common/Textarea";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { Text } from "@/components/common/Text";
import { Autocomplete } from "@/components/common/Autocomplete";
import type { RawMaterial, Freight } from "@/types/api";

import { FiTrash2, FiUser, FiCalendar, FiClock } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

import { useRawMaterialsQuery } from "@/api/rawMaterials";
import { useFixedCostsQuery } from "@/api/fixedCosts";
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
  const [fixedCostSearch, setFixedCostSearch] = useState("");
  const [productGroupSearch, setProductGroupSearch] = useState("");
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

  // Queries
  const { data: rawMaterialsData, isLoading: isLoadingRM } =
    useRawMaterialsQuery({
      page: 1,
      limit: 50,
      search: rawMaterialSearch,
    });

  const { data: fixedCostsData } = useFixedCostsQuery({
    page: 1,
    limit: 50,
    search: fixedCostSearch,
  });

  const { data: productGroupsData } = useProductGroupsQuery({
    page: 1,
    limit: 50,
    search: productGroupSearch,
  });

  const { data: freightsData } = useFreightsQuery({
    page: 1,
    limit: 50,
    search: freightSearch,
  });

  const rawMaterials = watch("rawMaterials") || [];
  const selectedFixedCostId = watch("fixedCostId");
  const selectedFreightIds = watch("freightIds") || [];

  // CÁLCULO CONSOLIDADO - Seguindo a lógica do backend
  const calculatePrices = () => {
    let totalRawMaterialsCost = 0;
    let totalTaxes = 0;
    let totalRawMaterialFreight = 0;

    // 1. Calcular custos das matérias-primas
    rawMaterials.forEach((rm: any) => {
      const rawMat = rawMaterialsData?.data?.find(
        (r) => r.id === rm.rawMaterialId
      );
      if (!rawMat) return;

      const quantity = Number(rm.quantity) || 0;
      const unitPrice = Number(rawMat.priceConvertedBrl) || 0;
      const materialCost = unitPrice * quantity;

      totalRawMaterialsCost += materialCost;

      // Impostos da matéria-prima (não recuperáveis)
      const taxes = rawMat.rawMaterialTaxes || [];
      taxes.forEach((tax: any) => {
        if (!tax.recoverable) {
          totalTaxes += (materialCost * Number(tax.rate)) / 100;
        }
      });

      // Fretes da matéria-prima
      const freights = rawMat.freights || [];
      freights.forEach((freight: any) => {
        const freightCost = Number(freight.unitPrice) || 0;
        totalRawMaterialFreight += freightCost * quantity;

        // Impostos do frete
        const freightTaxes = freight.freightTaxes || [];
        freightTaxes.forEach((fTax: any) => {
          totalTaxes += (freightCost * quantity * Number(fTax.rate)) / 100;
        });
      });
    });

    // 2. Fretes do produto
    let productFreightCost = 0;
    if (selectedFreightIds.length > 0 && freightsData?.data) {
      selectedFreightIds.forEach((freightId: string) => {
        const freight = freightsData.data.find((f) => f.id === freightId);
        if (freight) {
          const freightCost = Number(freight.unitPrice) || 0;
          productFreightCost += freightCost;

          // Impostos do frete do produto
          const freightTaxes = freight.freightTaxes || [];
          freightTaxes.forEach((fTax: any) => {
            totalTaxes += (freightCost * Number(fTax.rate)) / 100;
          });
        }
      });
    }

    const totalFreight = totalRawMaterialFreight + productFreightCost;

    // 3. Preço base (matérias-primas apenas)
    const priceBase = totalRawMaterialsCost;

    // 4. Preço com impostos e frete (sem custo fixo)
    const priceWithTaxesAndFreight = priceBase + totalTaxes + totalFreight;

    // 5. Custo fixo
    const fixedCostOverhead =
      selectedFixedCostId && fixedCostsData?.data
        ? Number(
            fixedCostsData.data.find((fc) => fc.id === selectedFixedCostId)
              ?.overheadPerUnit || 0
          )
        : 0;

    // 6. Preço final com custo fixo
    const finalPrice = priceWithTaxesAndFreight + fixedCostOverhead;

    return {
      priceBase,
      totalTaxes,
      totalFreight,
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
    // Limpar o search após adicionar
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
    // Limpar o search após adicionar
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

          <div className="sm:col-span-2">
            <Label htmlFor="productGroupId">Grupo de Produto (Opcional)</Label>
            <Autocomplete
              options={
                productGroupsData?.data?.map((pg) => ({
                  value: pg.id,
                  label: pg.name,
                  description: pg.description,
                })) || []
              }
              value={watch("productGroupId")}
              searchValue={productGroupSearch}
              onChange={(value) => setValue("productGroupId", value)}
              onSearchChange={setProductGroupSearch}
              placeholder="Buscar grupo de produto..."
              emptyMessage="Nenhum grupo encontrado"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="fixedCostId">Custo Fixo (Opcional)</Label>
            <Autocomplete
              options={
                fixedCostsData?.data?.map((fc) => ({
                  value: fc.id,
                  label: fc.description,
                  description: `${fc.code || "S/C"} - ${formatCurrency(
                    Number(fc.overheadPerUnit) || 0
                  )}/un`,
                })) || []
              }
              value={selectedFixedCostId}
              searchValue={fixedCostSearch}
              onChange={(value) => setValue("fixedCostId", value)}
              onSearchChange={setFixedCostSearch}
              placeholder="Buscar custo fixo..."
              emptyMessage="Nenhum custo fixo encontrado"
            />
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
            <Text className="text-gray-700">Impostos:</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.totalTaxes)}
            </Text>
          </div>

          <div className="flex justify-between">
            <Text className="text-gray-700">Fretes (Total):</Text>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(prices.totalFreight)}
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

          <div className="flex justify-between pt-2 border-t border-blue-300">
            <Text className="text-gray-700 font-medium">Preço Final:</Text>
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
            <li>Preço Base: soma de (matéria-prima × quantidade)</li>
            <li>
              Impostos: soma dos impostos não recuperáveis das matérias e fretes
            </li>
            <li>Fretes: soma dos fretes das matérias + fretes do produto</li>
            <li>Preço Final: Base + Impostos + Fretes + Custo Fixo</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-500 pb-4">
        <span className="text-red-500">*</span> Campos obrigatórios
      </p>
    </form>
  );
}
