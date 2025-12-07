import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  ProductGroup,
  CreateProductGroupDTO,
  UpdateProductGroupDTO,
} from "@/types/productGroup";

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface PaginatedProductGroupsResponse {
  data: ProductGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindAllProductGroupsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?:
    | "name"
    | "volumePercentageByQuantity"
    | "volumePercentageByValue"
    | "averagePrice"
    | "totalValue"
    | "overheadPerUnit";
  sortOrder?: "asc" | "desc";
}

export interface ExportProductGroupsPayload {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  columns?: string[];
}

// ========================================
// Funções de API
// ========================================

const PRODUCT_GROUPS_QUERY_KEY = "product-groups";

// GET /product-groups
export async function getProductGroups(
  query: FindAllProductGroupsQuery
): Promise<PaginatedProductGroupsResponse> {
  const { data } = await apiClient.get("/product-groups", { params: query });
  return data;
}

// GET /product-groups/:id
export async function getProductGroupById(id: string): Promise<ProductGroup> {
  const { data } = await apiClient.get(`/product-groups/${id}`);
  return data;
}

// POST /product-groups
export async function createProductGroup(
  payload: CreateProductGroupDTO
): Promise<ProductGroup> {
  const { data } = await apiClient.post("/product-groups", payload);
  return data;
}

// PATCH /product-groups/:id
export async function updateProductGroup({
  id,
  payload,
}: {
  id: string;
  payload: UpdateProductGroupDTO;
}): Promise<ProductGroup> {
  const { data } = await apiClient.patch(`/product-groups/${id}`, payload);
  return data;
}

// DELETE /product-groups/:id
export async function deleteProductGroup(id: string): Promise<void> {
  await apiClient.delete(`/product-groups/${id}`);
}

// POST /product-groups/export
export async function exportProductGroups(
  payload: ExportProductGroupsPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/product-groups/export", payload, {
    responseType: "blob", // <-- ESSENCIAL para download de arquivo
  });
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useProductGroupsQuery(query: FindAllProductGroupsQuery) {
  return useQuery({
    queryKey: [PRODUCT_GROUPS_QUERY_KEY, query],
    queryFn: () => getProductGroups(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useProductGroupQuery(id: string) {
  return useQuery({
    queryKey: [PRODUCT_GROUPS_QUERY_KEY, id],
    queryFn: () => getProductGroupById(id),
    enabled: !!id,
  });
}

export function useCreateProductGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_GROUPS_QUERY_KEY] });
    },
  });
}

export function useUpdateProductGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_GROUPS_QUERY_KEY] });
    },
  });
}

export function useDeleteProductGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_GROUPS_QUERY_KEY] });
    },
  });
}

export function useExportProductGroupsMutation() {
  return useMutation({
    mutationFn: exportProductGroups,
    // onSuccess não é necessário aqui, tratamos no componente
  });
}
