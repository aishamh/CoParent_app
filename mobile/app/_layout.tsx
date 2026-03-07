import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { queryClient } from "../src/api/queryClient";
import { AuthProvider } from "../src/auth/AuthContext";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { ErrorBoundary } from "../src/components/shared/ErrorBoundary";
import { useTheme } from "../src/theme/useTheme";

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { effectiveTheme } = useTheme();
  return <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <ThemedStatusBar />
            <Slot />
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
