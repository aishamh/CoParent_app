import { fetchApi } from "./client";

interface SubscribeResponse {
  url: string;
}

/** Request a long-lived iCal subscription URL for the family calendar. */
export async function getSubscribeUrl(): Promise<string | null> {
  try {
    const result = await fetchApi<SubscribeResponse>(
      "/api/calendar/subscribe-token",
      { method: "POST" },
    );
    return result?.url ?? null;
  } catch {
    return null;
  }
}
