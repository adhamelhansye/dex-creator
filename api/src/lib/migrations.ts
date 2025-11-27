import { execSync } from "node:child_process";
import { getSecret } from "./secretManager.js";
import { PrismaClient } from "@prisma/client";

async function resolveFailedMigrations(): Promise<void> {
  const databaseUrl = await getSecret("databaseUrl");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not available from secret manager");
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    const failedMigrations = await prisma.$queryRaw<
      Array<{ migration_name: string }>
    >`
      SELECT migration_name 
      FROM _prisma_migrations 
      WHERE finished_at IS NULL 
      AND rolled_back_at IS NULL
    `;

    if (failedMigrations.length > 0) {
      console.log(
        `⚠️ Found ${failedMigrations.length} failed migration(s), attempting to resolve...`
      );

      const env = {
        ...process.env,
        DATABASE_URL: databaseUrl,
      };

      for (const migration of failedMigrations) {
        const migrationName = migration.migration_name;
        console.log(`🔧 Resolving failed migration: ${migrationName}`);

        if (migrationName === "20251125145648_add_symbol_list") {
          const fkExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.table_constraints 
              WHERE constraint_name = 'UsedTransactionHash_dexId_fkey'
              AND table_name = 'UsedTransactionHash'
            ) as exists
          `;

          if (fkExists[0]?.exists) {
            console.log(
              `🔧 Dropping orphaned foreign key constraint: UsedTransactionHash_dexId_fkey`
            );
            await prisma.$executeRaw`
              ALTER TABLE "UsedTransactionHash" 
              DROP CONSTRAINT IF EXISTS "UsedTransactionHash_dexId_fkey"
            `;
          }

          const columnExists = await prisma.$queryRaw<
            Array<{ exists: boolean }>
          >`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'Dex' 
              AND column_name = 'symbolList'
            ) as exists
          `;

          if (columnExists[0]?.exists) {
            console.log(
              `✅ Column exists, marking migration as applied: ${migrationName}`
            );
            execSync(`yarn db:migrate:resolve --applied ${migrationName}`, {
              cwd: process.cwd(),
              env,
              stdio: "inherit",
            });
          } else {
            console.log(
              `⚠️ Column doesn't exist, marking migration as rolled back to retry: ${migrationName}`
            );
            execSync(`yarn db:migrate:resolve --rolled-back ${migrationName}`, {
              cwd: process.cwd(),
              env,
              stdio: "inherit",
            });
          }
        } else {
          console.log(
            `⚠️ Marking migration as rolled back to retry: ${migrationName}`
          );
          execSync(`yarn db:migrate:resolve --rolled-back ${migrationName}`, {
            cwd: process.cwd(),
            env,
            stdio: "inherit",
          });
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

export async function runDatabaseMigrations(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const databaseUrl = await getSecret("databaseUrl");

    if (!databaseUrl) {
      throw new Error("DATABASE_URL not available from secret manager");
    }

    try {
      await resolveFailedMigrations();
    } catch (error) {
      console.warn(
        "⚠️ Failed to resolve migrations, continuing anyway:",
        error instanceof Error ? error.message : String(error)
      );
    }

    const env = {
      ...process.env,
      DATABASE_URL: databaseUrl,
    };

    execSync("yarn db:migrate:deploy", {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Database migrations failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export function shouldRunMigrations(): boolean {
  const migrateDb = process.env.MIGRATE_DB;
  return migrateDb === "true" || migrateDb === "1";
}
