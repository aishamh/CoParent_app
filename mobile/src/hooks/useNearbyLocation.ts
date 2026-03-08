import { useState, useCallback, useRef } from "react";
import { Alert, Platform, Linking } from "react-native";
import Geolocation from "@react-native-community/geolocation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

interface NearbyLocationState {
  userLocation: UserCoordinates | null;
  isLocating: boolean;
  locationError: string | null;
}

interface UseNearbyLocationReturn extends NearbyLocationState {
  requestLocation: () => void;
  clearLocation: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOLOCATION_TIMEOUT_MS = 15_000;
const MAXIMUM_AGE_MS = 60_000;

// ---------------------------------------------------------------------------
// Error handling helpers
// ---------------------------------------------------------------------------

function showPermissionDeniedAlert(): void {
  Alert.alert(
    "Location Permission Required",
    "Please enable location access in Settings to find activities near you.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open Settings",
        onPress: () => {
          if (Platform.OS === "ios") {
            Linking.openURL("app-settings:");
          }
        },
      },
    ],
  );
}

function showLocationUnavailableAlert(): void {
  Alert.alert(
    "Location Unavailable",
    "We could not determine your location. Please check that location services are enabled and try again.",
  );
}

function showTimeoutAlert(): void {
  Alert.alert(
    "Location Timeout",
    "Getting your location took too long. Please try again in an area with better signal.",
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages user geolocation for the "Near Me" feature.
 * Handles permission requests, error states, and cleanup.
 */
export function useNearbyLocation(): UseNearbyLocationReturn {
  const [state, setState] = useState<NearbyLocationState>({
    userLocation: null,
    isLocating: false,
    locationError: null,
  });

  const isMountedRef = useRef(true);

  const requestLocation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLocating: true,
      locationError: null,
    }));

    Geolocation.requestAuthorization();

    Geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setState({
          userLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isLocating: false,
          locationError: null,
        });
      },
      (error) => {
        if (!isMountedRef.current) return;
        const errorMessage = error.message ?? "Unknown location error";

        setState({
          userLocation: null,
          isLocating: false,
          locationError: errorMessage,
        });

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            showPermissionDeniedAlert();
            break;
          case 2: // POSITION_UNAVAILABLE
            showLocationUnavailableAlert();
            break;
          case 3: // TIMEOUT
            showTimeoutAlert();
            break;
          default:
            showLocationUnavailableAlert();
        }
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: MAXIMUM_AGE_MS,
      },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      userLocation: null,
      isLocating: false,
      locationError: null,
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
}
