import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Several modules under test are marked `server-only`, which throws when
    // imported outside a React Server Component. The alias below swaps it for
    // a no-op so the pure logic inside those files stays testable.
    alias: {
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
