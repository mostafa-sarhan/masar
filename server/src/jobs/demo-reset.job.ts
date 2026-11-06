import cron from "node-cron";
import { config } from "../config";
import { logger } from "../lib/logger";
import { ensureDemo, resetDemo } from "../modules/demo/demo.service";

// Demo mode: seed the demo company on start (if missing), then reset it every DEMO_RESET_MINUTES.
export function startDemoResetJob() {
  ensureDemo().catch((err) => logger.error({ err }, "Demo seed failed"));
  const minutes = Math.max(5, config.demo.resetMinutes);
  const expression = minutes % 60 === 0 ? `0 */${minutes / 60} * * *` : `*/${minutes} * * * *`;
  return cron.schedule(expression, () => {
    resetDemo().catch((err) => logger.error({ err }, "Demo reset failed"));
  });
}
