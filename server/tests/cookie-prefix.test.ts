import { describe, it, expect, vi } from "vitest";

// The API served under /api on the app's origin (production behind nginx).
vi.hoisted(() => {
  Object.assign(process.env, { COOKIE_PATH_PREFIX: "/api" });
});

import request from "supertest";
import { useDb, app, createUser, PASSWORD } from "./helpers";
import { PlatformAdmin } from "../src/modules/platform/platform-admin.model";
import { hashPassword } from "../src/modules/auth/password";

useDb();

const cookie = (res: request.Response, name: string) => (res.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith(`${name}=`)) ?? "";

describe("cookie paths under /api", () => {
  it("tenant cookies are scoped to /api and /api/auth", async () => {
    await createUser("admin", "a@test.com");
    const res = await request(app).post("/auth/login").send({ email: "a@test.com", password: PASSWORD });
    expect(res.status).toBe(200);
    expect(cookie(res, "access_token")).toMatch(/Path=\/api;/);
    expect(cookie(res, "refresh_token")).toMatch(/Path=\/api\/auth;/);
    expect(cookie(res, "access_token")).toMatch(/HttpOnly/);
    expect(cookie(res, "access_token")).toMatch(/SameSite=Strict/);
  });

  it("platform cookies are scoped to /api/platform", async () => {
    await PlatformAdmin.create({ email: "root@platform.test", password: await hashPassword(PASSWORD), mustChangePassword: false });
    const res = await request(app).post("/platform/auth/login").send({ email: "root@platform.test", password: PASSWORD });
    expect(res.status).toBe(200);
    expect(cookie(res, "platform_access")).toMatch(/Path=\/api\/platform;/);
    expect(cookie(res, "platform_refresh")).toMatch(/Path=\/api\/platform\/auth;/);
  });
});
