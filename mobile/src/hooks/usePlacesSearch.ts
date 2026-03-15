import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
  imageUrl?: string;
  distanceKm: number;
  /** Where this venue came from — "curated" for premium Norwegian venues, "openstreetmap" for global OSM data. */
  source?: "curated" | "openstreetmap";
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

const STALE_TIME_MS = 30 * 60 * 1000; // 30 minutes — venues rarely change
const GC_TIME_MS = 60 * 60 * 1000; // Keep unused data for 1 hour

/**
 * Round coordinates to ~1.1 km grid so slight location shifts reuse cache.
 */
function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches family-friendly activities near the given coordinates.
 * Optimized for speed:
 *   - Coordinates rounded to ~1 km grid for broader cache hits
 *   - 30-minute stale time (venues don't move)
 *   - keepPreviousData avoids blank screens while refetching
 */
export function usePlacesSearch(
  latitude: number | null,
  longitude: number | null,
  radiusMeters: number = 30000,
) {
  const roundedLat = latitude !== null ? roundCoord(latitude) : null;
  const roundedLng = longitude !== null ? roundCoord(longitude) : null;

  return useQuery<NearbyPlacesResponse>({
    queryKey: ["places", "nearby", roundedLat, roundedLng, radiusMeters],
    queryFn: () =>
      fetchApi<NearbyPlacesResponse>(
        `/api/places/nearby?lat=${roundedLat}&lng=${roundedLng}&radius=${radiusMeters}`,
      ),
    enabled: roundedLat !== null && roundedLng !== null,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
