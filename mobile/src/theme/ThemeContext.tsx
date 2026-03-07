import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  lightColors,
  darkColors,
  type ColorPalette,
} from "../constants/colors";

const THEME_STORAGE_KEY = "@coparent/theme-mode";

export type ThemeMode = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  effectiveTheme: EffectiveTheme;
  colors: ColorPalette;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

function resolveEffectiveTheme(
  mode: ThemeMode,
  systemScheme: ColorSchemeName
): EffectiveTheme {
  if (mode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return mode;
}

function selectColorPalette(effectiveTheme: EffectiveTheme): ColorPalette {
  return effectiveTheme === "dark" ? darkColors : lightColors;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? "light"
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPersistedTheme();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "light");
    });
    return () => subscription.remove();
  }, []);

  async function loadPersistedTheme() {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeModeState(stored);
      }
    } catch {
      // Fall back to system default on storage read failure
    } finally {
      setIsLoaded(true);
    }
  }

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // Silently handle storage write failure
    });
  }, []);

  const effectiveTheme = resolveEffectiveTheme(themeMode, systemScheme);
  const colors = selectColorPalette(effectiveTheme);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, setThemeMode, effectiveTheme, colors }),
    [themeMode, setThemeMode, effectiveTheme, colors]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
