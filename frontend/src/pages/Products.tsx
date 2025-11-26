// src/pages/Products.tsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Product } from "@/types/products";
import { PageHeader } from "@/components/features/products/PageHeader";
import { ProductsTable } from "@/components/features/products/ProductTable";
import { ProductModal } from "@/components/features/products/ProductModal";
import { ExportModal } from "@/components/features/products/ExportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import {
  useProductsQuery,
  useDeleteProductMutation,
  useExportProductsMutation,
} from "@/api/products";
import { useDebounce } from "@/hooks/useDebounce";
import { triggerCsvDownload } from "@/lib/utils";

const EXPORT_COLUMNS = [
  { key: "code", label: "Código" },
  { key: "name", label: "Nome" },
  { key: "description", label: "Descrição" },
  { key: "productGroup", label: "Grupo de Produto" },
  { key: "priceWithoutTaxesAndFreight", label: "Preço sem Impostos/Frete" },
  { key: "priceWithTaxesAndFreight", label: "Preço s/ Overhead" },
  { key: "overhead", label: "Overhead (Grupo)" },
  { key: "finalPrice", label: "Preço Final" },
  { key: "rawMaterialsCount", label: "Qtd. Matérias-Primas" },
];

export default function Products() {
  // Estados
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Queries e Mutations
  const { data, isLoading, isError, isFetching, refetch } = useProductsQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteProductMutation();
  const exportMutation = useExportProductsMutation();

  // Debounce na busca
  const debouncedSetSearch = useDebounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 300);

  // Handler para mudança no input
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  // Refetch quando sortBy ou sortOrder mudam
  useEffect(() => {
    refetch();
  }, [sortBy, sortOrder, refetch]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (!deletingProductId) return;

    try {
      await deleteMutation.mutateAsync(deletingProductId);
      toast.success("Produto excluído com sucesso");
      setDeletingProductId(null);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(message || "Erro ao excluir produto");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleExport = async (options: {
    limit: number;
    columns: string[];
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    try {
      const blob = await exportMutation.mutateAsync({
        format: "csv",
        limit: options.limit,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        filters: { search },
      });

      const filename = `produtos-${new Date().toISOString().split("T")[0]}.csv`;
      triggerCsvDownload(blob, filename);
      toast.success("CSV exportado com sucesso");
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error("Erro ao exportar CSV");
    }
  };

  // Render
  if (isLoading) {
    return (
      <>
        <PageHeader
          onNewProductClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <LoadingSpinner size="lg" />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          onNewProductClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-red-600 font-semibold">Erro ao carregar produtos</p>
          <p className="text-sm text-gray-500 mt-2">
            Tente recarregar a página ou entre em contato com o suporte
          </p>
        </div>
      </>
    );
  }

  const hasProducts = data?.data && data.data.length > 0;

  return (
    <>
      <PageHeader
        onNewProductClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
        onSearchChange={handleSearchChange}
        searchValue={searchInput}
      />

      {!hasProducts && !search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Nenhum produto cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Novo produto" para começar
          </p>
        </div>
      ) : !hasProducts && search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">
            Nenhum resultado encontrado para "{search}"
          </p>
        </div>
      ) : hasProducts ? (
        <>
          {isFetching && (
            <div className="mb-2 text-sm text-blue-600 text-right animate-pulse">
              🔄 Atualizando...
            </div>
          )}

          <ProductsTable
            products={data.data}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeletingProductId(id)}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />

          {data.meta && data.meta.totalPages > 1 && (
            <div className="mb-8">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}

      {/* Modais */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
      />

      <ConfirmModal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        onConfirm={handleDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExport}
        defaultColumns={EXPORT_COLUMNS}
      />
    </>
  );
}