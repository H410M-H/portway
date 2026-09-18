import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (!_prisma) {
    const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
    _prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prisma;
    }
  }
  return _prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

