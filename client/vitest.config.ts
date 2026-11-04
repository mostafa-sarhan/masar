import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for pure client logic (no DOM needed).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@masar/shared": fileURLToPath(new URL("../shared/src/index.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
