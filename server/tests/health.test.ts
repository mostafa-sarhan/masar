import { describe, it, expect } from "vitest";
import request from "supertest";
import { useDb, app } from "./helpers";
import { setShuttingDown, isShuttingDown } from "../src/lib/lifecycle";
import { captureError } from "../src/lib/monitoring";

useDb();

describe("health and monitoring", () => {
  it("is healthy when the database is up, and never cached", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ok: true, db: "up" });
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("capturing errors is a no-op without SENTRY_DSN", () => {
    expect(() => captureError(new Error("boom"))).not.toThrow();
  });

  it("reports 503 once shutdown starts, so the proxy drains traffic", async () => {
    setShuttingDown();
    expect(isShuttingDown()).toBe(true);
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.data).toMatchObject({ ok: false, shuttingDown: true });
  });
});
