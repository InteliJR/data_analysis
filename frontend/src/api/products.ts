// src/api/products.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
} from "@/types/products";

// ========================================
// Tipagens de Resposta
// ========================================

export interface ProductsListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExportProductsPayload {
  format: "csv";
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: {
    search?: string;
    productGroupId?: string;
  };
}

export interface FindAllProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  productGroupId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ========================================
// Funções de API
// ========================================

export function fetchProducts(params: FindAllProductsQuery) {
  return apiClient
    .get<ProductsListResponse>("/products", { params })
    .then((r) => r.data);
}

export function fetchProduct(id: string) {
  return apiClient.get<Product>(`/products/${id}`).then((r) => r.data);
}

export function createProduct(payload: CreateProductDTO) {
  return apiClient.post<Product>("/products", payload).then((r) => r.data);
}

export function updateProduct(id: string, payload: UpdateProductDTO) {
  return apiClient
    .patch<Product>(`/products/${id}`, payload)
    .then((r) => r.data);
}

export function deleteProduct(id: string) {
  return apiClient
    .delete<{ message: string; id: string }>(`/products/${id}`)
    .then((r) => r.data);
}

export async function exportProducts(
  payload: ExportProductsPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/products/export", payload, {
    responseType: "blob",
  });
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useProductsQuery(params: FindAllProductsQuery) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProductQuery(id?: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id as string),
    enabled: !!id,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateProductDTO }) =>
      updateProduct(args.id, args.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useExportProductsMutation() {
  return useMutation({
    mutationFn: exportProducts,
  });
}
