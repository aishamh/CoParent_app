import * as Sentry from "@sentry/react-native";

const SENTRY_DSN = process.env.SENTRY_DSN || "";

export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not configured — crash reporting disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? "development" : "production",
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    attachScreenshot: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export function identifySentryUser(userId: string, familyId?: string): void {
  Sentry.setUser({ id: userId, familyId });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export { Sentry };
