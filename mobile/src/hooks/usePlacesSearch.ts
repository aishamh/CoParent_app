import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NearbyActivity {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
  priceLevel: number;
  ageRange: string;
  hours: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  tags: string[];
  website?: string;
  distanceKm: number;
}

interface NearbyPlacesResponse {
  activities: NearbyActivity[];
  total: number;
  center: { latitude: number; longitude: number };
  radiusKm: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NEARBY_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches family-friendly activities near the given coordinates.
 * The query is disabled when lat/lng are null (location not yet obtained).
 */
export function usePlacesSearch(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 30000,
) {
  return useQuery<NearbyPlacesResponse>({
    queryKey: ["places", "nearby", latitude, longitude, radiusMeters],
    queryFn: () =>
      fetchApi<NearbyPlacesResponse>(
        `/api/places/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMeters}`,
      ),
    enabled: latitude !== null && longitude !== null,
    staleTime: NEARBY_STALE_TIME_MS,
  });
}
