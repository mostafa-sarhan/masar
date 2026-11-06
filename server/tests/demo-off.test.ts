import { describe, it, expect } from "vitest";
import request from "supertest";
import { useDb, app } from "./helpers";

useDb();

describe("demo mode off (the default)", () => {
  it("reports it's off and refuses demo logins", async () => {
    expect((await request(app).get("/demo")).body.data).toEqual({ enabled: false });
    expect((await request(app).post("/demo/login").send({ role: "owner" })).status).toBe(404);
  });
});
