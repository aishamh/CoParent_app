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
import {
  getToken,
  setToken,
  deleteToken,
  getSupportedBiometry,
  isBiometricEnabled,
  setBiometricEnabled,
  getTokenWithBiometrics,
  setTokenWithBiometrics,
} from "./tokenStorage";
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
  biometryType: string | null;
  biometricEnabled: boolean;
  toggleBiometric: () => Promise<void>;
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
 * Request push notification permissions and register device token.
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

    // On a real device this returns to APNs token.
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
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const pushTokenRef = useRef<string | null>(null);

  // Detect available biometry on mount
  useEffect(() => {
    (async () => {
      const biometry = await getSupportedBiometry();
      setBiometryType(biometry);
      const enabled = await isBiometricEnabled();
      setBiometricEnabledState(enabled);
    })();
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

  /** Toggle biometric authentication on/off */
  const toggleBiometric = useCallback(async (): Promise<void> => {
    try {
      const current = await isBiometricEnabled();
      const newValue = !current;
      await setBiometricEnabled(newValue);
      setBiometricEnabledState(newValue);

      // If enabling, prompt user to authenticate to verify
      if (newValue && biometryType) {
        const token = await getToken();
        if (token) {
          await setTokenWithBiometrics(token);
        }
      }
    } catch (error) {
      console.log("[Auth] Failed to toggle biometric:", error);
    }
  }, [biometryType]);

  async function restoreSession(): Promise<void> {
    try {
      const biometricAllowed = await isBiometricEnabled();
      const biometry = await getSupportedBiometry();

      let token: string | null = null;

      // If biometric is enabled and supported, prompt for biometric auth
      if (biometricAllowed && biometry) {
        token = await getTokenWithBiometrics();
        console.log("[Auth] Restored session with biometric authentication");
      }

      // Fall back to regular token retrieval
      if (!token) {
        token = await getToken();
      }

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

      // Check if biometric is available after successful login
      const biometry = await getSupportedBiometry();
      if (biometry) {
        setBiometryType(biometry);
      }

      // Store token with biometric prompt if enabled
      const biometricAllowed = await isBiometricEnabled();
      if (biometricAllowed) {
        await setTokenWithBiometrics(token);
      } else {
        await setToken(token);
      }

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

    // Check if biometric is available after successful signup
    const biometry = await getSupportedBiometry();
    if (biometry) {
      setBiometryType(biometry);
    }

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
    biometryType,
    biometricEnabled,
    toggleBiometric,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
