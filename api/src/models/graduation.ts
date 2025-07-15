import { prisma } from "../lib/prisma";
import { ethers } from "ethers";

const DEFAULT_ETH_ORDER_ADDRESS = "0xABD4C63d2616A5201454168269031355f4764337";
const DEFAULT_ARB_ORDER_ADDRESS = "0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8";
const DEFAULT_ETH_SEPOLIA_ORDER_ADDRESS =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const DEFAULT_ARB_SEPOLIA_ORDER_ADDRESS =
  "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

const ORDER_TOKEN_ADDRESSES: Record<string, string> = {
  ethereum: process.env.ETH_ORDER_ADDRESS || DEFAULT_ETH_ORDER_ADDRESS,
  arbitrum: process.env.ARB_ORDER_ADDRESS || DEFAULT_ARB_ORDER_ADDRESS,
  sepolia:
    process.env.SEPOLIA_ORDER_ADDRESS || DEFAULT_ETH_SEPOLIA_ORDER_ADDRESS,
  "arbitrum-sepolia":
    process.env.ARB_SEPOLIA_ORDER_ADDRESS || DEFAULT_ARB_SEPOLIA_ORDER_ADDRESS,
};

const DEFAULT_RECEIVER = "0x7E301E34Ee1A0524225a91BD445344d11a1B4869";
const ORDER_RECEIVER_ADDRESSES: Record<string, string> = {
  ethereum: process.env.ETH_RECEIVER_ADDRESS || DEFAULT_RECEIVER,
  arbitrum: process.env.ARB_RECEIVER_ADDRESS || DEFAULT_RECEIVER,
  sepolia: process.env.SEPOLIA_RECEIVER_ADDRESS || DEFAULT_RECEIVER,
  "arbitrum-sepolia":
    process.env.ARB_SEPOLIA_RECEIVER_ADDRESS || DEFAULT_RECEIVER,
};

const REQUIRED_ORDER_AMOUNT = process.env.REQUIRED_ORDER_AMOUNT || "1000";

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
 * Verify if a transaction sent ORDER tokens to our address
 */
export async function verifyOrderTransaction(
  txHash: string,
  chain: string,
  userWalletAddress: string
): Promise<{ success: boolean; message: string; amount?: string }> {
  if (!ACCEPTED_CHAINS.includes(chain)) {
    return {
      success: false,
      message: `Chain not supported. Supported chains: ${ACCEPTED_CHAINS.join(", ")}`,
    };
  }

  const tokenAddress = ORDER_TOKEN_ADDRESSES[chain];
  if (!tokenAddress) {
    return {
      success: false,
      message: `No ORDER token address configured for chain: ${chain}`,
    };
  }

  const receiverAddress = ORDER_RECEIVER_ADDRESSES[chain];
  if (!receiverAddress) {
    return {
      success: false,
      message: `No receiver address configured for chain: ${chain}`,
    };
  }

  try {
    const rpcUrl = getRpcUrlForChain(chain);
    if (!rpcUrl) {
      return {
        success: false,
        message: `No RPC URL configured for chain: ${chain}`,
      };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { success: false, message: "Transaction not found" };
    }

    if (receipt.status === 0) {
      return { success: false, message: "Transaction failed" };
    }

    const transaction = await provider.getTransaction(txHash);
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

    console.log("receipt.logs", receipt.logs);
    console.log("tokenAddress", tokenAddress);
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
    console.log("orderTransferEvents", orderTransferEvents);

    const validTransfers = orderTransferEvents.filter(event => {
      if (!event) return false;

      const to = event.args[1].toLowerCase();
      console.log("to", to);
      console.log("receiverAddress", receiverAddress);
      return to === receiverAddress.toLowerCase();
    });

    if (validTransfers.length === 0) {
      return {
        success: false,
        message:
          "No ORDER token transfers to the required address found in this transaction",
      };
    }

    const totalTransferred = validTransfers.reduce((sum, event) => {
      if (!event) return sum;
      const amount = event.args[2];
      return sum + amount;
    }, ethers.getBigInt(0));

    let tokenDecimals = 18;
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function decimals() view returns (uint8)"],
        provider
      );
      tokenDecimals = await tokenContract.decimals();
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
    const requiredAmount = parseFloat(REQUIRED_ORDER_AMOUNT);

    if (parseFloat(totalTransferredDecimal) < requiredAmount) {
      return {
        success: false,
        message: `Insufficient ORDER tokens transferred. Required: ${requiredAmount}, Found: ${totalTransferredDecimal} (${tokenDecimals} decimals)`,
        amount: totalTransferredDecimal,
      };
    }

    return {
      success: true,
      message: `Successfully verified ORDER transfer of ${totalTransferredDecimal}`,
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
 * Update the preferred broker ID for a DEX
 */
export async function updatePreferredBrokerId(
  userId: string,
  preferredBrokerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!/^[a-z0-9_-]+$/.test(preferredBrokerId)) {
      return {
        success: false,
        message:
          "Invalid broker ID format. Use only lowercase letters, numbers, hyphens, and underscores.",
      };
    }

    const existingDex = await prisma.dex.findFirst({
      where: {
        brokerId: preferredBrokerId,
        NOT: { userId },
      },
    });

    if (existingDex) {
      return {
        success: false,
        message: "This broker ID is already taken. Please choose another one.",
      };
    }

    await prisma.dex.update({
      where: { userId },
      data: { preferredBrokerId },
    });

    return {
      success: true,
      message: "Preferred broker ID updated successfully",
    };
  } catch (error) {
    console.error("Error updating preferred broker ID:", error);
    return {
      success: false,
      message: `Error updating preferred broker ID: ${error instanceof Error ? error.message : String(error)}`,
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

    if (!dex.preferredBrokerId) {
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

/**
 * Helper function to get RPC URL for a specific chain
 */
function getRpcUrlForChain(chain: string): string | null {
  const chainLower = chain.toLowerCase();

  const envVarMap: Record<string, string> = {
    ethereum: "ETH_RPC_URL",
    arbitrum: "ARBITRUM_RPC_URL",
    sepolia: "SEPOLIA_RPC_URL",
    "arbitrum-sepolia": "ARB_SEPOLIA_RPC_URL",
  };

  const fallbackUrls: Record<string, string> = {
    ethereum: "https://ethereum-rpc.publicnode.com",
    arbitrum: "https://arbitrum-one.public.blastapi.io",
    sepolia: "https://ethereum-sepolia-rpc.publicnode.com",
    "arbitrum-sepolia": "https://arbitrum-sepolia-rpc.publicnode.com",
  };

  const envVar = envVarMap[chainLower];
  if (!envVar) return null;

  return process.env[envVar] || fallbackUrls[chainLower] || null;
}
