// src/components/features/products/ProductsTable.tsx

import type { Product } from "@/types/products";
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
                Matérias-Primas
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
              const priceBase =
                Number(product.priceWithoutTaxesAndFreight) || 0;
              const overhead = Number(product.productGroup?.overheadPerUnit ?? 0);
              const priceFinal = calculateFinalPrice(product);

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

                  {/* Matérias-Primas */}
                  <td className="px-4 py-3">
                    <div>
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {product.productRawMaterials?.length || 0}{" "}
                        {product.productRawMaterials?.length === 1
                          ? "item"
                          : "itens"}
                      </Text>
                      {product.productRawMaterials &&
                        product.productRawMaterials.length > 0 && (
                          <div
                            className="text-xs text-gray-500 mt-1 max-w-[130px] truncate"
                            title={product.productRawMaterials
                              .map((rm) => rm.rawMaterial?.name)
                              .join(", ")}
                          >
                            {product.productRawMaterials
                              .slice(0, 2)
                              .map((rm) => rm.rawMaterial?.name)
                              .join(", ")}
                            {product.productRawMaterials.length > 2 &&
                              ` +${product.productRawMaterials.length - 2}`}
                          </div>
                        )}
                    </div>
                  </td>

                  {/* Preço Base */}
                  <td className="px-4 py-3">
                    {priceBase > 0 ? (
                      <Text
                        variant="caption"
                        className="font-semibold text-gray-900"
                      >
                        {formatCurrency(priceBase)}
                      </Text>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Preço s/ Overhead */}
                  <td className="px-4 py-3">
                    {Number(product.priceWithTaxesAndFreight) > 0 ? (
                      <div>
                        <Text
                          variant="caption"
                          className="font-semibold text-gray-900"
                        >
                          {formatCurrency(Number(product.priceWithTaxesAndFreight) || 0)}
                        </Text>
                        {priceBase > 0 && Number(product.priceWithTaxesAndFreight) > priceBase && (
                          <Text
                            variant="caption"
                            className="text-xs text-gray-500"
                          >
                            (+
                            {(
                              ((Number(product.priceWithTaxesAndFreight) - priceBase) / priceBase) *
                              100
                            ).toFixed(1)}
                            %)
                          </Text>
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
                    {priceFinal > 0 ? (
                      <div>
                        <Text
                          variant="caption"
                          className="font-bold text-green-700"
                        >
                          {formatCurrency(priceFinal)}
                        </Text>
                        {priceBase > 0 && priceFinal > priceBase && (
                          <Text
                            variant="caption"
                            className="text-xs text-gray-500"
                          >
                            (+
                            {(
                              ((priceFinal - priceBase) / priceBase) * 100
                            ).toFixed(1)}
                            %)
                          </Text>
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
                        aria-label="Editar produto"
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                      />
                      <IconButton
                        icon={FiTrash2}
                        aria-label="Excluir produto"
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
