// src/components/features/products/ProductsTable.tsx

import type { Product } from "@/types/products";
import { useState, useMemo } from "react";
import { Text } from "@/components/common/Text";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit2, FiTrash2, FiChevronUp } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: ProductsTableProps) {
  // Converte strings como "1.234,56" para número 1234.56
  const toNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return val || 0;
    if (typeof val === "string") {
      const cleaned = val.replace(/\./g, "").replace(/,/g, ".");
      const n = Number(cleaned);
      return isNaN(n) ? 0 : n;
    }
    return Number(val) || 0;
  };
  // Guarda a cidade selecionada por estrutura (linha)
  const [selectedCityById, setSelectedCityById] = useState<Record<string, string | "">>({});

  const makeCityLabel = (city?: string, uf?: string) =>
    city && uf ? `${city} - ${uf}` : city || "";

  const getUniqueCityOptions = (product: Product): string[] => {
    const set = new Set<string>();
    product.productRawMaterials?.forEach((rm) => {
      const locations = (rm.rawMaterial as any)?.locations || [];
      locations.forEach((loc: any) => {
        const label = makeCityLabel(loc?.city, loc?.stateUf);
        if (label) set.add(label);
      });
    });
    return Array.from(set);
  };

  const filterItemsByCity = (product: Product): typeof product.productRawMaterials => {
    const selected = selectedCityById[product.id] || "";
    if (!selected) return product.productRawMaterials || [];
    return (product.productRawMaterials || []).filter((rm) => {
      const locations = (rm.rawMaterial as any)?.locations || [];
      return locations.some((loc: any) => makeCityLabel(loc?.city, loc?.stateUf) === selected);
    });
  };

  const computeFilteredBase = (product: Product): number => {
    const selected = selectedCityById[product.id] || "";
    if (!selected) return Number(product.priceWithoutTaxesAndFreight) || 0;
    const items = filterItemsByCity(product);
    let total = 0;
    items.forEach((rm) => {
      const qty = toNumber(rm.quantity);
      const locations = (rm.rawMaterial as any)?.locations || [];
      const matched = locations.find((loc: any) => makeCityLabel(loc?.city, loc?.stateUf) === selected);
      const baseUnit = matched
        ? (toNumber(matched.priceConvertedBrl ?? matched.acquisitionPrice ?? 0) + toNumber(matched.additionalCost ?? 0))
        : toNumber((rm.rawMaterial as any)?.priceConvertedBrl ?? (rm.rawMaterial as any)?.acquisitionPrice ?? 0);
      total += baseUnit * qty;
    });
    return total;
  };

  const computeFilteredTaxesAndFreight = (product: Product): { base: number; withTaxesAndFreight: number } => {
    const selected = selectedCityById[product.id] || "";
    // If no filter, keep original values
    if (!selected) {
      const base = Number(product.priceWithoutTaxesAndFreight) || 0;
      const full = Number(product.priceWithTaxesAndFreight) || base;
      return { base, withTaxesAndFreight: full };
    }

    const items = filterItemsByCity(product);
    let baseTotal = 0;
    let freightTotal = 0;
    let taxTotal = 0;

    items.forEach((rm) => {
      const qty = toNumber(rm.quantity);
      const rawMat: any = rm.rawMaterial || {};
      const locations = rawMat.locations || [];
      const matched = locations.find((loc: any) => makeCityLabel(loc?.city, loc?.stateUf) === selected) || locations[0];

      const unitBase = matched
        ? (toNumber(matched.priceConvertedBrl ?? matched.acquisitionPrice ?? 0) + toNumber(matched.additionalCost ?? 0))
        : toNumber(rawMat.priceConvertedBrl ?? rawMat.acquisitionPrice ?? 0);
      baseTotal += unitBase * qty;

      // Location taxes (% on unit base)
      const locTaxes: any[] = matched?.locationTaxes || [];
      const taxesPct = locTaxes.reduce((acc, t: any) => acc + toNumber(t.rate || 0), 0);
      taxTotal += (unitBase * (taxesPct / 100)) * qty;

      // Freights for this location (sum unit price)
      const freights: any[] = matched?.freights || [];
      freights.forEach((f: any) => {
        const fUnit = toNumber(f.unitPrice || 0);
        let fTaxPct = 0;
        (f.freightTaxes || []).forEach((ft: any) => {
          fTaxPct += toNumber(ft.rate || 0);
        });
        const fWithTaxes = fUnit + fUnit * (fTaxPct / 100);
        freightTotal += fWithTaxes * qty;
      });
    });

    const withTaxesAndFreight = baseTotal + taxTotal + freightTotal;
    return { base: baseTotal, withTaxesAndFreight };
  };

  const SortIcon = ({ column }: { column: string }) => {
    const isActive = sortBy === column;

    return (
      <span
        className={`
          text-blue-600 w-4 h-4 transition-transform duration-200 
          ${isActive ? "opacity-100" : "opacity-0"} 
          ${isActive && sortOrder === "desc" ? "rotate-180" : ""}
        `}
      >
        <FiChevronUp />
      </span>
    );
  };

  const SortableHeader = ({
    column,
    label,
    width,
  }: {
    column: string;
    label: string;
    width?: string;
  }) => (
    <th
      onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}`}
      style={{ width }}
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        {label}
        <SortIcon column={column} />
      </span>
    </th>
  );

  const truncateClass =
    "max-w-[140px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  const truncateWide =
    "max-w-[200px] truncate overflow-hidden text-ellipsis whitespace-nowrap";

  // Preço final = preço com impostos/frete + overhead (do grupo)
  const calculateFinalPrice = (product: Product) => {
    const priceWithTaxesAndFreight = Number(product.priceWithTaxesAndFreight) || 0;
    const overhead = Number(product.productGroup?.overheadPerUnit ?? 0);
    return priceWithTaxesAndFreight + overhead;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader column="code" label="Código" width="120px" />
              <SortableHeader column="name" label="Nome" width="220px" />
              <SortableHeader
                column="productGroup"
                label="Grupo"
                width="160px"
              />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[140px]">
                Produtos
              </th>
              <SortableHeader
                column="priceWithoutTaxesAndFreight"
                label="Preço Base"
                width="140px"
              />
              <SortableHeader
                column="priceWithTaxesAndFreight"
                label="Preço s/ Overhead"
                width="160px"
              />
              <SortableHeader column="overhead" label="Overhead" width="120px" />
              <SortableHeader column="finalPrice" label="Preço Final" width="140px" />
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[100px]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const priceBase = Number(product.priceWithoutTaxesAndFreight) || 0;
              const overhead = Number(product.productGroup?.overheadPerUnit ?? 0);
              const priceFinal = calculateFinalPrice(product);

              const cityOptions = getUniqueCityOptions(product);
              const selectedCity = selectedCityById[product.id] || "";
              const filteredItems = filterItemsByCity(product);
              const { base: filteredBase, withTaxesAndFreight: filteredFull } = computeFilteredTaxesAndFreight(product);

              return (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Código */}
                  <td className="px-4 py-3">
                    <Text
                      variant="caption"
                      className="font-mono font-semibold text-gray-900"
                    >
                      {product.code}
                    </Text>
                  </td>

                  {/* Nome + descrição */}
                  <td className="px-4 py-3 align-top">
                    <div title={product.name} className={truncateWide}>
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {product.name.slice(0, 25)}
                        {product.name.length > 25 && "..."}
                      </Text>
                    </div>

                    {product.description && (
                      <div
                        title={product.description}
                        className="text-gray-500 text-xs mt-1 max-w-[200px] truncate"
                      >
                        {product.description.slice(0, 35)}
                        {product.description.length > 35 && "..."}
                      </div>
                    )}
                  </td>

                  {/* Grupo */}
                  <td className="px-4 py-3" title={product.productGroup?.name}>
                    {product.productGroup ? (
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${truncateClass}`}
                      >
                        {product.productGroup.name.slice(0, 15)}
                        {product.productGroup.name.length > 15 && "..."}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Produtos */}
                  <td className="px-4 py-3">
                    <div>
                      {/* Filtro por cidade na linha */}
                      {cityOptions.length > 0 && (
                        <div className="mb-2">
                          <select
                            aria-label="Filtrar por cidade (linha)"
                            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700"
                            value={selectedCity}
                            onChange={(e) =>
                              setSelectedCityById((prev) => ({ ...prev, [product.id]: e.target.value }))
                            }
                          >
                            <option value="">Todas as cidades</option>
                            {cityOptions.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {filteredItems?.length || 0}{" "}
                        {filteredItems?.length === 1
                          ? "item"
                          : "itens"}
                      </Text>
                      {filteredItems && filteredItems.length > 0 && (
                          <div
                            className="text-xs text-gray-500 mt-1 max-w-[130px] truncate"
                            title={filteredItems
                              .map((rm) => rm.rawMaterial?.name)
                              .join(", ")}
                          >
                            {filteredItems
                              .slice(0, 2)
                              .map((rm) => rm.rawMaterial?.name)
                              .join(", ")}
                            {filteredItems.length > 2 && ` +${filteredItems.length - 2}`}
                          </div>
                        )}
                    </div>
                  </td>

                  {/* Preço Base */}
                  <td className="px-4 py-3">
                    {(selectedCity ? filteredBase : priceBase) > 0 ? (
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {formatCurrency(selectedCity ? filteredBase : priceBase)}
                      </Text>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                    {selectedCity && (
                      <div className="text-[10px] text-gray-500">filtrado por cidade</div>
                    )}
                  </td>

                  {/* Preço s/ Overhead */}
                  <td className="px-4 py-3">
                    {(selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight)) > 0 ? (
                      <div>
                        <Text
                          variant="caption"
                          className="font-semibold text-gray-900"
                        >
                          {formatCurrency(selectedCity ? filteredFull : (Number(product.priceWithTaxesAndFreight) || 0))}
                        </Text>
                        {(() => {
                          const baseShow = selectedCity ? filteredBase : priceBase;
                          const fullShow = selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0;
                          return baseShow > 0 && fullShow > baseShow;
                        })() && (
                          <Text
                            variant="caption"
                            className="text-xs text-gray-500"
                          >
                            (+
                            {(() => {
                              const baseShow = selectedCity ? filteredBase : priceBase;
                              const fullShow = selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0;
                              return (((fullShow - baseShow) / baseShow) * 100).toFixed(1);
                            })()}
                            %)
                          </Text>
                        )}
                        {selectedCity && (
                          <div className="text-[10px] text-gray-500">filtrado por cidade</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Overhead (Grupo) */}
                  <td className="px-4 py-3">
                    {overhead > 0 ? (
                      <Text variant="caption" className="font-semibold text-gray-900">
                        {formatCurrency(overhead)}
                      </Text>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Preço Final (com Overhead) */}
                  <td className="px-4 py-3">
                    {(() => {
                      const fullShow = selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0;
                      const finalShow = fullShow + overhead;
                      return finalShow > 0;
                    })() ? (
                      <div>
                        <Text
                          variant="caption"
                          className="font-bold text-green-700"
                        >
                          {formatCurrency((selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0) + overhead)}
                        </Text>
                        {(() => {
                          const baseShow = selectedCity ? filteredBase : priceBase;
                          const finalShow = (selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0) + overhead;
                          return baseShow > 0 && finalShow > baseShow;
                        })() && (
                          <Text
                            variant="caption"
                            className="text-xs text-gray-500"
                          >
                            (+
                            {(() => {
                              const baseShow = selectedCity ? filteredBase : priceBase;
                              const finalShow = (selectedCity ? filteredFull : Number(product.priceWithTaxesAndFreight) || 0) + overhead;
                              return (((finalShow - baseShow) / baseShow) * 100).toFixed(1);
                            })()}
                            %)
                          </Text>
                        )}
                        {selectedCity && (
                          <div className="text-[10px] text-gray-500">filtrado por cidade</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        icon={FiEdit2}
                        aria-label="Editar estrutura"
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                      />
                      <IconButton
                        icon={FiTrash2}
                        aria-label="Excluir estrutura"
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:bg-red-50 cursor-pointer"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
