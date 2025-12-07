import { useState, useMemo } from "react";
import { Users as UsersIcon } from "lucide-react";
import type { User, UserRole } from "@/types/user";
import { Heading } from "@/components/common/Heading";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { UsersActionBar } from "@/components/features/users/UsersActionBar";
import { UsersTable } from "@/components/features/users/UsersTable";
import { UserModal } from "@/components/features/users/UserModal";
import {
  useUsersQuery,
  useUpdateUserMutation,
  useExportUsersMutation,
} from "@/api/users";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import toast from "react-hot-toast";
import { triggerCsvDownload } from "@/lib/utils";
import { ExportModal } from "@/components/common/ExportModal";

export default function Users() {
  // Estado de Paginação e Filtros
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  const exportMutation = useExportUsersMutation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async (options: {
    limit: number;
    columns: string[];
  }) => {
    setIsExportModalOpen(false); // Fecha o modal
    toast.loading("Gerando CSV...", { id: "export-toast" });

    try {
      // Pega os filtros atuais da página
      const filters = query;

      const payload = {
        ...filters,
        ...options,
      };

      const blob = await exportMutation.mutateAsync(payload);

      // Dispara o download
      triggerCsvDownload(blob, "usuarios.csv");
      toast.success("Download do CSV iniciado.", { id: "export-toast" });
    } catch (error) {
      toast.error("Erro ao gerar CSV.", { id: "export-toast" });
    }
  };

  // Query de Usuários
  const query = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      role: roleFilter,
      isActive: isActiveFilter,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [page, limit, search, roleFilter, isActiveFilter]
  );

  const { data, isLoading, isError, refetch } = useUsersQuery(query);
  const users = data?.data || [];
  const meta = data?.meta;

  // Mutação para desativar usuário
  const updateUserMutation = useUpdateUserMutation();

  // Estado e handlers do Modal de Edição/Criação
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const handleOpenCreateModal = () => {
    setSelectedUser(undefined);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(undefined);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Estado e handlers do Modal de Confirmação (Desativação)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        payload: { isActive: false },
      });
      toast.success(`Usuário ${selectedUser.email} desativado com sucesso.`);
      refetch();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Erro ao desativar usuário.";
      toast.error(message);
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-96">
        <EmptyState
          icon={UsersIcon}
          title="Erro ao carregar usuários"
          description="Não foi possível carregar a lista de usuários. Tente novamente."
          action={{
            label: "Recarregar",
            onClick: () => refetch(),
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Heading as="h1" variant="title" className="mb-6">
        Gestão de usuários
      </Heading>

      <UsersActionBar
        onNewUserClick={handleOpenCreateModal}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setIsActiveFilter}
        onExport={handleExportClick}
        isExporting={exportMutation.isPending}
      />

      {users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={UsersIcon}
            title="Nenhum usuário encontrado"
            description={
              search || roleFilter || isActiveFilter !== undefined
                ? "Ajuste os filtros de busca ou crie um novo usuário."
                : "Comece criando seu primeiro usuário."
            }
            action={{
              label: "Criar usuário",
              onClick: handleOpenCreateModal,
            }}
          />
        </div>
      ) : (
        <>
          <UsersTable
            users={users}
            onEditUser={handleOpenEditModal}
            onDeleteUser={handleOpenDeleteModal}
          />

          {meta && meta.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modal de Confirmação de Desativação */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Desativar Usuário"
        message={`Você tem certeza que deseja desativar o usuário ${selectedUser?.email}? Ele não poderá mais fazer login até ser reativado.`}
        confirmText="Desativar"
      />

      {/* Modal de Criação/Edição */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        user={selectedUser}
        onSuccess={handleModalSuccess}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        defaultColumns={[
          { key: "name", label: "Nome" },
          { key: "email", label: "Email" },
          { key: "role", label: "Função" },
          { key: "isActive", label: "Status" },
          // Adicione mais colunas se desejar
          { key: "createdAt", label: "Data de Criação" },
        ]}
      />
    </>
  );
}
