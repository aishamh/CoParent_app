import * as Keychain from "react-native-keychain";

const SERVICE_NAME = "com.coparent.connect";

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
