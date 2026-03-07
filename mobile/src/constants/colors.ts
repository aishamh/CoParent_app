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
  background: "#F8FAFC",
  foreground: "#1E293B",
  card: "#FFFFFF",
  primary: "#0D9488",
  primaryForeground: "#FFFFFF",
  secondary: "#E2E8F0",
  secondaryForeground: "#475569",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  accent: "#ECFDF5",
  accentForeground: "#0F766E",
  destructive: "#DC2626",
  border: "#E2E8F0",
  input: "#E2E8F0",
  ring: "#0D9488",
  parentA: "#5EEAD4",
  parentB: "#FB923C",
  amber: "#F59E0B",
};

export const darkColors: ColorPalette = {
  background: "#0F172A",
  foreground: "#F1F5F9",
  card: "#1E293B",
  primary: "#2DD4BF",
  primaryForeground: "#042F2E",
  secondary: "#334155",
  secondaryForeground: "#E2E8F0",
  muted: "#1E293B",
  mutedForeground: "#94A3B8",
  accent: "#134E4A",
  accentForeground: "#99F6E4",
  destructive: "#F87171",
  border: "#334155",
  input: "#334155",
  ring: "#2DD4BF",
  parentA: "#5EEAD4",
  parentB: "#FB923C",
  amber: "#FBBF24",
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
