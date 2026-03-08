// ---------------------------------------------------------------------------
// Overpass API service — worldwide venue discovery via OpenStreetMap
//
// Queries the public Overpass API for family-friendly POIs near a given
// coordinate. Results are mapped to our PlaceActivity interface so the
// mobile app can render them alongside curated Norwegian venues.
//
// Key design decisions:
//   • No API key required — uses the free public endpoint
//   • 8-second client timeout — Vercel functions have a 30s limit
//   • In-memory cache (10 min TTL) survives Vercel warm starts
//   • Coordinates rounded to 3 decimals (~111 m) for cache grouping
//   • Graceful degradation — returns [] on any failure
// ---------------------------------------------------------------------------

import type { PlaceActivity } from "../data/activities";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_SECONDS = 20;
const CLIENT_TIMEOUT_MS = 20_000;
const MAX_OSM_RESULTS = 60;

// ---------------------------------------------------------------------------
// App category type (mirrors server/data/activities.ts)
// ---------------------------------------------------------------------------

type AppCategory =
  | "cinema"
  | "amusement"
  | "play"
  | "museum"
  | "outdoor"
  | "sports"
  | "arts"
  | "swimming";

// ---------------------------------------------------------------------------
// OSM tag → app category mapping
// ---------------------------------------------------------------------------

/**
 * Each mapping also tracks whether we should search for ways (buildings/areas).
 * Nodes are fast to query; ways are slower but needed for larger venues like
 * museums, theatres, and theme parks that are mapped as building outlines.
 * We skip way queries for categories with many small features (playgrounds,
 * parks) to keep the Overpass query fast.
 */
interface OsmTagMapping {
  osmKey: string;
  osmValue: string;
  category: AppCategory;
  label: string;
  /** Whether to also search for ways/relations (default: false = node only). */
  includeWays?: boolean;
}

const OSM_TAG_MAPPINGS: OsmTagMapping[] = [
  // Cinema
  { osmKey: "amenity", osmValue: "cinema", category: "cinema", label: "Cinema", includeWays: true },

  // Amusement
  { osmKey: "tourism", osmValue: "theme_park", category: "amusement", label: "Theme Park", includeWays: true },
  { osmKey: "leisure", osmValue: "amusement_arcade", category: "amusement", label: "Arcade" },

  // Play — playgrounds are almost always nodes; skip ways for speed
  { osmKey: "leisure", osmValue: "playground", category: "play", label: "Playground" },

  // Museum
  { osmKey: "tourism", osmValue: "museum", category: "museum", label: "Museum", includeWays: true },
  { osmKey: "tourism", osmValue: "zoo", category: "museum", label: "Zoo", includeWays: true },
  { osmKey: "tourism", osmValue: "aquarium", category: "museum", label: "Aquarium", includeWays: true },

  // Outdoor — skip park ways (too many large polygons) and nature reserves
  { osmKey: "tourism", osmValue: "viewpoint", category: "outdoor", label: "Viewpoint" },
  { osmKey: "leisure", osmValue: "garden", category: "outdoor", label: "Garden" },

  // Sports
  { osmKey: "leisure", osmValue: "sports_centre", category: "sports", label: "Sports Centre", includeWays: true },
  { osmKey: "leisure", osmValue: "ice_rink", category: "sports", label: "Ice Rink" },
  { osmKey: "leisure", osmValue: "bowling_alley", category: "sports", label: "Bowling" },

  // Arts
  { osmKey: "amenity", osmValue: "theatre", category: "arts", label: "Theatre", includeWays: true },
  { osmKey: "amenity", osmValue: "arts_centre", category: "arts", label: "Arts Centre" },
  { osmKey: "amenity", osmValue: "library", category: "arts", label: "Library", includeWays: true },

  // Swimming
  { osmKey: "leisure", osmValue: "swimming_pool", category: "swimming", label: "Swimming Pool" },
  { osmKey: "leisure", osmValue: "water_park", category: "swimming", label: "Water Park", includeWays: true },
];

// ---------------------------------------------------------------------------
// OSM response types
// ---------------------------------------------------------------------------

interface OsmTags {
  name?: string;
  opening_hours?: string;
  website?: string;
  "contact:website"?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:city"?: string;
  "addr:postcode"?: string;
  fee?: string;
  description?: string;
  wheelchair?: string;
  indoor?: string;
  outdoor?: string;
  [key: string]: string | undefined;
}

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: OsmTags;
}

interface OverpassResponse {
  elements: OsmElement[];
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

/**
 * Convert center + radius to a bounding box.
 * Bounding box queries use Overpass spatial indexing and are
 * dramatically faster than `around` queries for large areas.
 */
function radiusToBbox(
  lat: number,
  lng: number,
  radiusMeters: number,
): { south: number; west: number; north: number; east: number } {
  const radiusKm = radiusMeters / 1000;
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  return {
    south: lat - latOffset,
    west: lng - lngOffset,
    north: lat + latOffset,
    east: lng + lngOffset,
  };
}

function buildOverpassQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  categoryFilter?: string,
): string {
  const mappings = categoryFilter
    ? OSM_TAG_MAPPINGS.filter((m) => m.category === categoryFilter)
    : OSM_TAG_MAPPINGS;

  if (mappings.length === 0) return "";

  const { south, west, north, east } = radiusToBbox(lat, lng, radiusMeters);
  const bbox = `${south},${west},${north},${east}`;

  const queries: string[] = [];

  for (const m of mappings) {
    queries.push(
      `  node["${m.osmKey}"="${m.osmValue}"]["name"](${bbox});`,
    );
    if (m.includeWays) {
      queries.push(
        `  way["${m.osmKey}"="${m.osmValue}"]["name"](${bbox});`,
      );
    }
  }

  return `[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
(
${queries.join("\n")}
);
out center body qt ${MAX_OSM_RESULTS};`;
}

// ---------------------------------------------------------------------------
// OSM element → PlaceActivity mapping
// ---------------------------------------------------------------------------

function determineCategory(tags: OsmTags): AppCategory | null {
  for (const mapping of OSM_TAG_MAPPINGS) {
    if (tags[mapping.osmKey] === mapping.osmValue) {
      return mapping.category;
    }
  }
  return null;
}

function determineCategoryLabel(tags: OsmTags): string {
  for (const mapping of OSM_TAG_MAPPINGS) {
    if (tags[mapping.osmKey] === mapping.osmValue) {
      return mapping.label;
    }
  }
  return "Venue";
}

function buildAddress(tags: OsmTags): string {
  const parts: string[] = [];

  if (tags["addr:street"]) {
    const street = tags["addr:housenumber"]
      ? `${tags["addr:street"]} ${tags["addr:housenumber"]}`
      : tags["addr:street"];
    parts.push(street);
  }

  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);

  return parts.length > 0 ? parts.join(", ") : "Address not available";
}

function determinePriceLevel(tags: OsmTags): number {
  if (tags.fee === "no" || tags.fee === "0") return 0;
  if (tags.fee === "yes") return 1;
  return 0;
}

function buildDescription(name: string, categoryLabel: string): string {
  return `${name} — a ${categoryLabel.toLowerCase()} discovered via OpenStreetMap.`;
}

function extractTags(tags: OsmTags, categoryLabel: string): string[] {
  const result: string[] = [categoryLabel];
  if (tags.wheelchair === "yes") result.push("Wheelchair Accessible");
  if (tags.fee === "no") result.push("Free");
  if (tags.indoor === "yes") result.push("Indoor");

  const isOutdoor =
    tags.outdoor === "yes" ||
    tags.leisure === "park" ||
    tags.leisure === "playground" ||
    tags.leisure === "garden" ||
    tags.leisure === "nature_reserve";

  if (isOutdoor) result.push("Outdoor");
  return result;
}

function mapOsmElementToActivity(element: OsmElement): PlaceActivity | null {
  const { tags } = element;
  if (!tags.name) return null;

  const category = determineCategory(tags);
  if (!category) return null;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  const categoryLabel = determineCategoryLabel(tags);

  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    category,
    rating: 0,
    reviewCount: 0,
    description: tags.description ?? buildDescription(tags.name, categoryLabel),
    priceLevel: determinePriceLevel(tags),
    ageRange: "All ages",
    hours: tags.opening_hours ?? "Check venue for hours",
    address: buildAddress(tags),
    city: tags["addr:city"] ?? "",
    latitude: lat,
    longitude: lon,
    tags: extractTags(tags, categoryLabel),
    website: tags.website ?? tags["contact:website"],
    imageUrl: "",
  };
}

// ---------------------------------------------------------------------------
// In-memory cache — survives Vercel warm starts (resets on cold start)
// ---------------------------------------------------------------------------

interface CacheEntry {
  activities: PlaceActivity[];
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const queryCache = new Map<string, CacheEntry>();

function buildCacheKey(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: string,
): string {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  return `${roundedLat},${roundedLng},${radiusMeters},${category ?? "all"}`;
}

function evictExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of queryCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      queryCache.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch family-friendly venues from OpenStreetMap's Overpass API.
 *
 * Returns PlaceActivity[] that can be merged with curated results.
 * On any failure (timeout, rate limit, parse error) returns an empty
 * array so the caller can gracefully fall back to curated data only.
 */
export async function fetchOverpassActivities(
  lat: number,
  lng: number,
  radiusMeters: number,
  categoryFilter?: string,
): Promise<PlaceActivity[]> {
  const cacheKey = buildCacheKey(lat, lng, radiusMeters, categoryFilter);
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.activities;
  }

  const query = buildOverpassQuery(lat, lng, radiusMeters, categoryFilter);
  if (!query) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Overpass API returned status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as OverpassResponse;

    const activities = data.elements
      .map(mapOsmElementToActivity)
      .filter((a): a is PlaceActivity => a !== null);

    // Deduplicate by name within OSM results
    const seen = new Set<string>();
    const unique = activities.filter((a) => {
      const key = a.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    queryCache.set(cacheKey, { activities: unique, timestamp: Date.now() });
    evictExpiredEntries();

    return unique;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Overpass API request timed out");
    } else {
      console.error("Overpass API error:", error);
    }
    return [];
  }
}
