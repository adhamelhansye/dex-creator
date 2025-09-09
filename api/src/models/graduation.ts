import { prisma } from "../lib/prisma";
import { ethers } from "ethers";
import { createAutomatedBrokerId as createBrokerOnAllChains } from "../lib/brokerCreation.js";
import { getCurrentEnvironment } from "./dex.js";
import {
  ALL_CHAINS,
  ORDER_ADDRESSES,
  USDC_ADDRESSES,
  type ChainName,
} from "../../../config";

async function withRPCTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  errorMessage: string = "RPC timeout"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export interface BrokerCreationData {
  brokerId: string;
  transactionHashes: Record<number, string>; // chainId -> txHash
}

const ORDER_RECEIVER_ADDRESS = process.env.ORDER_RECEIVER_ADDRESS!;

const DEFAULT_MAKER_FEE = 30; // Default maker fee (3 bps = 30 units)
const DEFAULT_TAKER_FEE = 60; // Default taker fee (6 bps = 60 units)

const MIN_MAKER_FEE = 0; // Minimum maker fee (0 bps = 0 units)
const MIN_TAKER_FEE = 30; // Minimum taker fee (3 bps = 30 units)
const MAX_FEE = 150; // Maximum fee (15 bps = 150 units)

const ACCEPTED_CHAINS = ["ethereum", "arbitrum", "sepolia", "arbitrum-sepolia"];

const ERC20_TRANSFER_EVENT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

/**
 * Verify if a transaction sent the required payment (ORDER tokens or USDC) to our address
 */
export async function verifyOrderTransaction(
  txHash: string,
  chain: string,
  userWalletAddress: string,
  paymentType: "usdc" | "order" = "order"
): Promise<{ success: boolean; message: string; amount?: string }> {
  if (!ACCEPTED_CHAINS.includes(chain)) {
    return {
      success: false,
      message: `Chain not supported. Supported chains: ${ACCEPTED_CHAINS.join(", ")}`,
    };
  }

  const tokenAddress =
    paymentType === "usdc"
      ? USDC_ADDRESSES[chain as keyof typeof USDC_ADDRESSES]
      : ORDER_ADDRESSES[chain as keyof typeof ORDER_ADDRESSES];

  if (!tokenAddress) {
    return {
      success: false,
      message: `No ${paymentType.toUpperCase()} token address configured for chain: ${chain}`,
    };
  }

  const receiverAddress = ORDER_RECEIVER_ADDRESS;

  try {
    const rpcUrl = ALL_CHAINS[chain as ChainName].rpcUrl;
    if (!rpcUrl) {
      return {
        success: false,
        message: `No RPC URL configured for chain: ${chain}`,
      };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    await new Promise(resolve => setTimeout(resolve, 5_000));
    const receipt = await withRPCTimeout(
      provider.getTransactionReceipt(txHash),
      30000,
      "Transaction receipt timeout"
    );
    if (!receipt) {
      return { success: false, message: "Transaction not found" };
    }

    if (receipt.status === 0) {
      return { success: false, message: "Transaction failed" };
    }

    const transaction = await withRPCTimeout(
      provider.getTransaction(txHash),
      30000,
      "Transaction details timeout"
    );
    if (!transaction) {
      return { success: false, message: "Transaction details not found" };
    }

    if (transaction.from.toLowerCase() !== userWalletAddress.toLowerCase()) {
      return {
        success: false,
        message: "Transaction was not sent from your wallet address",
      };
    }

    const iface = new ethers.Interface(ERC20_TRANSFER_EVENT_ABI);

    const orderTransferEvents = receipt.logs
      .filter(log => {
        return log.address.toLowerCase() === tokenAddress.toLowerCase();
      })
      .map(log => {
        try {
          return iface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
        } catch {
          return null;
        }
      })
      .filter(event => event !== null);

    const validTransfers = orderTransferEvents.filter(event => {
      if (!event) return false;

      const to = event.args[1].toLowerCase();
      return to === receiverAddress.toLowerCase();
    });

    if (validTransfers.length === 0) {
      return {
        success: false,
        message: `No ${paymentType.toUpperCase()} token transfers to the required address found in this transaction`,
      };
    }

    const totalTransferred = validTransfers.reduce((sum, event) => {
      if (!event) return sum;
      const amount = event.args[2];
      return sum + amount;
    }, ethers.getBigInt(0));

    let tokenDecimals = paymentType === "usdc" ? 6 : 18;
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function decimals() view returns (uint8)"],
        provider
      );
      tokenDecimals = await withRPCTimeout(
        tokenContract.decimals(),
        15000,
        "Token decimals timeout"
      );
    } catch (error) {
      console.warn(
        `Could not read decimals for token ${tokenAddress}, using default 18:`,
        error
      );
    }

    const totalTransferredDecimal = ethers.formatUnits(
      totalTransferred,
      tokenDecimals
    );

    const usdcAmount = process.env.GRADUATION_USDC_AMOUNT;
    const orderRequiredPrice = process.env.GRADUATION_ORDER_REQUIRED_PRICE;

    if (!usdcAmount || !orderRequiredPrice) {
      return {
        success: false,
        message: "Graduation fee configuration is incomplete",
      };
    }

    let requiredAmount: string;
    if (paymentType === "usdc") {
      requiredAmount = usdcAmount;
    } else {
      requiredAmount = orderRequiredPrice;
    }

    const transferredAmount = parseFloat(totalTransferredDecimal);
    const requiredAmountFloat = parseFloat(requiredAmount);

    if (transferredAmount < requiredAmountFloat) {
      return {
        success: false,
        message: `Insufficient amount transferred. Required: ${requiredAmount} ${paymentType.toUpperCase()}, Received: ${totalTransferredDecimal} ${paymentType.toUpperCase()}`,
        amount: totalTransferredDecimal,
      };
    }

    return {
      success: true,
      message: `Successfully verified ${paymentType.toUpperCase()} transfer of ${totalTransferredDecimal}`,
      amount: totalTransferredDecimal,
    };
  } catch (error) {
    console.error("Error verifying ORDER transaction:", error);
    return {
      success: false,
      message: `Error verifying transaction: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Create broker ID automatically on all chains after successful ORDER token verification
 */
export async function createAutomatedBrokerId(
  userId: string,
  brokerId: string,
  userAddress: string
): Promise<{
  success: boolean;
  message: string;
  brokerCreationData?: BrokerCreationData;
}> {
  try {
    const existingDex = await prisma.dex.findFirst({
      where: {
        brokerId: brokerId,
        NOT: { userId },
      },
    });

    if (existingDex) {
      return {
        success: false,
        message: "This broker ID is already taken. Please choose another one.",
      };
    }

    console.log(`🚀 Attempting to create broker ID for user ${userAddress}...`);

    const environment = getCurrentEnvironment();

    const brokerCreationResult = await createBrokerOnAllChains(
      brokerId,
      environment
    );

    if (!brokerCreationResult.success) {
      console.error(
        `❌ Failed to create broker ID:`,
        brokerCreationResult.errors
      );
      return {
        success: false,
        message: `Failed to create broker ID: ${brokerCreationResult.errors?.join(", ") || "Unknown error"}`,
      };
    }

    console.log(`✅ Successfully created broker ID: ${brokerId} on all chains`);

    console.log(
      `✅ Broker creation completed successfully for all configured chains!`
    );

    console.log(`🎯 Final broker information:`);
    console.log(`  - Broker ID: ${brokerId}`);
    console.log(
      `  - Transaction hashes: ${brokerCreationResult.transactionHashes ? Object.values(brokerCreationResult.transactionHashes).join(", ") : "none"}`
    );

    await prisma.dex.update({
      where: { userId },
      data: {
        brokerId: brokerId,
        isGraduated: false,
      },
    });

    console.log(`🎉 Broker ID ${brokerId} created and assigned to DEX!`);

    return {
      success: true,
      message: `Broker ID ${brokerId} created successfully and DEX graduated!`,
      brokerCreationData: {
        brokerId: brokerId,
        transactionHashes: brokerCreationResult.transactionHashes || {},
      },
    };
  } catch (error) {
    console.error("Error creating automated broker ID:", error);
    return {
      success: false,
      message: `Error creating broker ID: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Set the maker and taker fees for a DEX
 * @param userId The user ID
 * @param makerFee The maker fee in 0.1 basis points (0.001% precision)
 * @param takerFee The taker fee in 0.1 basis points (0.001% precision)
 * @returns Success status and message
 */
export async function updateDexFees(
  userId: string,
  makerFee: number,
  takerFee: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (makerFee < MIN_MAKER_FEE) {
      return {
        success: false,
        message: `Maker fee cannot be less than ${MIN_MAKER_FEE / 10} basis points`,
      };
    }

    if (takerFee < MIN_TAKER_FEE) {
      return {
        success: false,
        message: `Taker fee cannot be less than ${MIN_TAKER_FEE / 10} basis points`,
      };
    }

    if (makerFee > MAX_FEE) {
      return {
        success: false,
        message: `Maker fee cannot exceed ${MAX_FEE / 10} basis points`,
      };
    }

    if (takerFee > MAX_FEE) {
      return {
        success: false,
        message: `Taker fee cannot exceed ${MAX_FEE / 10} basis points`,
      };
    }

    const dex = await prisma.dex.findFirst({
      where: { userId },
    });

    if (!dex) {
      return {
        success: false,
        message: "You must create a DEX first",
      };
    }

    if (!dex.brokerId) {
      return {
        success: false,
        message:
          "You must verify an ORDER token transaction before setting fees",
      };
    }

    await prisma.dex.update({
      where: { userId },
      data: {
        makerFee,
        takerFee,
      },
    });

    return {
      success: true,
      message: "DEX fees updated successfully",
    };
  } catch (error) {
    console.error("Error updating DEX fees:", error);
    return {
      success: false,
      message: `Error updating DEX fees: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get the current fee configuration for a DEX
 * @param userId The user ID
 * @returns The current fee configuration or error message
 */
export async function getDexFees(userId: string): Promise<
  | {
      success: true;
      makerFee: number;
      takerFee: number;
    }
  | { success: false; message: string }
> {
  try {
    const dex = await prisma.dex.findFirst({
      where: { userId },
    });

    if (!dex) {
      return {
        success: false,
        message: "DEX not found",
      };
    }

    const dexWithFees = dex;

    return {
      success: true,
      makerFee: dexWithFees.makerFee ?? DEFAULT_MAKER_FEE,
      takerFee: dexWithFees.takerFee ?? DEFAULT_TAKER_FEE,
    };
  } catch (error) {
    console.error("Error getting DEX fees:", error);
    return {
      success: false,
      message: `Error getting DEX fees: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
