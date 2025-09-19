import { ethers } from "ethers";
import { PrismaClient } from "../lib/generated/orderly-client";
import { PrismaClient as NexusPrismaClient } from "../lib/generated/nexus-client";
import { Decimal } from "../lib/generated/orderly-client/runtime/library";
import { getSecret } from "./secretManager";
import { Result } from "./types";

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
        `Missing required Orderly database environment variables for QA environment. Please set ORDERLY_DATABASE_URL, ORDERLY_DATABASE_USER, and ORDERLY_DATABASE_PASSWORD.`
      );
    }

    const { host, port, db, params } = parseMysqlUrl(dbUrl);

    let mysqlUrl = `mysql://${dbUser}:${dbPassword}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for Orderly QA: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  }

  try {
    const secretPayload = await getSecret("orderlyDatabaseUrl");
    console.log("Fetched Orderly secret payload length:", secretPayload.length);

    const config: DatabaseConfig = JSON.parse(secretPayload);

    const { host, port, db, params } = parseMysqlUrl(config.url);

    let mysqlUrl = `mysql://${config.username}:${config.pwd}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for Orderly: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  } catch (error) {
    console.error(
      "Failed to get Orderly database URL from secret manager:",
      error
    );
    throw new Error(
      `Orderly database connection failed: ${error instanceof Error ? error.message : String(error)}`
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

async function getNexusDatabaseUrl(): Promise<string> {
  const deploymentEnv = process.env.DEPLOYMENT_ENV;

  if (deploymentEnv === "qa" || deploymentEnv === "dev") {
    const dbUrl = process.env.NEXUS_DATABASE_URL;
    const dbUser = process.env.NEXUS_DATABASE_USER;
    const dbPassword = process.env.NEXUS_DATABASE_PASSWORD;

    if (!dbUrl || !dbUser || !dbPassword) {
      throw new Error(
        `Missing required Nexus database environment variables for QA environment. Please set NEXUS_DATABASE_URL, NEXUS_DATABASE_USER, and NEXUS_DATABASE_PASSWORD.`
      );
    }

    const { host, port, db, params } = parseMysqlUrl(dbUrl);

    let mysqlUrl = `mysql://${dbUser}:${dbPassword}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for Nexus QA: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  }

  try {
    const secretPayload = await getSecret("nexusDatabaseUrl");
    console.log("Fetched Nexus secret payload length:", secretPayload.length);

    const config: DatabaseConfig = JSON.parse(secretPayload);

    const { host, port, db, params } = parseMysqlUrl(config.url);

    let mysqlUrl = `mysql://${config.username}:${config.pwd}@${host}:${port}/${db}`;
    if (params) {
      mysqlUrl += `?${params}`;
    }

    console.log(
      `Converted JDBC URL to MySQL URL for Nexus: ${host}:${port}/${db}`
    );
    return mysqlUrl;
  } catch (error) {
    console.error(
      "Failed to get Nexus database URL from secret manager:",
      error
    );
    throw new Error(
      `Nexus database connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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
    const lastBroker = await orderlyPrisma.orderlyBroker.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    const nextBrokerIndex = lastBroker ? Number(lastBroker.id) + 1 : 1;

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
  data: OrderlyBrokerData,
  brokerIndex: number
): Promise<Result<{ message: string; brokerIndex: number }>> {
  const nexusPrisma = await getNexusPrismaClient();

  try {
    const brokerHash = generateBrokerHash(data.brokerId);
    const baseMakerFee = convertBasisPointsToDecimal(0);
    const baseTakerFee = convertBasisPointsToDecimal(25);
    const defaultMakerFee = convertBasisPointsToDecimal(data.makerFee);
    const defaultTakerFee = convertBasisPointsToDecimal(data.takerFee);

    await nexusPrisma.$executeRaw`
      INSERT INTO broker_info (
        id,
        broker_id, 
        broker_name, 
        broker_hash,
        base_maker_fee_rate,
        base_taker_fee_rate,
        default_maker_fee_rate,
        default_taker_fee_rate
      ) VALUES (
        ${brokerIndex},
        ${data.brokerId},
        ${data.brokerName},
        ${brokerHash},
        ${baseMakerFee},
        ${baseTakerFee},
        ${defaultMakerFee},
        ${defaultTakerFee}
      )
    `;

    console.log(
      `✅ Successfully added broker ${data.brokerId} to Nexus database with matching index ${brokerIndex}`
    );

    return {
      success: true,
      data: {
        message: `Broker ${data.brokerId} successfully added to Nexus database with matching ID`,
        brokerIndex,
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

export async function addBrokerToBothDatabases(
  data: OrderlyBrokerData
): Promise<
  Result<{
    message: string;
    orderlyBrokerIndex: number;
    nexusBrokerIndex: number;
  }>
> {
  console.log(
    `🔄 Adding broker ${data.brokerId} to both Orderly and Nexus databases`
  );

  const orderlyResult = await addBrokerToOrderlyDb(data);
  if (!orderlyResult.success) {
    return {
      success: false,
      error: `Failed to add to Orderly database: ${orderlyResult.error}`,
    };
  }

  const nexusResult = await addBrokerToNexusDb(
    data,
    orderlyResult.data.brokerIndex
  );
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

  console.log(
    `✅ Successfully added broker ${data.brokerId} to both databases with matching ID: ${orderlyResult.data.brokerIndex}`
  );

  return {
    success: true,
    data: {
      message: `Broker ${data.brokerId} successfully added to both Orderly and Nexus databases`,
      orderlyBrokerIndex: orderlyResult.data.brokerIndex,
      nexusBrokerIndex: nexusResult.data.brokerIndex,
    },
  };
}

export async function deleteBrokerFromBothDatabases(
  brokerId: string
): Promise<Result<{ message: string }>> {
  console.log(
    `🔄 Deleting broker ${brokerId} from both Orderly and Nexus databases`
  );

  const results = await Promise.allSettled([
    deleteBrokerFromOrderlyDb(brokerId),
    deleteBrokerFromNexusDb(brokerId),
  ]);

  const orderlyResult = results[0];
  const nexusResult = results[1];

  const errors: string[] = [];

  if (orderlyResult.status === "rejected") {
    errors.push(`Orderly database error: ${orderlyResult.reason}`);
  } else if (!orderlyResult.value.success) {
    errors.push(`Orderly database: ${orderlyResult.value.error}`);
  }

  if (nexusResult.status === "rejected") {
    errors.push(`Nexus database error: ${nexusResult.reason}`);
  } else if (!nexusResult.value.success) {
    errors.push(`Nexus database: ${nexusResult.value.error}`);
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Failed to delete from databases: ${errors.join("; ")}`,
    };
  }

  console.log(`✅ Successfully deleted broker ${brokerId} from both databases`);

  return {
    success: true,
    data: {
      message: `Broker ${brokerId} successfully deleted from both Orderly and Nexus databases`,
    },
  };
}
