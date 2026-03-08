import { fetchApi } from "./client";
import type { ToneCheckResult } from "../types/schema";

export async function checkTone(
  content: string,
): Promise<ToneCheckResult | null> {
  try {
    return await fetchApi<ToneCheckResult>("/api/tone-check", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  } catch {
    return null;
  }
}
