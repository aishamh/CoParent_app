import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import type { Profile } from "@shared/schema";
import { authLogin, authRegister, authLogout, authGetMe, setAuthToken, getAuthToken } from "@/lib/api";

interface AuthError {
  message: string;
  name: string;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { username?: string; role?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const profile = await authGetMe();
    if (profile) {
      setUser(profile);
    } else {
      setAuthToken(null);
    }
    setLoading(false);
  }

  const signIn = async (username: string, password: string) => {
    try {
      const result = await authLogin(username, password);
      setAuthToken(result.token);
      const profile = await authGetMe();
      setUser(profile);
      navigate("/dashboard");
      return { error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Login failed";
      return { error: { message, name: "LoginError" } };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { username?: string; role?: string }
  ) => {
    try {
      const result = await authRegister({
        username: metadata?.username || email.split("@")[0],
        email,
        password,
        display_name: metadata?.username || email.split("@")[0],
        role: metadata?.role || "parent_a",
      });
      setAuthToken(result.token);
      const profile = await authGetMe();
      setUser(profile);
      navigate("/dashboard");
      return { error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Registration failed";
      return { error: { message, name: "SignUpError" } };
    }
  };

  const signOut = async () => {
    await authLogout();
    setUser(null);
    navigate("/login");
  };

  const resetPassword = async (_email: string) => {
    // Not available with custom JWT auth — would need email service
    return {
      error: {
        message: "Password reset is not yet available. Please contact support.",
        name: "NotImplemented",
      },
    };
  };

  const updatePassword = async (_newPassword: string) => {
    // Would need a dedicated endpoint
    return {
      error: {
        message: "Password update is not yet available.",
        name: "NotImplemented",
      },
    };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
