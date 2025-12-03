// src/api/fixedCosts.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  FixedCost,
  FixedCostFormData,
  FixedCostsListResponse,
  ExportFixedCostsPayload,
  FindAllFixedCostsQuery,
} from "@/types/fixed_costs";

const FIXED_COSTS_QUERY_KEY = "fixed-costs";

// ========================================
// Funções de API
// ========================================

// GET /fixed-costs
export async function getFixedCosts(
  query: FindAllFixedCostsQuery
): Promise<FixedCostsListResponse> {
  const { data } = await apiClient.get("/fixed-costs", { params: query });
  return data;
}

// GET /fixed-costs/:id
export async function getFixedCostById(id: string): Promise<FixedCost> {
  const { data } = await apiClient.get(`/fixed-costs/${id}`);
  return data;
}

// POST /fixed-costs
export async function createFixedCost(
  payload: FixedCostFormData
): Promise<FixedCost> {
  const { data } = await apiClient.post("/fixed-costs", payload);
  return data;
}

// PATCH /fixed-costs/:id
export async function updateFixedCost({
  id,
  payload,
}: {
  id: string;
  payload: Partial<FixedCostFormData>;
}): Promise<FixedCost> {
  const { data } = await apiClient.patch(`/fixed-costs/${id}`, payload);
  return data;
}

// DELETE /fixed-costs/:id
export async function deleteFixedCost(id: string): Promise<void> {
  await apiClient.delete(`/fixed-costs/${id}`);
}

// POST /fixed-costs/export
export async function exportFixedCosts(
  payload: ExportFixedCostsPayload
): Promise<Blob> {
  const { data } = await apiClient.post("/fixed-costs/export", payload, {
    responseType: "blob",
  });
  return data;
}

// POST /fixed-costs/:id/calculate-overhead
export async function calculateOverhead({
  id,
  applyToProducts,
  productIds,
}: {
  id: string;
  applyToProducts: boolean;
  productIds?: string[];
}) {
  const { data } = await apiClient.post(
    `/fixed-costs/${id}/calculate-overhead`,
    {
      applyToProducts,
      productIds,
    }
  );
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useFixedCostsQuery(query: FindAllFixedCostsQuery) {
  return useQuery({
    queryKey: [FIXED_COSTS_QUERY_KEY, query],
    queryFn: () => getFixedCosts(query),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData, 
  });
}

export function useFixedCostByIdQuery(id: string | null) {
  return useQuery({
    queryKey: [FIXED_COSTS_QUERY_KEY, id],
    queryFn: () => getFixedCostById(id!),
    enabled: !!id,
  });
}

export function useCreateFixedCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFixedCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_COSTS_QUERY_KEY] });
    },
  });
}

export function useUpdateFixedCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFixedCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_COSTS_QUERY_KEY] });
    },
  });
}

export function useDeleteFixedCostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFixedCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_COSTS_QUERY_KEY] });
    },
  });
}

export function useExportFixedCostsMutation() {
  return useMutation({
    mutationFn: exportFixedCosts,
  });
}

export function useCalculateOverheadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calculateOverhead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_COSTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
