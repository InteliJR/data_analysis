import { useState } from "react";
import toast from "react-hot-toast";
import { Package } from "lucide-react";

import {
  useProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
  useExportProductGroupsMutation,
  type FindAllProductGroupsQuery,
  type ExportProductGroupsPayload,
} from "@/api/productgroups";
import { useFixedCostsQuery } from "@/api/fixedCosts";
import type { FindAllFixedCostsQuery } from "@/types/fixed_costs";

import { Heading } from "@/components/common/Heading";
import { ActionBar } from "@/components/features/productgroups/ActionBar";
import { ProductGroupTable } from "@/components/features/productgroups/ProductGroupTable";
import { ProductGroupModal } from "@/components/features/productgroups/ProductGroupModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";

import type {
  ProductGroup,
  CreateProductGroupDTO,
  UpdateProductGroupDTO,
} from "@/types/productGroup";

export default function ProductGroups() {
  const [filters, setFilters] = useState<FindAllProductGroupsQuery>({
    page: 1,
    limit: 10,
    sortOrder: "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);

  // Queries e Mutations
  const { data, isLoading, error } = useProductGroupsQuery(filters);
  const createMutation = useCreateProductGroupMutation();
  const updateMutation = useUpdateProductGroupMutation();
  const deleteMutation = useDeleteProductGroupMutation();
  const exportMutation = useExportProductGroupsMutation();

  // Fetch fixed costs to compute considered total for overhead calculation
  const fixedCostsQueryParams: FindAllFixedCostsQuery = { page: 1, limit: 1000 };
  const { data: fixedCostsData } = useFixedCostsQuery(fixedCostsQueryParams);

  // Handlers
  const handleFilterChange = (
    newFilters: Partial<FindAllProductGroupsQuery>
  ) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleSort = (sortBy: string) => {
    const newSortOrder =
      filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    setFilters({
      ...filters,
      sortBy: sortBy as FindAllProductGroupsQuery["sortBy"],
      sortOrder: newSortOrder,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleNewGroup = () => {
    setSelectedGroup(null);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: ProductGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = (group: ProductGroup) => {
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (
    data: CreateProductGroupDTO | UpdateProductGroupDTO
  ) => {
    // Compute overheadPerUnit on the client using current fixed costs snapshot
    const totalConsidered = (fixedCostsData?.data || []).reduce((sum, fc) => {
      const t = Number(fc.totalCost || 0);
      const pct = Number(fc.considerationPercentage || 0);
      return sum + t * (pct / 100);
    }, 0);

    const pctGroup = (data.porcentage ?? 0) / 100;
    const volume = data.volumevendasconsiderar ?? 0;
    const overheadPerUnit = volume > 0 ? Math.round(((totalConsidered * pctGroup) / volume) * 100) / 100 : 0;

    const payloadWithOverhead = { ...data, overheadPerUnit } as typeof data & { overheadPerUnit: number };

    if (selectedGroup) {
      updateMutation.mutate(
        { id: selectedGroup.id, payload: payloadWithOverhead },
        {
          onSuccess: () => {
            toast.success("Grupo atualizado com sucesso!");
            setIsModalOpen(false);
            setSelectedGroup(null);
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Erro ao atualizar grupo. Tente novamente.";
            toast.error(errorMessage);
          },
        }
      );
    } else {
      createMutation.mutate(payloadWithOverhead as CreateProductGroupDTO, {
        onSuccess: () => {
          toast.success("Grupo criado com sucesso!");
          setIsModalOpen(false);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Erro ao criar grupo. Tente novamente.";
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedGroup) {
      deleteMutation.mutate(selectedGroup.id, {
        onSuccess: () => {
          toast.success("Grupo excluído com sucesso!");
          setIsDeleteModalOpen(false);
          setSelectedGroup(null);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Erro ao excluir grupo. Tente novamente.";
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleExport = (exportFilters: Partial<FindAllProductGroupsQuery>) => {
    const payload: ExportProductGroupsPayload = {
      search: exportFilters.search,
      sortBy: exportFilters.sortBy,
      sortOrder: exportFilters.sortOrder,
      limit: exportFilters.limit,
    };

    exportMutation.mutate(payload, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `grupos-produtos-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Exportação concluída!");
      },
      onError: () => {
        toast.error("Erro ao exportar. Tente novamente.");
      },
    });
  };

  // Error State
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Heading as="h1">Grupos de Produtos</Heading>
        </div>
        <EmptyState
          icon={Package}
          title="Erro ao carregar grupos"
          description="Ocorreu um erro ao carregar os grupos de produtos. Tente novamente."
          action={{
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div >
      <div className="mb-6">
        <Heading as="h1">Grupos de Produtos</Heading>
      </div>

      <ActionBar
        onNewGroup={handleNewGroup}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        currentFilters={filters}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.data.length ? (
        <EmptyState
          icon={Package}
          title="Nenhum grupo encontrado"
          description="Comece criando seu primeiro grupo de produtos para organizar melhor seu catálogo."
          action={{
            label: "Criar primeiro grupo",
            onClick: handleNewGroup,
          }}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ProductGroupTable
              groups={data.data}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onSort={handleSort}
              currentFilters={filters}
            />
          </div>

          {data.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      <ProductGroupModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGroup(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedGroup || undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedGroup(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Grupo"
        message={`Tem certeza que deseja excluir o grupo "${selectedGroup?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}