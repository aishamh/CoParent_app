import { fetchApi } from "./client";
import type { Family, Profile } from "../types/schema";

export interface JoinFamilyResponse {
  family: Family;
  user: Record<string, unknown>;
}

/** Fetch all members of the current user's family (sanitized profiles). */
export async function getFamilyMembers(): Promise<Profile[]> {
  try {
    return await fetchApi<Profile[]>("/api/family/members");
  } catch {
    return [];
  }
}

export async function getFamily(): Promise<Family | null> {
  try {
    return await fetchApi<Family>("/api/family");
  } catch {
    return null;
  }
}

export async function joinFamily(inviteCode: string): Promise<JoinFamilyResponse> {
  return fetchApi<JoinFamilyResponse>("/api/family/join", {
    method: "POST",
    body: JSON.stringify({ invite_code: inviteCode }),
  });
}

export async function getFamilyInviteCode(): Promise<string | null> {
  try {
    const family = await fetchApi<Family>("/api/family");
    return family?.invite_code ?? null;
  } catch {
    return null;
  }
}
