import { fetchApi } from "./client";
import type { DeviceToken, NotificationPreferences } from "../types/schema";

export async function registerDeviceToken(
  token: string,
  platform?: string,
): Promise<DeviceToken | null> {
  try {
    return await fetchApi<DeviceToken>("/api/device-tokens", {
      method: "POST",
      body: JSON.stringify({ token, platform: platform ?? "ios" }),
    });
  } catch {
    return null;
  }
}

export async function deactivateDeviceToken(token: string): Promise<boolean> {
  try {
    await fetchApi<void>("/api/device-tokens", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    return await fetchApi<NotificationPreferences>(
      "/api/notification-preferences",
    );
  } catch {
    return null;
  }
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> {
  try {
    return await fetchApi<NotificationPreferences>(
      "/api/notification-preferences",
      {
        method: "PATCH",
        body: JSON.stringify(prefs),
      },
    );
  } catch {
    return null;
  }
}
