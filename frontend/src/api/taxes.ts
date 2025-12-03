// src/api/taxes.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { FreightTax, RawMaterialTax } from "@/types/taxes";

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface CreateFreightTaxDTO {
  name: string;
  rate: number;
  freightIds?: string[]; // Array para múltiplos fretes
}

export interface UpdateFreightTaxDTO extends Partial<CreateFreightTaxDTO> {}

export interface CreateRawMaterialTaxDTO {
  name: string;
  rate: number;
  recoverable: boolean;
  rawMaterialIds?: string[]; // Array para múltiplas matérias-primas
}

export interface UpdateRawMaterialTaxDTO
  extends Partial<CreateRawMaterialTaxDTO> {}

export interface PaginatedTaxesResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FindAllTaxesQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ExportTaxesPayload {
  format: "csv";
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: {
    search?: string;
  };
}

// ========================================
// Funções de API - Freight Taxes
// ========================================

const FREIGHT_TAXES_QUERY_KEY = "freight-taxes";

export async function getFreightTaxes(
  query: FindAllTaxesQuery
): Promise<PaginatedTaxesResponse<FreightTax>> {
  const { data } = await apiClient.get("/taxes/freight", { params: query });
  return data;
}

export async function getFreightTaxById(id: string): Promise<FreightTax> {
  const { data } = await apiClient.get(`/taxes/freight/${id}`);
  return data;
}

export async function createFreightTax(
  payload: CreateFreightTaxDTO
): Promise<FreightTax> {
  const { data } = await apiClient.post("/taxes/freight", payload);
  return data;
}

export async function updateFreightTax({
  id,
  payload,
}: {
  id: string;
  payload: UpdateFreightTaxDTO;
}): Promise<FreightTax> {
  const { data } = await apiClient.patch(`/taxes/freight/${id}`, payload);
  return data;
}

export async function deleteFreightTax(id: string): Promise<void> {
  await apiClient.delete(`/taxes/freight/${id}`);
}

export async function exportFreightTaxes(
  payload: ExportTaxesPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/taxes/freight/export", payload, {
    responseType: "blob",
  });
  return data;
}

// ========================================
// Funções de API - Raw Material Taxes
// ========================================

const RAW_MATERIAL_TAXES_QUERY_KEY = "raw-material-taxes";

export async function getRawMaterialTaxes(
  query: FindAllTaxesQuery
): Promise<PaginatedTaxesResponse<RawMaterialTax>> {
  const { data } = await apiClient.get("/taxes/raw-material", {
    params: query,
  });
  return data;
}

export async function getRawMaterialTaxById(
  id: string
): Promise<RawMaterialTax> {
  const { data } = await apiClient.get(`/taxes/raw-material/${id}`);
  return data;
}

export async function createRawMaterialTax(
  payload: CreateRawMaterialTaxDTO
): Promise<RawMaterialTax> {
  const { data } = await apiClient.post("/taxes/raw-material", payload);
  return data;
}

export async function updateRawMaterialTax({
  id,
  payload,
}: {
  id: string;
  payload: UpdateRawMaterialTaxDTO;
}): Promise<RawMaterialTax> {
  const { data } = await apiClient.patch(`/taxes/raw-material/${id}`, payload);
  return data;
}

export async function deleteRawMaterialTax(id: string): Promise<void> {
  await apiClient.delete(`/taxes/raw-material/${id}`);
}

export async function exportRawMaterialTaxes(
  payload: ExportTaxesPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/taxes/raw-material/export", payload, {
    responseType: "blob",
  });
  return data;
}

// ========================================
// Hooks do React Query - Freight Taxes
// ========================================

export function useFreightTaxesQuery(query: FindAllTaxesQuery) {
  return useQuery({
    queryKey: [FREIGHT_TAXES_QUERY_KEY, query],
    queryFn: () => getFreightTaxes(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useFreightTaxQuery(id: string) {
  return useQuery({
    queryKey: [FREIGHT_TAXES_QUERY_KEY, id],
    queryFn: () => getFreightTaxById(id),
    enabled: !!id,
  });
}

export function useCreateFreightTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFreightTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHT_TAXES_QUERY_KEY] });
    },
  });
}

export function useUpdateFreightTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFreightTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHT_TAXES_QUERY_KEY] });
    },
  });
}

export function useDeleteFreightTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFreightTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FREIGHT_TAXES_QUERY_KEY] });
    },
  });
}

export function useExportFreightTaxesMutation() {
  return useMutation({
    mutationFn: exportFreightTaxes,
  });
}

// ========================================
// Hooks do React Query - Raw Material Taxes
// ========================================

export function useRawMaterialTaxesQuery(query: FindAllTaxesQuery) {
  return useQuery({
    queryKey: [RAW_MATERIAL_TAXES_QUERY_KEY, query],
    queryFn: () => getRawMaterialTaxes(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useRawMaterialTaxQuery(id: string) {
  return useQuery({
    queryKey: [RAW_MATERIAL_TAXES_QUERY_KEY, id],
    queryFn: () => getRawMaterialTaxById(id),
    enabled: !!id,
  });
}

export function useCreateRawMaterialTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterialTax,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [RAW_MATERIAL_TAXES_QUERY_KEY],
      });
    },
  });
}

export function useUpdateRawMaterialTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRawMaterialTax,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [RAW_MATERIAL_TAXES_QUERY_KEY],
      });
    },
  });
}

export function useDeleteRawMaterialTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRawMaterialTax,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [RAW_MATERIAL_TAXES_QUERY_KEY],
      });
    },
  });
}

export function useExportRawMaterialTaxesMutation() {
  return useMutation({
    mutationFn: exportRawMaterialTaxes,
  });
}
