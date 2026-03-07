import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { useTheme, type ThemeValues } from "./useTheme";

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function createStyles<T extends NamedStyles<T>>(
  factory: (theme: ThemeValues) => T
) {
  return function useStyles(): T {
    const theme = useTheme();

    return useMemo(
      () => StyleSheet.create(factory(theme)),
      [
        theme.effectiveTheme,
        theme.colors,
      ]
    );
  };
}
