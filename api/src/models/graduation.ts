import { getPrisma } from "../lib/prisma";
import { ethers } from "ethers";
import {
  ALL_CHAINS,
  ORDER_ADDRESSES,
  USDC_ADDRESSES,
  type ChainName,
} from "../../../config";
import { getSecret } from "../lib/secretManager.js";
import { createProvider } from "../lib/fallbackProvider.js";
import {
  getBrokerFeesFromOrderlyDb,
  updateBrokerFeesInOrderlyDb,
  getBrokerTierFromOrderlyDb,
  type BrokerTier,
} from "../lib/orderlyDb";
import { type Result } from "../lib/types";

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

export enum TransactionVerificationError {
  TRANSACTION_NOT_FOUND = "Transaction not found",
  TRANSACTION_FAILED = "Transaction failed",
  WRONG_SENDER = "was not sent from your wallet",
  CHAIN_NOT_SUPPORTED = "Chain not supported",
  TX_ALREADY_USED = "This transaction hash has already been used for graduation",
  INSUFFICIENT_AMOUNT = "Insufficient amount transferred",
  NO_TRANSFERS_FOUND = "No ORDER token transfers to the required address found",
  CONFIGURATION_ERROR = "Graduation fee configuration is incomplete",
}

function getOrderReceiverAddress(): Promise<string> {
  return getSecret("orderReceiverAddress");
}

const DEFAULT_MAKER_FEE = 30; // Default maker fee (3 bps = 30 units)
const DEFAULT_TAKER_FEE = 60; // Default taker fee (6 bps = 60 units)

const MIN_MAKER_FEE = 0; // Minimum maker fee (0 bps = 0 units)
const MIN_TAKER_FEE = 30; // Minimum taker fee (3 bps = 30 units)
const MAX_FEE = 150; // Maximum fee (15 bps = 150 units)

const ACCEPTED_CHAINS = ["ethereum", "arbitrum", "sepolia", "arbitrum-sepolia"];

const ERC20_TRANSFER_EVENT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export async function verifyOrderTransaction(
  txHash: string,
  chain: string,
  userWalletAddress: string,
  paymentType: "usdc" | "order" = "order"
): Promise<{ success: boolean; message: string; amount?: string }> {
  if (!ACCEPTED_CHAINS.includes(chain)) {
    return {
      success: false,
      message: `${TransactionVerificationError.CHAIN_NOT_SUPPORTED}. Supported chains: ${ACCEPTED_CHAINS.join(", ")}`,
    };
  }

  const prismaClient = await getPrisma();

  const existingUsedTx = await prismaClient.usedTransactionHash.findUnique({
    where: {
      txHash: txHash,
    },
  });

  if (existingUsedTx) {
    return {
      success: false,
      message: TransactionVerificationError.TX_ALREADY_USED,
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

  const receiverAddress = await getOrderReceiverAddress();

  try {
    const chainConfig = ALL_CHAINS[chain as ChainName];
    if (!chainConfig?.rpcUrl) {
      return {
        success: false,
        message: `No RPC URL configured for chain: ${chain}`,
      };
    }

    const provider = createProvider(chain as ChainName, true);

    await new Promise(resolve => setTimeout(resolve, 5_000));
    const receipt = await withRPCTimeout(
      provider.getTransactionReceipt(txHash),
      30000,
      "Transaction receipt timeout"
    );
    if (!receipt) {
      return {
        success: false,
        message: TransactionVerificationError.TRANSACTION_NOT_FOUND,
      };
    }

    if (receipt.status === 0) {
      return {
        success: false,
        message: TransactionVerificationError.TRANSACTION_FAILED,
      };
    }

    const transaction = await withRPCTimeout(
      provider.getTransaction(txHash),
      30000,
      "Transaction details timeout"
    );
    if (!transaction) {
      return {
        success: false,
        message: TransactionVerificationError.TRANSACTION_NOT_FOUND,
      };
    }

    if (transaction.from.toLowerCase() !== userWalletAddress.toLowerCase()) {
      return {
        success: false,
        message: `Transaction ${TransactionVerificationError.WRONG_SENDER}`,
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
        message: `No ${paymentType.toUpperCase()} ${TransactionVerificationError.NO_TRANSFERS_FOUND} in this transaction`,
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
        message: TransactionVerificationError.CONFIGURATION_ERROR,
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
        message: `${TransactionVerificationError.INSUFFICIENT_AMOUNT}. Required: ${requiredAmount} ${paymentType.toUpperCase()}, Received: ${totalTransferredDecimal} ${paymentType.toUpperCase()}`,
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

    const prismaClient = await getPrisma();
    const dex = await prismaClient.dex.findFirst({
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

    const result = await updateBrokerFeesInOrderlyDb(
      dex.brokerId,
      makerFee,
      takerFee
    );

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to update fees in Orderly database",
      };
    }

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

export async function getDexFees(userId: string): Promise<
  | {
      success: true;
      makerFee: number;
      takerFee: number;
    }
  | { success: false; message: string }
> {
  try {
    const prismaClient = await getPrisma();
    const dex = await prismaClient.dex.findFirst({
      where: { userId },
    });

    if (!dex) {
      return {
        success: false,
        message: "DEX not found",
      };
    }

    if (!dex.brokerId || dex.brokerId === "demo") {
      return {
        success: true,
        makerFee: DEFAULT_MAKER_FEE,
        takerFee: DEFAULT_TAKER_FEE,
      };
    }

    const result = await getBrokerFeesFromOrderlyDb(dex.brokerId);

    if (!result.success) {
      console.error(
        `Failed to fetch fees from Orderly DB for broker ${dex.brokerId}: ${result.error}`
      );
      return {
        success: true,
        makerFee: DEFAULT_MAKER_FEE,
        takerFee: DEFAULT_TAKER_FEE,
      };
    }

    return {
      success: true,
      makerFee: result.data.makerFee,
      takerFee: result.data.takerFee,
    };
  } catch (error) {
    console.error("Error getting DEX fees:", error);
    return {
      success: false,
      message: `Error getting DEX fees: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getDexBrokerTier(
  userId: string
): Promise<Result<BrokerTier>> {
  try {
    const prismaClient = await getPrisma();
    const dex = await prismaClient.dex.findFirst({
      where: { userId },
    });

    if (!dex) {
      return {
        success: false,
        error: "DEX not found",
      };
    }

    if (!dex.brokerId || dex.brokerId === "demo") {
      return {
        success: false,
        error: "No broker tier available for demo brokers",
      };
    }

    const result = await getBrokerTierFromOrderlyDb(dex.brokerId);

    if (!result.success) {
      console.error(
        `Failed to fetch tier from Orderly DB for broker ${dex.brokerId}: ${result.error}`
      );

      return {
        success: true,
        data: {
          tier: "PUBLIC",
          stakingVolume: "0",
          tradingVolume: "0",
          makerFeeRate: "0",
          takerFeeRate: "0",
          logDate: new Date().toISOString().split("T")[0],
        },
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Error getting broker tier:", error);
    return {
      success: false,
      error: `Error getting broker tier: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
