// src/pages/FixedCosts.tsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { FixedCost } from "@/types/fixed_costs";
import { PageHeader } from "@/components/features/fixedCosts/PageHeader";
import { FixedCostsSummaryTable } from "@/components/features/fixedCosts/FixedCostsSummaryTable";
import { FixedCostModal } from "@/components/features/fixedCosts/FixedCostModal";
import { ExportModal } from "@/components/features/fixedCosts/ExportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import {
  useFixedCostsQuery,
  useDeleteFixedCostMutation,
  useExportFixedCostsMutation,
} from "@/api/fixedCosts";
import { useDebounce } from "@/hooks/useDebounce";
import { triggerCsvDownload } from "@/lib/utils";

const EXPORT_COLUMNS = [
  { key: "code", label: "Código" },
  { key: "description", label: "Descrição" },
  { key: "personnelExpenses", label: "Pessoal" },
  { key: "generalExpenses", label: "Outros" },
  { key: "proLabore", label: "Pró-Labore" },
  { key: "depreciation", label: "Depreciação" },
  { key: "totalCost", label: "Total" },
  { key: "considerationPercentage", label: "% Considerar" },
];

export default function FixedCosts() {
  // Estados
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("calculationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [deletingCostId, setDeletingCostId] = useState<string | null>(null);

  // Queries e Mutations
  const { data, isLoading, isError, isFetching, refetch } = useFixedCostsQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteFixedCostMutation();
  const exportMutation = useExportFixedCostsMutation();

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
    setEditingCost(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cost: FixedCost) => {
    setEditingCost(cost);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCost(null);
  };

  const handleDelete = async () => {
    if (!deletingCostId) return;

    try {
      await deleteMutation.mutateAsync(deletingCostId);
      toast.success("Custo fixo excluído com sucesso");
      setDeletingCostId(null);
    } catch (error) {
      toast.error("Erro ao excluir custo fixo");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Alterna a ordem
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      // Nova coluna, começa com desc (mais comum para números/datas)
      setSortBy(column);
      setSortOrder("desc");
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
        columns: options.columns,
        includeProducts: true,
      });

      const filename = `custos-fixos-${
        new Date().toISOString().split("T")[0]
      }.csv`;
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
          onNewFixedCostClick={handleOpenCreateModal}
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
          onNewFixedCostClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-red-600 font-semibold">
            Erro ao carregar custos fixos
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tente recarregar a página ou entre em contato com o suporte
          </p>
        </div>
      </>
    );
  }

  const hasCosts = data?.data && data.data.length > 0;

  return (
    <>
      <PageHeader
        onNewFixedCostClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
        onSearchChange={handleSearchChange}
        searchValue={searchInput}
      />

      {!hasCosts && !search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Nenhum custo fixo cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Novo custo fixo" para começar
          </p>
        </div>
      ) : !hasCosts && search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">
            Nenhum resultado encontrado para "{search}"
          </p>
        </div>
      ) : hasCosts ? (
        <>
          {isFetching && (
            <div className="mb-2 text-sm text-blue-600 text-right animate-pulse">
              🔄 Atualizando...
            </div>
          )}

          <FixedCostsSummaryTable
            costs={data.data}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeletingCostId(id)}
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
      <FixedCostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cost={editingCost}
      />

      <ConfirmModal
        isOpen={!!deletingCostId}
        onClose={() => setDeletingCostId(null)}
        onConfirm={handleDelete}
        title="Excluir Custo Fixo"
        message="Tem certeza que deseja excluir este custo fixo? As Estruturas associadas terão o custo fixo removido."
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
