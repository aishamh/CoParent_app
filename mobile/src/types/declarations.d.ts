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
