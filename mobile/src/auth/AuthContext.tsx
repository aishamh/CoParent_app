import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { router } from "expo-router";
import type { Profile } from "../types/schema";
import { authGetMe, authLogin, authLogout, authRegister } from "../api/auth";
import { getToken, setToken, deleteToken } from "./tokenStorage";

interface SignUpData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  role?: string;
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession(): Promise<void> {
    try {
      const token = await getToken();
      if (!token) return;

      const profile = await authGetMe();
      setUser(profile);
    } catch {
      await deleteToken();
    } finally {
      setLoading(false);
    }
  }

  const signIn = useCallback(
    async (username: string, password: string): Promise<void> => {
      const { token } = await authLogin(username, password);
      await setToken(token);

      const profile = await authGetMe();
      setUser(profile);

      router.replace("/(tabs)");
    },
    [],
  );

  const signUp = useCallback(async (data: SignUpData): Promise<void> => {
    const { token } = await authRegister(data);
    await setToken(token);

    const profile = await authGetMe();
    setUser(profile);

    router.replace("/onboarding/welcome");
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authLogout();
    } catch {
      // Ignore logout errors - we clear local state regardless
    }

    await deleteToken();
    setUser(null);

    router.replace("/(auth)/login");
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
