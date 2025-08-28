import { ethers } from "ethers";
import { PrismaClient } from "../lib/generated/orderly-client";
import { Decimal } from "../lib/generated/orderly-client/runtime/library";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

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

async function getOrderlyDatabaseUrl(): Promise<string> {
  const envUrl = process.env.ORDERLY_DATABASE_URL;
  if (envUrl) {
    console.log("Using ORDERLY_DATABASE_URL from environment");
    return envUrl;
  }

  const deploymentEnv = process.env.DEPLOYMENT_ENV;
  console.log(
    `ORDERLY_DATABASE_URL not found, checking environment-specific configuration for: ${deploymentEnv}`
  );

  if (deploymentEnv === "qa" || deploymentEnv === "dev") {
    const dbUrl = process.env.ORDERLY_DATABASE_URL;
    const dbUser = process.env.ORDERLY_DATABASE_USER;
    const dbPassword = process.env.ORDERLY_DATABASE_PASSWORD;

    if (!dbUrl || !dbUser || !dbPassword) {
      throw new Error(
        `Missing required database environment variables for QA environment. Please set ORDERLY_DATABASE_URL, ORDERLY_DATABASE_USER, and ORDERLY_DATABASE_PASSWORD.`
      );
    }

    if (!dbUrl.startsWith("jdbc:mysql://")) {
      throw new Error(`Unsupported URL format: ${dbUrl}`);
    }

    const core = dbUrl.substring("jdbc:mysql://".length);
    const [hostPortDb, params] = core.split("?", 2);
    const [hostPort, db] = hostPortDb.split("/", 2);
    const [host, port] = hostPort.includes(":")
      ? hostPort.split(":", 2)
      : [hostPort, "3306"];

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

    if (!config.url.startsWith("jdbc:mysql://")) {
      throw new Error(`Unsupported URL format: ${config.url}`);
    }

    const core = config.url.substring("jdbc:mysql://".length);
    const [hostPortDb, params] = core.split("?", 2);
    const [hostPort, db] = hostPortDb.split("/", 2);
    const [host, port] = hostPort.includes(":")
      ? hostPort.split(":", 2)
      : [hostPort, "3306"];

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
): Promise<{ success: boolean; message: string }> {
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
      message: `Broker ${data.brokerId} successfully added to Orderly database`,
    };
  } catch (error) {
    console.error("❌ Error adding broker to Orderly database:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        success: false,
        message: `Broker ID ${data.brokerId} already exists in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to add broker to Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function updateBrokerAdminAccountId(
  brokerId: string,
  adminAccountId: string
): Promise<{ success: boolean; message: string }> {
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
      message: `Admin account ID updated successfully for broker ${brokerId}`,
    };
  } catch (error) {
    console.error("❌ Error updating admin account ID:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return {
        success: false,
        message: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to update admin account ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}

export async function deleteBrokerFromOrderlyDb(
  brokerId: string
): Promise<{ success: boolean; message: string }> {
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
      message: `Broker ${brokerId} successfully deleted from Orderly database`,
    };
  } catch (error) {
    console.error("❌ Error deleting broker from Orderly database:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return {
        success: false,
        message: `Broker ID ${brokerId} not found in Orderly database`,
      };
    }

    return {
      success: false,
      message: `Failed to delete broker from Orderly database: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    await orderlyPrisma.$disconnect();
  }
}
