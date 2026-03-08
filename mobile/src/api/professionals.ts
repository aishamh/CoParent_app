import { fetchApi } from "./client";
import type { ProfessionalInvite, ProfessionalAccess } from "../types/schema";

export async function createProfessionalInvite(
  role: string,
  email?: string,
): Promise<ProfessionalInvite | null> {
  try {
    return await fetchApi<ProfessionalInvite>("/api/professional-invites", {
      method: "POST",
      body: JSON.stringify({ role, email: email ?? null }),
    });
  } catch {
    return null;
  }
}

export async function getProfessionalInvites(): Promise<ProfessionalInvite[]> {
  try {
    return await fetchApi<ProfessionalInvite[]>("/api/professional-invites");
  } catch {
    return [];
  }
}

export async function revokeProfessionalInvite(
  id: string,
): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/professional-invites/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}

export async function acceptProfessionalInvite(
  inviteCode: string,
): Promise<ProfessionalAccess | null> {
  try {
    return await fetchApi<ProfessionalAccess>(
      "/api/professional-invites/accept",
      {
        method: "POST",
        body: JSON.stringify({ invite_code: inviteCode }),
      },
    );
  } catch {
    return null;
  }
}

export async function getFamilyProfessionals(): Promise<ProfessionalAccess[]> {
  try {
    return await fetchApi<ProfessionalAccess[]>("/api/family/professionals");
  } catch {
    return [];
  }
}

export async function updateProfessionalAccess(
  id: string,
  permissions: Record<string, boolean>,
): Promise<ProfessionalAccess | null> {
  try {
    return await fetchApi<ProfessionalAccess>(
      `/api/professional-access/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(permissions),
      },
    );
  } catch {
    return null;
  }
}

export async function revokeProfessionalAccess(
  id: string,
): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/professional-access/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}
