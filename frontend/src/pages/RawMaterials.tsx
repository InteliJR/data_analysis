// src/pages/RawMaterials.tsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { RawMaterial } from "@/types/rawMaterial";
import { PageHeader } from "@/components/features/rawMaterials/PageHeader";
import { RawMaterialTable } from "@/components/features/rawMaterials/RawMaterialTable";
import { RawMaterialModal } from "@/components/features/rawMaterials/RawMaterialModal";
import { ExportModal } from "@/components/common/ExportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { RecentChangesPreview } from "@/components/features/rawMaterials/RecentChangesPreview";
import {
  useRawMaterialsQuery,
  useDeleteRawMaterialMutation,
  useExportRawMaterialsMutation,
} from "@/api/rawMaterials";
import { useDebounce } from "@/hooks/useDebounce";
import { triggerCsvDownload } from "@/lib/utils";

const EXPORT_COLUMNS = [
  { key: "code", label: "Código" },
  { key: "name", label: "Nome" },
  { key: "description", label: "Descrição" },
  { key: "measurementUnit", label: "Unidade de Medida" },
  { key: "inputGroup", label: "Grupo de Insumo" },
  { key: "paymentTerm", label: "Prazo de Pagamento" },
  { key: "acquisitionPrice", label: "Preço de Aquisição" },
  { key: "currency", label: "Moeda" },
  { key: "priceConvertedBrl", label: "Preço em BRL" },
  { key: "additionalCost", label: "Custo Adicional" },
  { key: "freight", label: "Frete" },
];

export default function RawMaterials() {
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
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [deletingRawMaterialId, setDeletingRawMaterialId] = useState<string | null>(null);

  // Queries e Mutations
  const { data, isLoading, isError, isFetching, refetch } = useRawMaterialsQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteRawMaterialMutation();
  const exportMutation = useExportRawMaterialsMutation();

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
    setEditingRawMaterial(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rawMaterial: RawMaterial) => {
    setEditingRawMaterial(rawMaterial);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRawMaterial(null);
  };

  const handleDelete = async () => {
    if (!deletingRawMaterialId) return;

    try {
      await deleteMutation.mutateAsync(deletingRawMaterialId);
      toast.success("Produto excluído com sucesso");
      setDeletingRawMaterialId(null);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (error?.response?.status === 409) {
        toast.error(
          "Este produto está associado a estruturas e não pode ser excluído"
        );
      } else {
        toast.error(message || "Erro ao excluir produto");
      }
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

      const filename = `materias-primas-${new Date().toISOString().split("T")[0]}.csv`;
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
          onNewRawMaterialClick={handleOpenCreateModal}
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
          onNewRawMaterialClick={handleOpenCreateModal}
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

  const hasRawMaterials = data?.data && data.data.length > 0;

  return (
    <>
      <PageHeader
        onNewRawMaterialClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
        onSearchChange={handleSearchChange}
        searchValue={searchInput}
      />

      {!hasRawMaterials && !search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-8">
          <p className="text-gray-500">Nenhum produto cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Novo produto" para começar
          </p>
        </div>
      ) : !hasRawMaterials && search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-8">
          <p className="text-gray-500">
            Nenhum resultado encontrado para "{search}"
          </p>
        </div>
      ) : hasRawMaterials ? (
        <>
          {isFetching && (
            <div className="mb-2 text-sm text-blue-600 text-right animate-pulse">
              🔄 Atualizando...
            </div>
          )}

          <RawMaterialTable
            rawMaterials={data.data}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeletingRawMaterialId(id)}
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

      {/* Preview das últimas alterações */}
      <RecentChangesPreview />

      {/* Modais */}
      <RawMaterialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rawMaterial={editingRawMaterial}
      />

      <ConfirmModal
        isOpen={!!deletingRawMaterialId}
        onClose={() => setDeletingRawMaterialId(null)}
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