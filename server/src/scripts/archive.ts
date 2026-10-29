// One-off archive run, for an external cron when RUN_JOBS=false.
import { config } from "../config";
import { logger } from "../lib/logger";
import { connectDb, disconnectDb } from "../config/db";
import { archiveOrders } from "../jobs/archive-orders.job";

connectDb(config.mongoUri)
  .then(() => archiveOrders())
  .then((count) => logger.info({ count }, "Archived orders"))
  .catch((err) => {
    logger.error({ err }, "Archive failed");
    process.exitCode = 1;
  })
  .finally(disconnectDb);
