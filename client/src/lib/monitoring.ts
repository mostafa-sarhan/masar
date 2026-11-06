// Error monitoring (Sentry), off unless VITE_SENTRY_DSN is set at build time.
// The SDK is a separate chunk, fetched only then; errors before it loads are queued.
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

type Capture = (err: unknown) => void;
let capture: Capture | null = null;
const queue: unknown[] = [];

export function initMonitoring() {
  if (!DSN) return;
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION as string | undefined,
        tracesSampleRate: 0,
      });
      capture = (err) => Sentry.captureException(err);
      queue.splice(0).forEach((err) => capture!(err));
    })
    .catch(() => {});
}

export function captureError(err: unknown) {
  if (!DSN) return;
  if (capture) capture(err);
  else if (queue.length < 20) queue.push(err);
}
