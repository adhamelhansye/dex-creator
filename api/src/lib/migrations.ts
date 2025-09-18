import { execSync } from "node:child_process";
import { getSecret } from "./secretManager.js";

export async function runDatabaseMigrations(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const databaseUrl = await getSecret("databaseUrl");

    if (!databaseUrl) {
      throw new Error("DATABASE_URL not available from secret manager");
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

    console.log("✅ Database migrations completed successfully");
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
