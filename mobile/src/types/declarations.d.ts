declare module "react-native-vector-icons/Feather" {
  import { Component } from "react";
  import { TextProps } from "react-native";

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module "react-native-haptic-feedback" {
  type HapticFeedbackType =
    | "impactLight"
    | "impactMedium"
    | "impactHeavy"
    | "rigid"
    | "soft"
    | "notificationSuccess"
    | "notificationWarning"
    | "notificationError"
    | "selection";

  interface HapticOptions {
    enableVibrateFallback?: boolean;
    ignoreAndroidSystemSettings?: boolean;
  }

  const ReactNativeHapticFeedback: {
    trigger(type: HapticFeedbackType, options?: HapticOptions): void;
  };

  export default ReactNativeHapticFeedback;
}

declare module "@react-native-community/geolocation" {
  interface GeoPosition {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  interface GeoError {
    code: number;
    message: string;
    PERMISSION_DENIED: number;
    POSITION_UNAVAILABLE: number;
    TIMEOUT: number;
  }

  interface GeoOptions {
    timeout?: number;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
  }

  const Geolocation: {
    getCurrentPosition(
      success: (position: GeoPosition) => void,
      error?: (error: GeoError) => void,
      options?: GeoOptions
    ): void;
    watchPosition(
      success: (position: GeoPosition) => void,
      error?: (error: GeoError) => void,
      options?: GeoOptions
    ): number;
    clearWatch(watchId: number): void;
    requestAuthorization(): void;
  };

  export default Geolocation;
}
