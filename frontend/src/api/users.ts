import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  ExportUsersPayload,
  PaginatedResponse,
  User,
  UserRole,
} from "@/types/user";

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface FindAllUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserByAdminPayload {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface UpdateUserMePayload {
  name?: string;
  password?: string;
}

// POST /users/export
export async function exportUsers(payload: ExportUsersPayload): Promise<Blob> {
  const { data } = await apiClient.post("/users/export", payload, {
    responseType: "blob", // <-- ESSENCIAL para download de arquivo
  });
  return data;
}

// ========================================
// Funções de API
// ========================================

const USERS_QUERY_KEY = "users";

// GET /users
export async function getUsers(
  query: FindAllUsersQuery
): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get("/users", { params: query });
  return data;
}

// POST /users
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await apiClient.post("/users", payload);
  return data;
}

// PATCH /users/:id
export async function updateUserByAdmin({
  id,
  payload,
}: {
  id: string;
  payload: UpdateUserByAdminPayload;
}): Promise<User> {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

// PATCH /users/me
export async function updateUserMe(
  payload: UpdateUserMePayload
): Promise<User> {
  const { data } = await apiClient.patch("/users/me", payload);
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useUsersQuery(query: FindAllUsersQuery) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, query],
    queryFn: () => getUsers(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserByAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useExportUsersMutation() {
  return useMutation({
    mutationFn: exportUsers,
    // onSuccess não é necessário aqui, tratamos no componente
  });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] }); // Invalida a query do usuário logado
    },
  });
}
