import { config } from "../config";
import { logger } from "./logger";

// Error monitoring (Sentry), off unless SENTRY_DSN is set. The SDK is loaded only then.
type Capture = (err: unknown, context?: Record<string, unknown>) => void;
let capture: Capture | null = null;

export async function initMonitoring() {
  if (!config.sentry.dsn) return;
  const Sentry = await import("@sentry/node");
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    release: config.sentry.release,
    // Errors only, no performance tracing. The SDK doesn't attach cookies or bodies by default.
    tracesSampleRate: 0,
  });
  capture = (err, context) => Sentry.captureException(err, { extra: context });
  logger.info("Error monitoring enabled");
}

// Unexpected errors only (5xx, crashes); 4xx are the client's mistakes.
export function captureError(err: unknown, context?: Record<string, unknown>) {
  capture?.(err, context);
}
