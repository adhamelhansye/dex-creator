import { PrismaClient } from "@prisma/client";
import { getSecret } from "./secretManager.js";

declare global {
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl(): string | undefined {
  try {
    return getSecret("databaseUrl");
  } catch {
    return undefined;
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

  return new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
