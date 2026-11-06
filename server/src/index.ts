import { config } from "./config";
import { logger } from "./lib/logger";
import { connectDb, disconnectDb } from "./config/db";
import { createApp } from "./app";
import { startArchiveJob } from "./jobs/archive-orders.job";
import { initMonitoring, captureError } from "./lib/monitoring";
import { setShuttingDown } from "./lib/lifecycle";

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled promise rejection");
  captureError(err);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  captureError(err);
  setTimeout(() => process.exit(1), 500).unref(); // let the report go out
});

async function main() {
  await initMonitoring();
  await connectDb(config.mongoUri);
  logger.info("MongoDB connected");

  const job = config.runJobs ? startArchiveJob() : null;
  const server = createApp().listen(config.port, () => logger.info(`Server running on port ${config.port}`));

  // Graceful shutdown: stop taking requests, let in-flight ones finish, then close the DB.
  let closing = false;
  const shutdown = (signal: string) => {
    if (closing) return;
    closing = true;
    // Health turns 503 at once, so the proxy stops sending traffic while requests drain.
    setShuttingDown();
    logger.info(`${signal} received, shutting down`);
    job?.stop();
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Startup failed");
  process.exit(1);
});
