import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";
import { fonts, fontSizes, lineHeights, fontWeights } from "../constants/typography";
import { spacing } from "../constants/spacing";
import { borderRadii, shadows } from "../constants/layout";

export interface ThemeValues extends ThemeContextValue {
  fonts: typeof fonts;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  fontWeights: typeof fontWeights;
  spacing: typeof spacing;
  borderRadii: typeof borderRadii;
  shadows: typeof shadows;
  isDark: boolean;
}

export function useTheme(): ThemeValues {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return {
    ...context,
    fonts,
    fontSizes,
    lineHeights,
    fontWeights,
    spacing,
    borderRadii,
    shadows,
    isDark: context.effectiveTheme === "dark",
  };
}
