// src/pages/Freights.tsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Freight } from "@/types/freights";
import { PageHeader } from "@/components/features/freights/PageHeader";
import { FreightsTable } from "@/components/features/freights/FreightsTable";
import { FreightModal } from "@/components/features/freights/FreightModal";
import { ExportModal } from "@/components/features/freights/ExportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import {
  useFreightsQuery,
  useDeleteFreightMutation,
  useExportFreightsMutation,
} from "@/api/freights";
import { useDebounce } from "@/hooks/useDebounce";
import { triggerCsvDownload } from "@/lib/utils";

const EXPORT_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "description", label: "Descrição" },
  { key: "originUf", label: "UF Origem" },
  { key: "originCity", label: "Cidade Origem" },
  { key: "destinationUf", label: "UF Destino" },
  { key: "destinationCity", label: "Cidade Destino" },
  { key: "cargoType", label: "Tipo de Carga" },
  { key: "operationType", label: "Tipo de Operação" },
  { key: "unitPrice", label: "Preço Unitário" },
  { key: "currency", label: "Moeda" },
];

export default function Freights() {
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
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [deletingFreightId, setDeletingFreightId] = useState<string | null>(
    null
  );

  // Queries e Mutations
  const { data, isLoading, isError, isFetching, refetch } = useFreightsQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteFreightMutation();
  const exportMutation = useExportFreightsMutation();

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
    setEditingFreight(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (freight: Freight) => {
    setEditingFreight(freight);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFreight(null);
  };

  const handleDelete = async () => {
    if (!deletingFreightId) return;

    try {
      await deleteMutation.mutateAsync(deletingFreightId);
      toast.success("Frete excluído com sucesso");
      setDeletingFreightId(null);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (error?.response?.status === 409) {
        toast.error(
          "Este frete está associado a Produtos e não pode ser excluído"
        );
      } else {
        toast.error(message || "Erro ao excluir frete");
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

      const filename = `fretes-${new Date().toISOString().split("T")[0]}.csv`;
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
          onNewFreightClick={handleOpenCreateModal}
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
          onNewFreightClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-red-600 font-semibold">Erro ao carregar fretes</p>
          <p className="text-sm text-gray-500 mt-2">
            Tente recarregar a página ou entre em contato com o suporte
          </p>
        </div>
      </>
    );
  }

  const hasFreights = data?.data && data.data.length > 0;

  return (
    <>
      <PageHeader
        onNewFreightClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
        onSearchChange={handleSearchChange}
        searchValue={searchInput}
      />

      {!hasFreights && !search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Nenhum frete cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Novo frete" para começar
          </p>
        </div>
      ) : !hasFreights && search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">
            Nenhum resultado encontrado para "{search}"
          </p>
        </div>
      ) : hasFreights ? (
        <>
          {isFetching && (
            <div className="mb-2 text-sm text-blue-600 text-right animate-pulse">
              🔄 Atualizando...
            </div>
          )}

          <FreightsTable
            freights={data.data}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeletingFreightId(id)}
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
      <FreightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        freight={editingFreight}
      />

      <ConfirmModal
        isOpen={!!deletingFreightId}
        onClose={() => setDeletingFreightId(null)}
        onConfirm={handleDelete}
        title="Excluir Frete"
        message="Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita."
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
