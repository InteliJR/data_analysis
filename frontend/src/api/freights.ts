// src/api/freights.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Freight } from "@/types";

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface FreightTax {
  id?: string;
  name: string;
  rate: number;
}

export interface CreateFreightDTO {
  name: string;
  description?: string;
  unitPrice: number;
  currency: "BRL" | "USD" | "EUR";
  originUf: string;
  originCity: string;
  destinationUf: string;
  destinationCity: string;
  cargoType: string;
  operationType: "INTERNAL" | "EXTERNAL";
  freightTaxes: FreightTax[];
}

export interface UpdateFreightDTO extends Partial<CreateFreightDTO> {}

export interface PaginatedFreightsResponse {
  data: Freight[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FindAllFreightsQuery {
  page?: number;
  limit?: number;
  search?: string;
  currency?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ExportFreightsPayload {
  format: "csv";
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: {
    search?: string;
    currency?: string;
  };
}

// ========================================
// Funções de API
// ========================================

const FREIGHTS_QUERY_KEY = "freights";

// GET /freights
export async function getFreights(
  query: FindAllFreightsQuery
): Promise<PaginatedFreightsResponse> {
  const { data } = await apiClient.get("/freights", { params: query });
  return data;
}

// GET /freights/:id
export async function getFreightById(id: string): Promise<Freight> {
  const { data } = await apiClient.get(`/freights/${id}`);
  return data;
}

// POST /freights
export async function createFreight(
  payload: CreateFreightDTO
): Promise<Freight> {
  const { data } = await apiClient.post("/freights", payload);
  return data;
}

// PATCH /freights/:id
export async function updateFreight({
  id,
  payload,
}: {
  id: string;
  payload: UpdateFreightDTO;
}): Promise<Freight> {
  const { data } = await apiClient.patch(`/freights/${id}`, payload);
  return data;
}

// DELETE /freights/:id
export async function deleteFreight(id: string): Promise<void> {
  await apiClient.delete(`/freights/${id}`);
}

// POST /freights/export
export async function exportFreights(
  payload: ExportFreightsPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/freights/export", payload, {
    responseType: "blob",
  });
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useFreightsQuery(query: FindAllFreightsQuery) {
  return useQuery({
    queryKey: [FREIGHTS_QUERY_KEY, query],
    queryFn: () => getFreights(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useFreightQuery(id: string) {
  return useQuery({
    queryKey: [FREIGHTS_QUERY_KEY, id],
    queryFn: () => getFreightById(id),
    enabled: !!id,
  });
}

export function useCreateFreightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFreight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHTS_QUERY_KEY] });
      // IMPORTANTE: Invalida também os impostos pois podem ter sido criados novos
      queryClient.invalidateQueries({ queryKey: ["freight-taxes"] });
    },
  });
}

export function useUpdateFreightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFreight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHTS_QUERY_KEY] });
      // IMPORTANTE: Invalida também os impostos pois podem ter sido atualizados
      queryClient.invalidateQueries({ queryKey: ["freight-taxes"] });
    },
  });
}

export function useDeleteFreightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFreight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHTS_QUERY_KEY] });
    },
  });
}

export function useExportFreightsMutation() {
  return useMutation({
    mutationFn: exportFreights,
  });
}
