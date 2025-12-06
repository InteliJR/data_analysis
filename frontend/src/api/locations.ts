import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Location } from "@/types/RawMaterials";

const MAX_LOCATIONS_PAGE_SIZE = 100;

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
  const sanitizedQuery: LocationsQuery = {
    ...query,
    ...(query.limit
      ? { limit: Math.min(query.limit, MAX_LOCATIONS_PAGE_SIZE) }
      : {}),
  };

  const { data } = await apiClient.get("/locations", {
    params: sanitizedQuery,
  });
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
