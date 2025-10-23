import {
  MAX_BROKER_COUNT,
  ENVIRONMENT_CONFIGS,
  ALL_CHAINS,
  type ChainName,
  type EnvironmentChainConfig,
} from "../../../config";
import { Result } from "./types";
import { getCurrentEnvironment } from "../models/dex";
import { getPrisma } from "./prisma";
import {
  simulateLedgerSetBrokerFromLedger,
  initializeBrokerCreation,
} from "./brokerCreation";

const BROKER_INDEX_START = {
  mainnet: 18_000,
  staging: 18_002,
  qa: 18_003,
  dev: 18_000,
} as const;

function getStartingBrokerIndex(): number {
  const env = getCurrentEnvironment();
  return BROKER_INDEX_START[env];
}

export type BrokerIndexResult = Result<{ brokerIndex: number }>;

export type CreateBrokerIndexResult = Result<{ brokerIndex: number }>;

export async function getNextBrokerIndex(): Promise<BrokerIndexResult> {
  try {
    const startingBrokerIndex = getStartingBrokerIndex();
    const env = getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      return {
        success: false,
        error: `No configuration found for environment: ${env}`,
      };
    }

    const prisma = await getPrisma();
    const lastBroker = await prisma.brokerIndex.findFirst({
      orderBy: {
        brokerIndex: "desc",
      },
      select: {
        brokerIndex: true,
      },
    });

    let candidateIndex = lastBroker
      ? lastBroker.brokerIndex + 1
      : startingBrokerIndex;

    if (candidateIndex < startingBrokerIndex) {
      candidateIndex = startingBrokerIndex;
    }

    const maxAllowedIndex = 18_000 + MAX_BROKER_COUNT;
    if (candidateIndex >= maxAllowedIndex) {
      return {
        success: false,
        error: `Only a maximum broker count of ${MAX_BROKER_COUNT} can be set up`,
      };
    }

    console.log(
      `📍 Last broker index in DB: ${lastBroker?.brokerIndex || "none"}, candidate index: ${candidateIndex}`
    );

    await initializeBrokerCreation();

    const orderlyChainName = env === "mainnet" ? "orderlyL2" : "orderlyTestnet";
    const orderlyConfig = config[orderlyChainName as keyof typeof config] as
      | EnvironmentChainConfig
      | undefined;

    if (!orderlyConfig || !orderlyConfig.ledgerAddress) {
      console.warn(
        `⚠️ No Ledger configuration found for ${orderlyChainName}, skipping on-chain validation`
      );
      return {
        success: true,
        data: {
          brokerIndex: candidateIndex,
        },
      };
    }

    const evmChains: Array<[string, EnvironmentChainConfig]> = [];
    for (const [chainName, chainConfig] of Object.entries(config)) {
      const chainInfo = ALL_CHAINS[chainName as ChainName];
      if (chainInfo?.chainType === "EVM" && chainConfig.vaultAddress) {
        evmChains.push([chainName, chainConfig]);
      }
    }

    const evmVaultChainIds: number[] = [];
    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultAddress && chainName !== orderlyChainName) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        evmVaultChainIds.push(chainId);
      }
    }

    if (evmVaultChainIds.length === 0) {
      console.warn(
        `⚠️ No EVM vault chains found for validation, skipping on-chain check`
      );
      return {
        success: true,
        data: {
          brokerIndex: candidateIndex,
        },
      };
    }

    const MAX_RETRIES = 5;
    const TEST_BROKER_ID = `__test_broker_index_check_${Date.now()}__`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const testIndex = candidateIndex + attempt;

      if (testIndex >= maxAllowedIndex) {
        return {
          success: false,
          error: `Reached maximum broker count of ${MAX_BROKER_COUNT} while searching for available index`,
        };
      }

      console.log(
        `🔍 Validating broker index ${testIndex} on-chain (attempt ${attempt + 1}/${MAX_RETRIES})...`
      );

      const simulationResult = await simulateLedgerSetBrokerFromLedger(
        orderlyConfig,
        TEST_BROKER_ID,
        testIndex,
        evmVaultChainIds,
        orderlyChainName
      );

      if (simulationResult.success) {
        console.log(
          `✅ Found available broker index: ${testIndex}${attempt > 0 ? ` (after ${attempt} retries)` : ""}`
        );
        return {
          success: true,
          data: {
            brokerIndex: testIndex,
          },
        };
      }

      console.warn(
        `⚠️ Index ${testIndex} failed simulation: ${simulationResult.error}`
      );
    }

    return {
      success: false,
      error: `Failed to find available broker index after ${MAX_RETRIES} attempts. Last attempted index: ${candidateIndex + MAX_RETRIES - 1}`,
    };
  } catch (error) {
    console.error("❌ Error getting next broker index:", error);

    return {
      success: false,
      error: `Failed to get next broker index: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function createBrokerIndex(
  brokerId: string,
  brokerIndex: number
): Promise<CreateBrokerIndexResult> {
  try {
    const prisma = await getPrisma();
    const existingBroker = await prisma.brokerIndex.findUnique({
      where: { brokerId },
    });

    if (existingBroker) {
      return {
        success: false,
        error: `Broker ID ${brokerId} already exists with index ${existingBroker.brokerIndex}`,
      };
    }

    const existingIndex = await prisma.brokerIndex.findUnique({
      where: { brokerIndex },
    });

    if (existingIndex) {
      return {
        success: false,
        error: `Broker index ${brokerIndex} already exists with broker ID ${existingIndex.brokerId}`,
      };
    }

    await prisma.brokerIndex.create({
      data: {
        brokerIndex,
        brokerId,
      },
    });

    console.log(
      `✅ Created broker index entry: ${brokerIndex} for broker ID: ${brokerId}`
    );

    return {
      success: true,
      data: {
        brokerIndex,
      },
    };
  } catch (error) {
    console.error("❌ Error creating broker index:", error);

    return {
      success: false,
      error: `Failed to create broker index: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getBrokerByBrokerId(
  brokerId: string
): Promise<Result<{ brokerIndex: number }>> {
  try {
    const prisma = await getPrisma();
    const broker = await prisma.brokerIndex.findUnique({
      where: { brokerId },
      select: {
        brokerIndex: true,
      },
    });

    if (!broker) {
      return {
        success: false,
        error: `Broker ID ${brokerId} not found`,
      };
    }

    return {
      success: true,
      data: {
        brokerIndex: broker.brokerIndex,
      },
    };
  } catch (error) {
    console.error("❌ Error getting broker by ID:", error);

    return {
      success: false,
      error: `Failed to get broker by ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getBrokerByIndex(
  brokerIndex: number
): Promise<Result<{ brokerId: string }>> {
  try {
    const prisma = await getPrisma();
    const broker = await prisma.brokerIndex.findUnique({
      where: { brokerIndex },
      select: {
        brokerId: true,
      },
    });

    if (!broker) {
      return {
        success: false,
        error: `Broker index ${brokerIndex} not found`,
      };
    }

    return {
      success: true,
      data: {
        brokerId: broker.brokerId,
      },
    };
  } catch (error) {
    console.error("❌ Error getting broker by index:", error);

    return {
      success: false,
      error: `Failed to get broker by index: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get all broker indices (for admin purposes)
 */
export async function getAllBrokerIndices(): Promise<
  Result<Array<{ brokerIndex: number; brokerId: string; createdAt: Date }>>
> {
  try {
    const prisma = await getPrisma();
    const brokers = await prisma.brokerIndex.findMany({
      orderBy: {
        brokerIndex: "asc",
      },
      select: {
        brokerIndex: true,
        brokerId: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: brokers,
    };
  } catch (error) {
    console.error("❌ Error getting all broker indices:", error);

    return {
      success: false,
      error: `Failed to get all broker indices: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Delete a broker index entry (for cleanup purposes)
 */
export async function deleteBrokerIndex(
  brokerId: string
): Promise<Result<void>> {
  try {
    const prisma = await getPrisma();
    const deletedBroker = await prisma.brokerIndex.delete({
      where: { brokerId },
    });

    console.log(
      `🗑️ Deleted broker index entry: ${deletedBroker.brokerIndex} for broker ID: ${brokerId}`
    );

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("❌ Error deleting broker index:", error);

    return {
      success: false,
      error: `Failed to delete broker index: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
