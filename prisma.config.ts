import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma 6 stops auto-loading .env files as soon as this config exists, so the
 * CLI (db push / migrate / seed / studio) sees no DATABASE_URL unless we load
 * it ourselves. Next.js loads .env.local on its own, which is why the app works
 * while the CLI would otherwise fail.
 *
 * Same precedence Next uses: .env.local wins over .env.
 */
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
