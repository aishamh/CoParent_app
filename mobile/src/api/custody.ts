import { fetchApi } from "./client";
import type {
  CustodySchedule,
  CustodySwapRequest,
  CustodyDay,
  InsertCustodySchedule,
  InsertSwapRequest,
} from "../types/schema";

export async function previewCustodySchedule(
  data: InsertCustodySchedule,
): Promise<CustodyDay[] | null> {
  try {
    return await fetchApi<CustodyDay[]>("/api/custody-schedules/preview", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function createCustodySchedule(
  data: InsertCustodySchedule,
): Promise<CustodySchedule | null> {
  try {
    return await fetchApi<CustodySchedule>("/api/custody-schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function getCustodySchedules(): Promise<CustodySchedule[]> {
  try {
    return await fetchApi<CustodySchedule[]>("/api/custody-schedules");
  } catch {
    return [];
  }
}

export async function deleteCustodySchedule(id: string): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/custody-schedules/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}

export async function createSwapRequest(
  data: InsertSwapRequest,
): Promise<CustodySwapRequest | null> {
  try {
    return await fetchApi<CustodySwapRequest>("/api/custody-swap-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function getSwapRequests(): Promise<CustodySwapRequest[]> {
  try {
    return await fetchApi<CustodySwapRequest[]>("/api/custody-swap-requests");
  } catch {
    return [];
  }
}

export async function respondToSwapRequest(
  id: string,
  status: string,
): Promise<CustodySwapRequest | null> {
  try {
    return await fetchApi<CustodySwapRequest>(
      `/api/custody-swap-requests/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  } catch {
    return null;
  }
}

interface ParentingTimeResult {
  parent_a_days: number;
  parent_b_days: number;
  parent_a_percent: number;
  parent_b_percent: number;
  total_days: number;
  period_start: string;
  period_end: string;
}

export async function getParentingTime(): Promise<ParentingTimeResult | null> {
  try {
    return await fetchApi<ParentingTimeResult>("/api/custody/parenting-time");
  } catch {
    return null;
  }
}
