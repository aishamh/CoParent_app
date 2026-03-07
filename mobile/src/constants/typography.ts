export const fonts = {
  body: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  heading: {
    bold: "System",
    extraBold: "System",
  },
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 40,
} as const;

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
};

export type FontSizeKey = keyof typeof fontSizes;
export type LineHeightKey = keyof typeof lineHeights;
export type FontWeightKey = keyof typeof fontWeights;
