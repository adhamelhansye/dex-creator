import { ethers } from "ethers";
import { PrismaClient } from "../lib/generated/orderly-client";
import { Decimal } from "../lib/generated/orderly-client/runtime/library";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Result } from "./types.js";

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

async function getOrderlyDatabaseUrl(): Promise<string> {
  const deploymentEnv = process.env.DEPLOYMENT_ENV;

  if (deploymentEnv === "qa" || deploymentEnv === "dev") {
    const dbUrl = process.env.ORDERLY_DATABASE_URL;
    const dbUser = process.env.ORDERLY_DATABASE_USER;
    const dbPassword = process.env.ORDERLY_DATABASE_PASSWORD;

    if (!dbUrl || !dbUser || !dbPassword) {
      throw new Error(
        `Missing required database environment variables for QA environment. Please set ORDERLY_DATABASE_URL, ORDERLY_DATABASE_USER, and ORDERLY_DATABASE_PASSWORD.`
      );
    }

    const { host, port, db, params } = parseMysqlUrl(dbUrl);

    let mysqlUrl = `mysql://${dbUser}:${dbPassword}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for QA: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  }

  let secretName: string;
  switch (deploymentEnv) {
    case "mainnet":
      secretName =
        "projects/964694002890/secrets/dex-creator-woo-db-prod-evm/versions/latest";
      break;
    case "staging":
      secretName =
        "projects/964694002890/secrets/dex-creator-woo-db-staging-evm/versions/latest";
      break;
    case "qa":
    case "dev":
      throw new Error(
        `No Google Secret Manager configured for ${deploymentEnv} environment. Please set ORDERLY_DATABASE_URL environment variable.`
      );
    default:
      throw new Error(
        `Unknown deployment environment: ${deploymentEnv}. Please set ORDERLY_DATABASE_URL environment variable.`
      );
  }

  try {
    const client = new SecretManagerServiceClient();
    console.log(`Fetching secret: ${secretName}`);

    const [version] = await client.accessSecretVersion({
      name: secretName,
    });

    const payload = version.payload?.data?.toString() || "";
    console.log("Fetched secret payload length:", payload.length);

    const config: DatabaseConfig = JSON.parse(payload);

    const { host, port, db, params } = parseMysqlUrl(config.url);

    let mysqlUrl = `mysql://${config.username}:${config.pwd}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(`Converted JDBC URL to MySQL URL: ${host}:${port}/${db}`);
    return mysqlUrl;
  } catch (error) {
    console.error(
      "Failed to get database URL from Google Secret Manager:",
      error
    );
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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

function generateBrokerHash(brokerId: string): string {
  const encoder = new TextEncoder();
  return ethers.keccak256(encoder.encode(brokerId));
}

function convertBasisPointsToDecimal(basisPoints: number): Decimal {
  const actualBasisPoints = basisPoints / 10;
  const decimal = actualBasisPoints / 10000;
  return new Decimal(decimal.toFixed(8));
}

export async function addBrokerToOrderlyDb(
  data: OrderlyBrokerData
): Promise<Result<{ message: string; brokerIndex: number }>> {
  const orderlyPrisma = await getOrderlyPrismaClient();

  try {
    const brokerHash = generateBrokerHash(data.brokerId);
    const baseMakerFee = convertBasisPointsToDecimal(0);
    const baseTakerFee = convertBasisPointsToDecimal(25);
    const defaultMakerFee = convertBasisPointsToDecimal(data.makerFee);
    const defaultTakerFee = convertBasisPointsToDecimal(data.takerFee);

    const createdBroker = await orderlyPrisma.orderlyBroker.create({
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

    const brokerIndex = Number(createdBroker.id);
    console.log(
      `✅ Successfully added broker ${data.brokerId} to Orderly database with index ${brokerIndex}`
    );

    return {
      success: true,
      data: {
        message: `Broker ${data.brokerId} successfully added to Orderly database`,
        brokerIndex,
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
    const brokerCount = await orderlyPrisma.orderlyBroker.count();
    const nextBrokerIndex = brokerCount + 1;

    console.log(
      `📍 Current broker count: ${brokerCount}, next broker index will be: ${nextBrokerIndex}`
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
