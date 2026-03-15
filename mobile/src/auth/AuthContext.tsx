import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import type { Profile } from "../types/schema";
import { authGetMe, authLogin, authLogout, authRegister } from "../api/auth";
import { setOnUnauthorized } from "../api/client";
import { getToken, setToken, deleteToken } from "./tokenStorage";
import {
  registerDeviceToken,
  deactivateDeviceToken,
} from "../api/notifications";
import { identifySentryUser, clearSentryUser } from "../config/sentry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Push notification helpers
// ---------------------------------------------------------------------------

/**
 * Request push notification permissions and register the device token.
 * Gracefully fails on iOS Simulator (no APNs support) with a console log.
 */
async function requestAndRegisterPushToken(): Promise<string | null> {
  try {
    const permissions = await PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });

    if (!permissions.alert && !permissions.badge && !permissions.sound) {
      console.log("[Push] User denied notification permissions");
      return null;
    }

    // On a real device this returns the APNs token.
    // On simulator this callback is never fired — we rely on the timeout.
    return await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.log("[Push] No device token received (likely simulator)");
        resolve(null);
      }, 5000);

      PushNotificationIOS.addEventListener("register", (deviceToken) => {
        clearTimeout(timeout);
        resolve(deviceToken);
      });

      PushNotificationIOS.addEventListener(
        "registrationError",
        (error) => {
          clearTimeout(timeout);
          console.log("[Push] Registration error:", error.message);
          resolve(null);
        },
      );
    });
  } catch (error) {
    console.log("[Push] Failed to request permissions:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  // Clear user state when any API call returns 401 (session expired)
  useEffect(() => {
    setOnUnauthorized(() => setUser(null));
    return () => setOnUnauthorized(null);
  }, []);

  /** Attempt to register for push notifications after authentication. */
  async function registerPushNotifications(): Promise<void> {
    try {
      const deviceToken = await requestAndRegisterPushToken();
      if (deviceToken) {
        pushTokenRef.current = deviceToken;
        await registerDeviceToken(deviceToken, "ios");
        console.log("[Push] Device token registered with server");
      }
    } catch (error) {
      // Non-fatal — push notifications are a nice-to-have
      console.log("[Push] Registration failed (non-fatal):", error);
    }
  }

  /** Deactivate the push token on logout. */
  async function deactivatePushToken(): Promise<void> {
    const token = pushTokenRef.current;
    if (!token) return;

    try {
      await deactivateDeviceToken(token);
      pushTokenRef.current = null;
      console.log("[Push] Device token deactivated");
    } catch {
      // Non-fatal — server will clean up stale tokens eventually
    }
  }

  async function restoreSession(): Promise<void> {
    try {
      const token = await getToken();
      if (!token) return;

      const profile = await authGetMe();
      setUser(profile);
      if (profile) identifySentryUser(profile.id, profile.family_id ?? undefined);

      // Register for push after restoring an existing session
      registerPushNotifications();
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
      if (profile) identifySentryUser(profile.id, profile.family_id ?? undefined);

      // Register for push after login
      registerPushNotifications();
    },
    [],
  );

  const signUp = useCallback(async (data: SignUpData): Promise<void> => {
    const { token } = await authRegister(data);
    await setToken(token);

    const profile = await authGetMe();
    setUser(profile);
    if (profile) identifySentryUser(profile.id, profile.family_id ?? undefined);

    // Register for push after signup
    registerPushNotifications();
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    // Deactivate push token before clearing session
    await deactivatePushToken();

    try {
      await authLogout();
    } catch {
      // Ignore logout errors — clear local state regardless
    }

    await deleteToken();
    setUser(null);
    clearSentryUser();
    // Navigation handled by RootNavigator reacting to user=null
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
