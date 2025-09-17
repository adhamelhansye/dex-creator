import { PrismaClient } from "@prisma/client";
import { getSecret } from "./secretManager.js";

declare global {
  var prisma: PrismaClient | undefined;
}

async function createPrismaClient(): Promise<PrismaClient> {
  const databaseUrl = await getSecret("databaseUrl");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL not available from secret manager");
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

let _prisma: PrismaClient | null = null;

async function initializePrisma(): Promise<PrismaClient> {
  if (_prisma) {
    return _prisma;
  }

  _prisma = await createPrismaClient();
  global.prisma = _prisma;
  return _prisma;
}

export { initializePrisma };

export async function getPrisma(): Promise<PrismaClient> {
  if (!_prisma) {
    await initializePrisma();
  }
  return _prisma!;
}
