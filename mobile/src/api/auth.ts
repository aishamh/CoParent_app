import { fetchApi } from "./client";
import type { Profile } from "../types/schema";

interface AuthTokenResponse {
  token: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  role?: string;
}

export async function authLogin(
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  return fetchApi<AuthTokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function authRegister(
  data: RegisterData,
): Promise<AuthTokenResponse> {
  return fetchApi<AuthTokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function authLogout(): Promise<void> {
  try {
    await fetchApi<void>("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout errors - best effort
  }
}

export async function authGetMe(): Promise<Profile | null> {
  try {
    return await fetchApi<Profile>("/api/auth/me");
  } catch {
    return null;
  }
}
