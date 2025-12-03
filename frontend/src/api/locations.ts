import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Location } from "@/types/RawMaterials";

export interface LocationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  stateUf?: string;
  city?: string;
}

export interface PaginatedLocationsResponse {
  data: Location[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateLocationPayload {
  name: string;
  stateUf: string;
  city: string;
  country?: string;
}

export async function getLocations(
  query: LocationsQuery = {}
): Promise<PaginatedLocationsResponse> {
  const { data } = await apiClient.get("/locations", { params: query });
  return data;
}

export async function createLocation(
  payload: CreateLocationPayload
): Promise<Location> {
  const { data } = await apiClient.post("/locations", payload);
  return data;
}

const LOCATIONS_QUERY_KEY = "locations";

export function useLocationsQuery(
  query: LocationsQuery = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [LOCATIONS_QUERY_KEY, query],
    queryFn: () => getLocations(query),
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY_KEY] });
    },
  });
}
