import { describe, expect, it, vi } from "vitest";
import { legacyHashPath, redirectLegacyHash } from "./legacy-hash";

describe("legacy hash links", () => {
  it("maps #/ paths, keeping the query", () => {
    expect(legacyHashPath("#/orders?status=pending")).toBe("/orders?status=pending");
    expect(legacyHashPath("#/track/ABC")).toBe("/track/ABC");
  });

  it("leaves in-page anchors and empty hashes alone", () => {
    expect(legacyHashPath("#request")).toBeNull();
    expect(legacyHashPath("")).toBeNull();
  });

  it("rewrites the address bar only for old links", () => {
    const replaceState = vi.fn();
    redirectLegacyHash({ hash: "#/reports?tab=couriers" } as Location, { state: null, replaceState } as unknown as History);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/reports?tab=couriers");
    replaceState.mockClear();
    redirectLegacyHash({ hash: "#plans" } as Location, { state: null, replaceState } as unknown as History);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
