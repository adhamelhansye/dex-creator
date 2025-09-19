import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import type { PrismaClient as OrderlyPrismaClient } from "../../src/lib/generated/orderly-client";
import type { PrismaClient as NexusPrismaClient } from "../../src/lib/generated/nexus-client";

let postgresContainer: StartedPostgreSqlContainer | null = null;
let orderlyMysqlContainer: StartedMySqlContainer | null = null;
let nexusMysqlContainer: StartedMySqlContainer | null = null;
let testPrismaClient: PrismaClient | null = null;
let testOrderlyClient: OrderlyPrismaClient | null = null;
let testNexusClient: NexusPrismaClient | null = null;

export async function setupTestDatabases() {
  console.log("🚀 Starting test databases...");

  postgresContainer = await new PostgreSqlContainer("postgres:16")
    .withDatabase("dex_creator_test")
    .withUsername("test_user")
    .withPassword("test_password")
    .withExposedPorts(5432)
    .start();

  orderlyMysqlContainer = await new MySqlContainer("mysql:8.0")
    .withDatabase("orderly_test")
    .withUsername("test_user")
    .withRootPassword("test_password")
    .withExposedPorts(3306)
    .start();

  nexusMysqlContainer = await new MySqlContainer("mysql:8.0")
    .withDatabase("nexus_test")
    .withUsername("test_user")
    .withRootPassword("test_password")
    .withExposedPorts(3306)
    .start();

  const postgresUrl = postgresContainer.getConnectionUri();
  const orderlyMysqlUrl = orderlyMysqlContainer.getConnectionUri();
  const nexusMysqlUrl = nexusMysqlContainer.getConnectionUri();

  process.env.DATABASE_URL = postgresUrl;
  process.env.ORDERLY_DATABASE_URL = orderlyMysqlUrl;
  process.env.ORDERLY_DATABASE_USER = "test_user";
  process.env.ORDERLY_DATABASE_PASSWORD = "test_password";
  process.env.NEXUS_DATABASE_URL = nexusMysqlUrl;
  process.env.NEXUS_DATABASE_USER = "test_user";
  process.env.NEXUS_DATABASE_PASSWORD = "test_password";

  testPrismaClient = new PrismaClient({
    datasources: {
      db: {
        url: postgresUrl,
      },
    },
  });

  execSync("yarn orderly:generate && yarn nexus:generate", {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ORDERLY_DATABASE_URL: orderlyMysqlUrl,
      NEXUS_DATABASE_URL: nexusMysqlUrl,
    },
  });

  const { PrismaClient: OrderlyPrismaClient } = await import(
    "../../src/lib/generated/orderly-client"
  );
  testOrderlyClient = new OrderlyPrismaClient({
    datasources: {
      db: {
        url: orderlyMysqlUrl,
      },
    },
  });

  const { PrismaClient: NexusPrismaClient } = await import(
    "../../src/lib/generated/nexus-client"
  );
  testNexusClient = new NexusPrismaClient({
    datasources: {
      db: {
        url: nexusMysqlUrl,
      },
    },
  });

  console.log("📊 Running database migrations...");

  execSync("yarn db:push", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: postgresUrl },
  });

  await testOrderlyClient.$executeRaw`
    CREATE TABLE IF NOT EXISTS broker (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      broker_id VARCHAR(64) UNIQUE NOT NULL,
      created_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      broker_name VARCHAR(64) NOT NULL,
      broker_hash VARCHAR(256) UNIQUE DEFAULT '',
      base_maker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      base_taker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      default_maker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      default_taker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      admin_account_id VARCHAR(128),
      rebate_cap DECIMAL(4, 2) DEFAULT 1.00,
      gross_fee_enable TINYINT DEFAULT 0,
      locked_rebate_allocation TINYINT DEFAULT 0,
      is_all_subside_taker_fee TINYINT DEFAULT 0
    )
  `;

  await testNexusClient.$executeRaw`
    CREATE TABLE IF NOT EXISTS broker_info (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      broker_id VARCHAR(64) UNIQUE NOT NULL,
      created_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      broker_name VARCHAR(64) NOT NULL,
      broker_hash VARCHAR(256) UNIQUE DEFAULT '',
      base_maker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      base_taker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      default_maker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000,
      default_taker_fee_rate DECIMAL(28, 8) DEFAULT 0.00000000
    )
  `;

  console.log("✅ Test databases ready!");
}

export async function cleanupTestDatabases() {
  console.log("🧹 Cleaning up test databases...");

  if (testPrismaClient) {
    await testPrismaClient.$disconnect();
  }

  if (testOrderlyClient) {
    await testOrderlyClient.$disconnect();
  }

  if (testNexusClient) {
    await testNexusClient.$disconnect();
  }

  if (postgresContainer) {
    await postgresContainer.stop();
  }

  if (orderlyMysqlContainer) {
    await orderlyMysqlContainer.stop();
  }

  if (nexusMysqlContainer) {
    await nexusMysqlContainer.stop();
  }

  console.log("✅ Test databases cleaned up!");
}

export function getTestPrismaClient(): PrismaClient {
  if (!testPrismaClient) {
    testPrismaClient = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            "postgresql://test_user:test_password@localhost:5432/dex_creator_test",
        },
      },
    });
  }
  return testPrismaClient;
}

export function getTestOrderlyClient() {
  if (!testOrderlyClient) {
    throw new Error(
      "Test Orderly database not initialized. Call setupTestDatabases() first."
    );
  }
  return testOrderlyClient;
}

export function getTestNexusClient() {
  if (!testNexusClient) {
    throw new Error(
      "Test Nexus database not initialized. Call setupTestDatabases() first."
    );
  }
  return testNexusClient;
}

export async function cleanupTestData() {
  const prisma = getTestPrismaClient();
  const orderly = getTestOrderlyClient();
  const nexus = getTestNexusClient();

  await prisma.token.deleteMany();
  await prisma.dex.deleteMany();
  await prisma.user.deleteMany();

  await orderly.orderlyBroker.deleteMany();
  await nexus.nexusBroker.deleteMany();
}
