import { ethers } from "ethers";
import { PrismaClient } from "../lib/generated/orderly-client";
import { PrismaClient as NexusPrismaClient } from "../lib/generated/nexus-client";
import { PrismaClient as SvPrismaClient } from "../lib/generated/sv-client";
import { Decimal } from "../lib/generated/orderly-client/runtime/library";
import { getSecret, type SecretConfig } from "./secretManager";
import { Result } from "./types";
import { MAX_BROKER_COUNT } from "../../../config";

interface OrderlyBrokerData {
  brokerId: string;
  brokerName: string;
  makerFee: number;
  takerFee: number;
}

interface DatabaseConfig {
  url: string;
  username: string;
  pwd: string;
}

function parseMysqlUrl(dbUrl: string): {
  host: string;
  port: string;
  db: string;
  params?: string;
} {
  let core: string;

  if (dbUrl.startsWith("jdbc:mysql://")) {
    core = dbUrl.substring("jdbc:mysql://".length);
  } else if (dbUrl.startsWith("mysql://")) {
    core = dbUrl.substring("mysql://".length);
  } else {
    throw new Error(
      `Unsupported URL format: ${dbUrl}. Must start with 'jdbc:mysql://' or 'mysql://'`
    );
  }

  const [hostPortDb, params] = core.split("?", 2);
  const [hostPort, db] = hostPortDb.split("/", 2);
  const [host, port] = hostPort.includes(":")
    ? hostPort.split(":", 2)
    : [hostPort, "3306"];

  return { host, port, db, params };
}

async function getMysqlDatabaseUrl(
  envVarName: string,
  secretKey: keyof SecretConfig,
  displayName: string
): Promise<string> {
  const deploymentEnv = process.env.DEPLOYMENT_ENV;

  if (deploymentEnv === "qa" || deploymentEnv === "dev") {
    const dbUrl = process.env[envVarName];
    const dbUser = process.env.ORDERLY_DATABASE_USER;
    const dbPassword = process.env.ORDERLY_DATABASE_PASSWORD;

    if (!dbUrl || !dbUser || !dbPassword) {
      throw new Error(
        `Missing required ${displayName} database environment variables for QA environment. Please set ${envVarName}, ORDERLY_DATABASE_USER and ORDERLY_DATABASE_PASSWORD.`
      );
    }

    const { host, port, db, params } = parseMysqlUrl(dbUrl);

    let mysqlUrl = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for ${displayName} QA: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  }

  try {
    const secretPayload = await getSecret(secretKey);
    console.log(
      `Fetched ${displayName} secret payload length:`,
      secretPayload.length
    );

    const config: DatabaseConfig = JSON.parse(secretPayload);

    const { host, port, db, params } = parseMysqlUrl(config.url);

    let mysqlUrl = `mysql://${encodeURIComponent(config.username)}:${encodeURIComponent(config.pwd)}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for ${displayName}: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  } catch (error) {
    console.error(
      `Failed to get ${displayName} database URL from secret manager:`,
      error
    );
    throw new Error(
      `${displayName} database connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function getOrderlyDatabaseUrl(): Promise<string> {
  return getMysqlDatabaseUrl(
    "ORDERLY_DATABASE_URL",
    "orderlyDatabaseUrl",
    "Orderly"
  );
}

async function getOrderlyPrismaClient(): Promise<PrismaClient> {
  const databaseUrl = await getOrderlyDatabaseUrl();
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

async function getNexusDatabaseUrl(): Promise<string> {
  return getMysqlDatabaseUrl(
    "ORDERLY_DATABASE_URL_NEXUS",
    "nexusDatabaseUrl",
    "Nexus"
  );
}

async function getNexusPrismaClient(): Promise<NexusPrismaClient> {
  const databaseUrl = await getNexusDatabaseUrl();
  return new NexusPrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

async function getSvDatabaseUrl(): Promise<string> {
  return getMysqlDatabaseUrl("ORDERLY_DATABASE_URL_SV", "svDatabaseUrl", "SV");
}

async function getSvPrismaClient(): Promise<SvPrismaClient> {
  const databaseUrl = await getSvDatabaseUrl();
  return new SvPrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

function generateBrokerHash(brokerId: string): string {
  const encoder = new TextEncoder();
  return ethers.keccak256(encoder.encode(brokerId));
}

function convertBasisPointsToDecimal(basisPoints: number): Decimal {
  const actualBasisPoints = basisPoints / 10;
  return new Decimal(actualBasisPoints.toFixed(8));
}

export async function addBrokerToOrderlyDb(
  data: OrderlyBrokerData
): Promise<Result<{ message: string }>> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    const brokerHash = generateBrokerHash(data.brokerId);
    const baseMakerFee = convertBasisPointsToDecimal(0);
    const baseTakerFee = convertBasisPointsToDecimal(25);
    const defaultMakerFee = convertBasisPointsToDecimal(data.makerFee);
    const defaultTakerFee = convertBasisPointsToDecimal(data.takerFee);

    await orderlyPrisma.orderlyBroker.create({
      data: {
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerHash: brokerHash,
        baseMakerFeeRate: baseMakerFee,
        baseTakerFeeRate: baseTakerFee,
        defaultMakerFeeRate: defaultMakerFee,
        defaultTakerFeeRate: defaultTakerFee,
        adminAccountId: null,
        rebateCap: new Decimal("1.00"),
        grossFeeEnable: false,
        lockedRebateAllocation: false,
        isAllSubsideTakerFee: false,
      },
    });

    console.log(
      `✅ Successfully added broker ${data.brokerId} to Orderly database`
    );

    return {
      success: true,
      data: {
        message: `Broker ${data.brokerId} successfully added to Orderly database`,
      },
    };
  } catch (error) {
    console.error("❌ Error adding broker to Orderly database:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        success: false,
        error: `Broker ID ${data.brokerId} already exists in Orderly database`,
      };
    }

    return {
      success: false,
      error: `Failed to add broker to Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function updateBrokerAdminAccountId(
  brokerId: string,
  adminAccountId: string
): Promise<Result<{ message: string }>> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    await orderlyPrisma.orderlyBroker.update({
      where: {
        brokerId: brokerId,
      },
      data: {
        adminAccountId: adminAccountId,
      },
    });

    console.log(
      `✅ Successfully updated admin account ID for broker ${brokerId} to ${adminAccountId}`
    );

    return {
      success: true,
      data: {
        message: `Admin account ID updated successfully for broker ${brokerId}`,
      },
    };
  } catch (error) {
    console.error("❌ Error updating admin account ID:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return {
        success: false,
        error: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      error: `Failed to update admin account ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function getBrokerFromOrderlyDb(
  brokerId: string
): Promise<Result<{ message: string; brokerIndex: number }>> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    const broker = await orderlyPrisma.orderlyBroker.findUnique({
      where: {
        brokerId: brokerId,
      },
      select: {
        id: true,
      },
    });

    if (!broker) {
      return {
        success: false,
        error: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    const brokerIndex = Number(broker.id);
    console.log(
      `✅ Found broker ${brokerId} in Orderly database with index ${brokerIndex}`
    );

    return {
      success: true,
      data: {
        message: `Broker ${brokerId} found in Orderly database`,
        brokerIndex,
      },
    };
  } catch (error) {
    console.error("❌ Error getting broker from Orderly database:", error);

    return {
      success: false,
      error: `Failed to get broker from Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function getNextBrokerIndex(): Promise<
  Result<{ brokerIndex: number }>
> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    const lastBroker = await orderlyPrisma.orderlyBroker.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    let nextBrokerIndex = lastBroker ? Number(lastBroker.id) + 1 : 1;
    if (nextBrokerIndex < 18_000) {
      nextBrokerIndex = 18_000;
    } else if (nextBrokerIndex >= 18_000 + MAX_BROKER_COUNT) {
      return {
        success: false,
        error: `Only a maximum broker count of ${MAX_BROKER_COUNT} can be set up`,
      };
    }

    console.log(
      `📍 Last broker ID: ${lastBroker?.id || "none"}, next broker index will be: ${nextBrokerIndex}`
    );

    return {
      success: true,
      data: {
        brokerIndex: nextBrokerIndex,
      },
    };
  } catch (error) {
    console.error("❌ Error getting next broker index:", error);

    return {
      success: false,
      error: `Failed to get next broker index: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function deleteBrokerFromOrderlyDb(
  brokerId: string
): Promise<Result<{ message: string }>> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    await orderlyPrisma.orderlyBroker.delete({
      where: {
        brokerId: brokerId,
      },
    });

    console.log(
      `✅ Successfully deleted broker ${brokerId} from Orderly database`
    );

    return {
      success: true,
      data: {
        message: `Broker ${brokerId} successfully deleted from Orderly database`,
      },
    };
  } catch (error) {
    console.error("❌ Error deleting broker from Orderly database:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return {
        success: false,
        error: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      error: `Failed to delete broker from Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function addBrokerToNexusDb(
  data: OrderlyBrokerData
): Promise<Result<{ message: string }>> {
  const nexusPrisma = await getNexusPrismaClient();

  try {
    const brokerHash = generateBrokerHash(data.brokerId);
    const baseMakerFee = convertBasisPointsToDecimal(0);
    const baseTakerFee = convertBasisPointsToDecimal(25);
    const defaultMakerFee = convertBasisPointsToDecimal(data.makerFee);
    const defaultTakerFee = convertBasisPointsToDecimal(data.takerFee);

    await nexusPrisma.nexusBroker.create({
      data: {
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerHash: brokerHash,
        baseMakerFeeRate: baseMakerFee,
        baseTakerFeeRate: baseTakerFee,
        defaultMakerFeeRate: defaultMakerFee,
        defaultTakerFeeRate: defaultTakerFee,
      },
    });

    console.log(
      `✅ Successfully added broker ${data.brokerId} to Nexus database`
    );

    return {
      success: true,
      data: {
        message: `Broker ${data.brokerId} successfully added to Nexus database with matching ID`,
      },
    };
  } catch (error) {
    console.error("❌ Error adding broker to Nexus database:", error);

    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return {
        success: false,
        error: `Broker ID ${data.brokerId} already exists in Nexus database`,
      };
    }

    return {
      success: false,
      error: `Failed to add broker to Nexus database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await nexusPrisma.$disconnect();
  }
}

export async function deleteBrokerFromNexusDb(
  brokerId: string
): Promise<Result<{ message: string }>> {
  const nexusPrisma = await getNexusPrismaClient();

  try {
    await nexusPrisma.nexusBroker.delete({
      where: {
        brokerId: brokerId,
      },
    });

    console.log(
      `✅ Successfully deleted broker ${brokerId} from Nexus database`
    );

    return {
      success: true,
      data: {
        message: `Broker ${brokerId} successfully deleted from Nexus database`,
      },
    };
  } catch (error) {
    console.error("❌ Error deleting broker from Nexus database:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return {
        success: false,
        error: `Broker ID ${brokerId} not found in Nexus database`,
      };
    }

    return {
      success: false,
      error: `Failed to delete broker from Nexus database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await nexusPrisma.$disconnect();
  }
}

export async function addBrokerToSvDb(
  data: OrderlyBrokerData
): Promise<Result<{ message: string }>> {
  const svPrisma = await getSvPrismaClient();

  try {
    const brokerHash = generateBrokerHash(data.brokerId);

    await svPrisma.svBroker.create({
      data: {
        brokerId: data.brokerId,
        brokerName: data.brokerName,
        brokerHash: brokerHash,
      },
    });

    console.log(`✅ Successfully added broker ${data.brokerId} to SV database`);

    return {
      success: true,
      data: {
        message: `Broker ${data.brokerId} successfully added to SV database`,
      },
    };
  } catch (error) {
    console.error("❌ Error adding broker to SV database:", error);

    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return {
        success: false,
        error: `Broker ID ${data.brokerId} already exists in SV database`,
      };
    }

    return {
      success: false,
      error: `Failed to add broker to SV database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await svPrisma.$disconnect();
  }
}

export async function addBrokerToAllDatabases(data: OrderlyBrokerData): Promise<
  Result<{
    message: string;
  }>
> {
  console.log(
    `🔄 Adding broker ${data.brokerId} to Orderly, Nexus, and SV databases`
  );

  const orderlyResult = await addBrokerToOrderlyDb(data);
  if (!orderlyResult.success) {
    return {
      success: false,
      error: `Failed to add to Orderly database: ${orderlyResult.error}`,
    };
  }

  const nexusResult = await addBrokerToNexusDb(data);
  if (!nexusResult.success) {
    console.log(
      `🔄 Rolling back Orderly database insertion due to Nexus failure`
    );
    const rollbackResult = await deleteBrokerFromOrderlyDb(data.brokerId);
    if (!rollbackResult.success) {
      console.error(
        `❌ Failed to rollback Orderly database: ${rollbackResult.error}`
      );
    }

    return {
      success: false,
      error: `Failed to add to Nexus database: ${nexusResult.error}`,
    };
  }

  const svResult = await addBrokerToSvDb(data);
  if (!svResult.success) {
    console.log(
      `🔄 Rolling back Orderly and Nexus database insertions due to SV failure`
    );
    const rollbackResults = await Promise.allSettled([
      deleteBrokerFromOrderlyDb(data.brokerId),
      deleteBrokerFromNexusDb(data.brokerId),
    ]);

    for (const result of rollbackResults) {
      if (result.status === "rejected") {
        console.error(`❌ Failed to rollback database:`, result.reason);
      } else if (!result.value.success) {
        console.error(`❌ Failed to rollback database:`, result.value.error);
      }
    }

    return {
      success: false,
      error: `Failed to add to SV database: ${svResult.error}`,
    };
  }

  console.log(`✅ Successfully added broker ${data.brokerId} to all databases`);

  return {
    success: true,
    data: {
      message: `Broker ${data.brokerId} successfully added to Orderly, Nexus, and SV databases`,
    },
  };
}
