import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { config } from "./config";
import { logger } from "./lib/logger";
import { isDbReady } from "./config/db";
import { errorHandler, notFoundHandler } from "./lib/errors";
import { limits } from "./lib/rate-limit";
import { originCheck } from "./lib/origin-check";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import orderRoutes from "./modules/orders/orders.routes";
import courierRoutes from "./modules/couriers/couriers.routes";
import merchantRoutes from "./modules/merchants/merchants.routes";
import reportRoutes from "./modules/reports/reports.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import courierAppRoutes from "./modules/courier-app/courier-app.routes";
import merchantPortalRoutes from "./modules/merchant-portal/merchant-portal.routes";
import trackingRoutes from "./modules/tracking/tracking.routes";
import importRoutes from "./modules/import/import.routes";
import platformRoutes from "./modules/platform/platform.routes";
import accessRequestRoutes from "./modules/platform/access-requests.routes";

export function createApp() {
  const app = express();

  // Real client IPs behind a reverse proxy (TRUST_PROXY = number of proxies), so limits can't be dodged.
  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers["x-request-id"] as string) || randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  );
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(limits.global);
  app.use(originCheck);

  app.get("/health", (_req, res) => {
    const db = isDbReady();
    res.status(db ? 200 : 503).json({ data: { ok: db, db: db ? "up" : "down" } });
  });

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/orders/import", importRoutes); // before /orders/:id
  app.use("/orders", orderRoutes);
  app.use("/couriers", courierRoutes);
  app.use("/merchants", merchantRoutes);
  app.use("/reports", reportRoutes);
  app.use("/settings", settingsRoutes);
  app.use("/courier", courierAppRoutes);
  app.use("/portal", merchantPortalRoutes);
  app.use("/track", trackingRoutes);
  app.use("/access-requests", accessRequestRoutes);
  app.use("/platform", platformRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
