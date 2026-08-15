import { PrismaClient } from "@prisma/client";

/**
 * The site is designed to render before a database exists — sections that
 * depend on real numbers simply don't render (NON-NEGOTIABLE #12: never show
 * fake counts or placeholder logos). `isDbConfigured` is the switch every
 * query helper checks first.
 */
export const isDbConfigured = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0,
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  if (!isDbConfigured) {
    // PrismaClient validates its datasource in the constructor, so building it
    // without a URL throws. Callers must go through safeQuery(), which checks
    // isDbConfigured before ever touching this.
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local, or use safeQuery() so the caller degrades to an empty state.",
    );
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Lazy proxy. Importing this module must never construct a client — several
 * marketing pages import it transitively and have to build with no database
 * configured at all.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const instance = client();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has(_target, property) {
    return property in client();
  },
});

/**
 * Wraps a query so a missing/unreachable database degrades to an empty state
 * instead of a 500. Marketing pages must stay up even if Neon is asleep.
 */
export async function safeQuery<T>(
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isDbConfigured) return fallback;
  try {
    return await run();
  } catch (error) {
    console.error("[db] query failed, falling back to empty state:", error);
    return fallback;
  }
}

/** Throws a clear error instead of a Prisma stack trace on app routes. */
export function assertDb(): void {
  if (!isDbConfigured) {
    throw new Error("This route requires DATABASE_URL to be configured.");
  }
}
