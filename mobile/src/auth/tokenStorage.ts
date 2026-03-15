import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVICE_NAME = "com.coparent.connect";
const BIOMETRIC_KEY = "@coparent/biometric-enabled";

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;

  try {
    const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
    if (credentials) {
      cachedToken = credentials.password;
      return cachedToken;
    }
  } catch {
    // Keychain read failure — treat as no token
  }

  return null;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await Keychain.setGenericPassword("jwt", token, { service: SERVICE_NAME });
}

export async function deleteToken(): Promise<void> {
  cachedToken = null;
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
}

export function getCachedToken(): string | null {
  return cachedToken;
}

export async function getSupportedBiometry(): Promise<string | null> {
  const biometryType = await Keychain.getSupportedBiometryType();
  return biometryType ?? null;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return value === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, String(enabled));
}

export async function setTokenWithBiometrics(token: string): Promise<void> {
  cachedToken = token;
  await Keychain.setGenericPassword("jwt", token, {
    service: SERVICE_NAME,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

export async function getTokenWithBiometrics(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
      authenticationPrompt: { title: "Unlock CoParent Connect" },
    });
    if (credentials) {
      cachedToken = credentials.password;
      return cachedToken;
    }
  } catch {
    // Biometric failed or cancelled
  }
  return null;
}
