export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  parentA: string;
  parentB: string;
  amber: string;
}

export const lightColors: ColorPalette = {
  background: "#FDFAF5",
  foreground: "#2D3748",
  card: "#FFFFFF",
  primary: "#0d9488",
  primaryForeground: "#FFFFFF",
  secondary: "#F0E6D6",
  secondaryForeground: "#6B5A3E",
  muted: "#F0F1F3",
  mutedForeground: "#737B8B",
  accent: "#E8F5F3",
  accentForeground: "#1F6B5F",
  destructive: "#CC4444",
  border: "#E2E4E8",
  input: "#E2E4E8",
  ring: "#0d9488",
  parentA: "#6BBF99",
  parentB: "#D98A6B",
  amber: "#f59e0b",
};

export const darkColors: ColorPalette = {
  background: "#1A202C",
  foreground: "#EDF2F7",
  card: "#1E2636",
  primary: "#14B8A6",
  primaryForeground: "#FFFFFF",
  secondary: "#2D3748",
  secondaryForeground: "#E2E8F0",
  muted: "#252D3B",
  mutedForeground: "#A0AEC0",
  accent: "#1A4D42",
  accentForeground: "#B2DFDB",
  destructive: "#E57373",
  border: "#2D3748",
  input: "#2D3748",
  ring: "#14B8A6",
  parentA: "#6BBF99",
  parentB: "#D98A6B",
  amber: "#f59e0b",
};

export interface EventTypeColorMap {
  custody: string;
  holiday: string;
  activity: string;
  travel: string;
  medical: string;
  school: string;
  other: string;
}

export const eventTypeColors: EventTypeColorMap = {
  custody: "#3B82F6",
  holiday: "#F59E0B",
  activity: "#22C55E",
  travel: "#06B6D4",
  medical: "#EF4444",
  school: "#A855F7",
  other: "#6B7280",
};
