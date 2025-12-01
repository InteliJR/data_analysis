// src/api/rawMaterials.ts

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { RawMaterial, RawMaterialChangeLog } from '@/types/rawMaterial';

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface LocationTaxDTO {
  taxId?: string; // preferível quando existir no catálogo
  name?: string;  // alternativa para criar
  rate: number;
  recoverable: boolean;
}

export interface RawMaterialLocationDTO {
  id?: string;
  country?: string;
  stateUf: string;
  city: string;
  acquisitionPrice: number;
  currency: 'BRL' | 'USD' | 'EUR';
  priceConvertedBrl: number;
  additionalCost: number;
  freightIds: string[];
  taxes: LocationTaxDTO[];
}

export interface CreateRawMaterialDTO {
  code: string;
  name: string;
  description?: string;
  measurementUnit: string;
  inputGroup?: string;
  paymentTerm: number;
  locations: RawMaterialLocationDTO[];
}

export interface UpdateRawMaterialDTO extends Partial<CreateRawMaterialDTO> {}

export interface PaginatedRawMaterialsResponse {
  data: RawMaterial[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FindAllRawMaterialsQuery {
  page?: number;
  limit?: number;
  search?: string;
  measurementUnit?: string;
  inputGroup?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExportRawMaterialsPayload {
  format: 'csv';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    search?: string;
    measurementUnit?: string;
    inputGroup?: string;
  };
}

export interface ChangeLogQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedChangeLogsResponse {
  data: RawMaterialChangeLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ========================================
// Funções de API
// ========================================

const RAW_MATERIALS_QUERY_KEY = 'rawMaterials';
const CHANGE_LOGS_QUERY_KEY = 'changeLogs';
const RECENT_CHANGES_QUERY_KEY = 'recentChanges';

// GET /raw-materials
export async function getRawMaterials(
  query: FindAllRawMaterialsQuery,
): Promise<PaginatedRawMaterialsResponse> {
  const { data } = await apiClient.get('/raw-materials', { params: query });
  return data;
}

// GET /raw-materials/:id
export async function getRawMaterialById(id: string): Promise<RawMaterial> {
  const { data } = await apiClient.get(`/raw-materials/${id}`);
  return data;
}

// POST /raw-materials
export async function createRawMaterial(payload: CreateRawMaterialDTO): Promise<RawMaterial> {
  const { data } = await apiClient.post('/raw-materials', payload);
  return data;
}

// PATCH /raw-materials/:id
export async function updateRawMaterial({
  id,
  payload,
}: {
  id: string;
  payload: UpdateRawMaterialDTO;
}): Promise<RawMaterial> {
  const { data } = await apiClient.patch(`/raw-materials/${id}`, payload);
  return data;
}

// DELETE /raw-materials/:id
export async function deleteRawMaterial(id: string): Promise<void> {
  await apiClient.delete(`/raw-materials/${id}`);
}

// POST /raw-materials/export
export async function exportRawMaterials(payload: ExportRawMaterialsPayload): Promise<Blob> {
  const { data } = await apiClient.post('/raw-materials/export', payload, {
    responseType: 'blob',
  });
  return data;
}

// GET /raw-materials/:id/change-logs
export async function getChangeLogsByRawMaterial(
  id: string,
  query: ChangeLogQuery,
): Promise<PaginatedChangeLogsResponse> {
  const { data } = await apiClient.get(`/raw-materials/${id}/change-logs`, { params: query });
  return data;
}

// GET /raw-materials/recent-changes
export async function getRecentChanges(limit: number = 10): Promise<RawMaterialChangeLog[]> {
  const { data } = await apiClient.get('/raw-materials/recent-changes', { params: { limit } });
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useRawMaterialsQuery(query: FindAllRawMaterialsQuery) {
  return useQuery({
    queryKey: [RAW_MATERIALS_QUERY_KEY, query],
    queryFn: () => getRawMaterials(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useRawMaterialQuery(id: string) {
  return useQuery({
    queryKey: [RAW_MATERIALS_QUERY_KEY, id],
    queryFn: () => getRawMaterialById(id),
    enabled: !!id,
  });
}

export function useCreateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAW_MATERIALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECENT_CHANGES_QUERY_KEY] });
    },
  });
}

export function useUpdateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAW_MATERIALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECENT_CHANGES_QUERY_KEY] });
    },
  });
}

export function useDeleteRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAW_MATERIALS_QUERY_KEY] });
    },
  });
}

export function useExportRawMaterialsMutation() {
  return useMutation({
    mutationFn: exportRawMaterials,
  });
}

// Hook para scroll infinito no histórico de mudanças
export function useChangeLogsInfiniteQuery(rawMaterialId: string) {
  return useInfiniteQuery({
    queryKey: [CHANGE_LOGS_QUERY_KEY, rawMaterialId],
    queryFn: ({ pageParam = 1 }) =>
      getChangeLogsByRawMaterial(rawMaterialId, { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasMore) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!rawMaterialId,
  });
}

// Hook para as últimas 10 mudanças
export function useRecentChangesQuery() {
  return useQuery({
    queryKey: [RECENT_CHANGES_QUERY_KEY],
    queryFn: () => getRecentChanges(10),
  });
}