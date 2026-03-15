// ============================================================
// OneRoster API Client for Norwegian School Systems
// ============================================================
// Supports: Visma Flyt Skole (OneRoster 1.2), Vigilo (OneRoster 1.1)
// Authentication: OAuth 2.0 Client Credentials Flow via Visma Connect
// ============================================================

import type { SchoolPlatform } from "../../shared/schema";

// ----------------------------------------------------------
// Types — OneRoster Response Shapes
// ----------------------------------------------------------

interface OneRosterUser {
  sourcedId: string;
  status: "active" | "tobedeleted";
  givenName: string;
  familyName: string;
  role: "student" | "teacher" | "parent" | "guardian";
  email?: string;
}

interface OneRosterClass {
  sourcedId: string;
  title: string;
  classCode?: string;
  classType: "homeroom" | "scheduled";
  course?: { sourcedId: string; title?: string };
}

interface OneRosterResult {
  sourcedId: string;
  score: number;
  resultStatus: "exempt" | "fully graded" | "not submitted" | "partially graded";
  comment?: string;
  lineItem: { sourcedId: string };
  student: { sourcedId: string };
}

interface OneRosterLineItem {
  sourcedId: string;
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
  class: { sourcedId: string };
}

// ----------------------------------------------------------
// Platform Configuration
// ----------------------------------------------------------

interface PlatformConfig {
  baseUrl: string;
  tokenUrl: string;
  apiVersion: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  visma_flyt: {
    baseUrl: "https://api.minflyt.no/oneroster/v1p2",
    tokenUrl: "https://connect.visma.com/connect/token",
    apiVersion: "1.2",
  },
  vigilo: {
    baseUrl: "https://api.vigilo.no/oneroster/v1p1",
    tokenUrl: "https://auth.vigilo.no/connect/token",
    apiVersion: "1.1",
  },
};

// ----------------------------------------------------------
// Token Management
// ----------------------------------------------------------

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

async function getAccessToken(
  platform: SchoolPlatform,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = `${platform}:${clientId}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "oneroster",
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

// ----------------------------------------------------------
// API Request Helper
// ----------------------------------------------------------

async function oneRosterRequest<T>(
  platform: SchoolPlatform,
  path: string,
  accessToken: string,
): Promise<T> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const url = `${config.baseUrl}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OneRoster API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

// ----------------------------------------------------------
// Public API
// ----------------------------------------------------------

export async function fetchStudentClasses(
  platform: SchoolPlatform,
  studentId: string,
  accessToken: string,
): Promise<OneRosterClass[]> {
  const result = await oneRosterRequest<{ classes: OneRosterClass[] }>(
    platform,
    `/students/${studentId}/classes`,
    accessToken,
  );
  return result.classes ?? [];
}

export async function fetchStudentResults(
  platform: SchoolPlatform,
  studentId: string,
  accessToken: string,
): Promise<OneRosterResult[]> {
  const result = await oneRosterRequest<{ results: OneRosterResult[] }>(
    platform,
    `/students/${studentId}/results`,
    accessToken,
  );
  return result.results ?? [];
}

export async function fetchClassLineItems(
  platform: SchoolPlatform,
  classId: string,
  accessToken: string,
): Promise<OneRosterLineItem[]> {
  const result = await oneRosterRequest<{ lineItems: OneRosterLineItem[] }>(
    platform,
    `/classes/${classId}/lineItems`,
    accessToken,
  );
  return result.lineItems ?? [];
}

export function isPlatformSupported(platform: string): platform is SchoolPlatform {
  return platform === "visma_flyt" || platform === "itslearning" || platform === "vigilo" || platform === "manual";
}

export { getAccessToken, PLATFORM_CONFIGS };
export type { OneRosterClass, OneRosterResult, OneRosterLineItem, OneRosterUser };
