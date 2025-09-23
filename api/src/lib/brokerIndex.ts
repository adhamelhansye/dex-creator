import { PrismaClient } from "@prisma/client";
import { MAX_BROKER_COUNT } from "../../../config";
import { Result } from "./types";
import { getCurrentEnvironment } from "../models/dex";

const prisma = new PrismaClient();

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

    const lastBroker = await prisma.brokerIndex.findFirst({
      orderBy: {
        brokerIndex: "desc",
      },
      select: {
        brokerIndex: true,
      },
    });

    let nextBrokerIndex = lastBroker
      ? lastBroker.brokerIndex + 1
      : startingBrokerIndex;

    if (nextBrokerIndex < startingBrokerIndex) {
      nextBrokerIndex = startingBrokerIndex;
    }

    const maxAllowedIndex = 18_000 + MAX_BROKER_COUNT;
    if (nextBrokerIndex >= maxAllowedIndex) {
      return {
        success: false,
        error: `Only a maximum broker count of ${MAX_BROKER_COUNT} can be set up`,
      };
    }

    console.log(
      `📍 Last broker index: ${lastBroker?.brokerIndex || "none"}, next broker index will be: ${nextBrokerIndex}`
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
  }
}

export async function createBrokerIndex(
  brokerId: string,
  brokerIndex: number
): Promise<CreateBrokerIndexResult> {
  try {
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
