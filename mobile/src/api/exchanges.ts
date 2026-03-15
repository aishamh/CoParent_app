import { fetchApi } from "./client";
import type { ExchangeRecord } from "../types/schema";

export async function getExchangeRecords(
  from?: string,
  to?: string,
): Promise<ExchangeRecord[]> {
  try {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const url = `/api/exchanges${query ? `?${query}` : ""}`;
    return await fetchApi<ExchangeRecord[]>(url);
  } catch {
    return [];
  }
}

interface CreateExchangeData {
  type: "dropoff" | "pickup";
  from_parent: string;
  to_parent: string;
  children: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  timestamp: string;
  status: "ontime" | "late" | "missed";
  notes?: string;
  photo_url?: string;
}

export async function createExchangeRecord(
  data: CreateExchangeData,
): Promise<ExchangeRecord | null> {
  try {
    return await fetchApi<ExchangeRecord>("/api/exchanges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}
