/**
 * Haversine formula for calculating the great-circle distance
 * between two points on the Earth's surface.
 */

const EARTH_RADIUS_KM = 6371;

interface Coordinate {
  latitude: number;
  longitude: number;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the distance in kilometers between two geographic
 * coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  from: Coordinate,
  to: Coordinate,
): number {
  const deltaLatitude = degreesToRadians(to.latitude - from.latitude);
  const deltaLongitude = degreesToRadians(to.longitude - from.longitude);

  const fromLatRadians = degreesToRadians(from.latitude);
  const toLatRadians = degreesToRadians(to.latitude);

  const haversineAngle =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatRadians) *
      Math.cos(toLatRadians) *
      Math.sin(deltaLongitude / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineAngle), Math.sqrt(1 - haversineAngle));

  return EARTH_RADIUS_KM * centralAngle;
}

/**
 * Formats a distance in km to a human-readable string.
 * Under 1 km shows meters; otherwise shows km with one decimal.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
