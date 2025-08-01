/**
 * Automated Broker Creation Service
 *
 * Handles automated creation of broker IDs across multiple blockchain networks.
 * Implements atomic execution by simulating all transactions first, then executing
 * them simultaneously if all simulations pass.
 *
 * Two-step process:
 * 1. createAutomatedBrokerId - Creates broker on L1 Vaults and Orderly L2 VaultManager
 * 2. setBrokerAccountId - Later sets account ID on FeeManager (after user wallet registration)
 */

import { ethers } from "ethers";
import { Environment, getCurrentEnvironment } from "../models/dex.js";
import {
  type ChainName,
  ALL_CHAINS,
  ENVIRONMENT_CONFIGS,
  EnvironmentChainConfig,
} from "../../../config";
import {
  Vault__factory,
  VaultManager__factory,
  FeeManager__factory,
} from "../../types/index.js";

function getBrokerHash(brokerId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(brokerId));
}

function getRpcUrlForChain(chainName: string): string {
  const chainConfig = ALL_CHAINS[chainName as ChainName];
  if (!chainConfig) {
    throw new Error(`No chain configuration found for: ${chainName}`);
  }
  return chainConfig.rpcUrl;
}

interface SimulationResult {
  success: boolean;
  error?: string;
  gasEstimate?: bigint;
}

interface BrokerCreationResult {
  success: boolean;
  brokerId?: string;
  transactionHashes?: Record<number, string>; // chainId -> txHash
  errors?: string[];
}

export async function createAutomatedBrokerId(
  brokerId: string,
  environment?: Environment
): Promise<BrokerCreationResult> {
  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    const privateKey = process.env.BROKER_CREATION_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "BROKER_CREATION_PRIVATE_KEY environment variable is required"
      );
    }

    console.log(
      `Simulating broker creation for ID: ${brokerId} on environment: ${env}`
    );

    const simulationPromises: Promise<SimulationResult>[] = [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateL1Transaction(chainConfig, brokerId, privateKey, chainName)
        );
      }
    }

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultManagerAddress) {
        simulationPromises.push(
          simulateOrderlyTransaction(
            chainConfig,
            brokerId,
            privateKey,
            chainName
          )
        );
      }
    }

    const simulationResults = await Promise.all(simulationPromises);

    const failedSimulations = simulationResults.filter(
      result => !result.success
    );
    if (failedSimulations.length > 0) {
      const errors = failedSimulations
        .map(result => result.error)
        .filter(Boolean);
      console.error("Broker creation simulation failed:", errors);
      return {
        success: false,
        errors: errors as string[],
      };
    }

    console.log(
      "All simulations passed. Proceeding with actual transactions..."
    );

    const executionPromises: Promise<{ chainId: number; txHash: string }>[] =
      [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultAddress) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        executionPromises.push(
          executeL1Transaction(
            chainConfig,
            brokerId,
            privateKey,
            chainName
          ).then(txHash => ({
            chainId,
            txHash,
          }))
        );
      }
    }

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultManagerAddress) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        executionPromises.push(
          executeOrderlyTransaction(
            chainConfig,
            brokerId,
            privateKey,
            chainName
          ).then(txHash => ({
            chainId,
            txHash,
          }))
        );
      }
    }

    const results = await Promise.all(executionPromises);
    const transactionHashes: Record<number, string> = {};

    for (const { chainId, txHash } of results) {
      transactionHashes[chainId] = txHash;
    }

    console.log(`Successfully created broker ID ${brokerId} on all chains`);
    console.log(`Transaction hashes:`, transactionHashes);

    return {
      success: true,
      brokerId,
      transactionHashes,
    };
  } catch (error) {
    console.error("Broker creation failed:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export async function setBrokerAccountId(
  brokerId: string,
  accountId: string,
  environment?: Environment
): Promise<BrokerCreationResult> {
  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    const privateKey = process.env.BROKER_CREATION_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "BROKER_CREATION_PRIVATE_KEY environment variable is required"
      );
    }

    const orderlyConfig = Object.values(config).find(
      chainConfig =>
        chainConfig.feeManagerAddress && chainConfig.vaultManagerAddress
    );

    if (!orderlyConfig || !orderlyConfig.feeManagerAddress) {
      throw new Error("No Orderly L2 configuration found with FeeManager");
    }

    console.log(
      `Setting broker account ID for broker: ${brokerId}, account: ${accountId}`
    );

    const orderlyChainName = env === "mainnet" ? "orderlyL2" : "orderlyTestnet";
    const orderlyChainConfig = ALL_CHAINS[orderlyChainName];

    const provider = new ethers.JsonRpcProvider(orderlyChainConfig.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const feeManager = FeeManager__factory.connect(
      orderlyConfig.feeManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);

    try {
      const gasEstimate = await feeManager.setBrokerAccountId.estimateGas(
        brokerHash,
        accountId
      );
      const balance = await provider.getBalance(wallet.address);
      const gasPrice = await provider.getFeeData();
      const estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));

      if (balance < estimatedCost) {
        throw new Error(
          `Insufficient balance. Required: ${ethers.formatEther(estimatedCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`
        );
      }
    } catch (error) {
      throw new Error(
        `Simulation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    const tx = await feeManager.setBrokerAccountId(brokerHash, accountId);
    await tx.wait();

    console.log(
      `Successfully set broker account ID. Transaction hash: ${tx.hash}`
    );

    return {
      success: true,
      brokerId,
      transactionHashes: { [orderlyChainConfig.chainId]: tx.hash },
    };
  } catch (error) {
    console.error("Failed to set broker account ID:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function simulateL1Transaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(privateKey, provider);
    const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

    const brokerHash = getBrokerHash(brokerId);

    const isAllowed = await vault.getAllowedBroker(brokerHash);
    if (isAllowed) {
      throw new Error(`Broker ${brokerId} already exists on ${chainName}`);
    }

    const gasEstimate = await vault.setAllowedBroker.estimateGas(
      brokerHash,
      true
    );

    const balance = await provider.getBalance(wallet.address);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));

    if (balance < estimatedCost) {
      throw new Error(
        `Insufficient balance. Required: ${ethers.formatEther(estimatedCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`
      );
    }

    return { success: true, gasEstimate };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function simulateOrderlyTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultManagerAddress) {
      throw new Error("VaultManager address not configured for Orderly L2");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(privateKey, provider);
    const vaultManager = VaultManager__factory.connect(
      chainConfig.vaultManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);

    const isAllowed = await vaultManager.getAllowedBroker(brokerHash);
    if (isAllowed) {
      throw new Error(`Broker ${brokerId} already exists on Orderly L2`);
    }

    const gasEstimate = await vaultManager.setAllowedBroker.estimateGas(
      brokerHash,
      true
    );

    const balance = await provider.getBalance(wallet.address);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));

    if (balance < estimatedCost) {
      throw new Error(
        `Insufficient balance. Required: ${ethers.formatEther(estimatedCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`
      );
    }

    return { success: true, gasEstimate };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function executeL1Transaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(privateKey, provider);
  const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vault.setAllowedBroker(brokerHash, true);
  await tx.wait();

  return tx.hash;
}

async function executeOrderlyTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultManagerAddress) {
    throw new Error("VaultManager address not configured for Orderly L2");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(privateKey, provider);
  const vaultManager = VaultManager__factory.connect(
    chainConfig.vaultManagerAddress,
    wallet
  );

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vaultManager.setAllowedBroker(brokerHash, true);
  await tx.wait();

  return tx.hash;
}

export async function checkBrokerCreationPermissions(
  environment?: Environment
): Promise<{
  hasPermissions: boolean;
  walletAddress?: string;
  errors?: string[];
  permissionDetails: Array<{
    chain: string;
    hasPermission: boolean;
    contractType: string;
    error?: string;
  }>;
}> {
  const permissionDetails: Array<{
    chain: string;
    hasPermission: boolean;
    contractType: string;
    error?: string;
  }> = [];

  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    const privateKey = process.env.BROKER_CREATION_PRIVATE_KEY;
    if (!privateKey) {
      return {
        hasPermissions: false,
        errors: [
          "BROKER_CREATION_PRIVATE_KEY environment variable is required",
        ],
        permissionDetails,
      };
    }

    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = wallet.address;

    console.log(
      `🔍 Checking permissions for wallet: ${walletAddress} on environment: ${env}`
    );

    const permissionCheckPromises = Object.entries(config).map(
      ([chainName, chainConfig]) =>
        checkChainPermissions(chainName, chainConfig, walletAddress)
    );

    const results = await Promise.all(permissionCheckPromises);

    for (const result of results) {
      permissionDetails.push(result);

      if (result.hasPermission) {
        console.log(
          `✅ ${result.chain}: Has ${result.contractType} permissions`
        );
      } else {
        console.warn(
          `❌ ${result.chain}: Missing ${result.contractType} permissions - ${result.error}`
        );
      }
    }

    const hasPermissions = permissionDetails.every(
      detail => detail.hasPermission
    );
    const failedChains = permissionDetails.filter(
      detail => !detail.hasPermission
    );

    const errors = hasPermissions
      ? undefined
      : [
          `Missing broker creation permissions on ${failedChains.length} chain(s):`,
          ...failedChains.map(
            detail =>
              `  - ${detail.chain} (${detail.contractType}): ${detail.error}`
          ),
        ];

    return {
      hasPermissions,
      walletAddress,
      errors,
      permissionDetails,
    };
  } catch (error) {
    return {
      hasPermissions: false,
      errors: [
        error instanceof Error
          ? error.message
          : "Unknown error checking permissions",
      ],
      permissionDetails,
    };
  }
}

async function checkChainPermissions(
  chainName: string,
  chainConfig: EnvironmentChainConfig,
  walletAddress: string
): Promise<{
  chain: string;
  hasPermission: boolean;
  contractType: string;
  error?: string;
}> {
  if (chainConfig.vaultAddress) {
    try {
      const hasPermission = await checkL1Permissions(
        chainConfig,
        walletAddress,
        chainName
      );
      return {
        chain: chainName,
        hasPermission,
        contractType: "Vault",
        error: hasPermission
          ? undefined
          : "Missing BROKER_MANAGER_ROLE on Vault contract",
      };
    } catch (error) {
      return {
        chain: chainName,
        hasPermission: false,
        contractType: "Vault",
        error: `Error checking permissions: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (chainConfig.vaultManagerAddress) {
    try {
      const hasPermission = await checkOrderlyPermissions(
        chainConfig,
        walletAddress,
        chainName
      );
      return {
        chain: chainName,
        hasPermission,
        contractType: "VaultManager",
        error: hasPermission
          ? undefined
          : "Missing BROKER_MANAGER_ROLE on VaultManager contract",
      };
    } catch (error) {
      return {
        chain: chainName,
        hasPermission: false,
        contractType: "VaultManager",
        error: `Error checking permissions: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  return {
    chain: chainName,
    hasPermission: true,
    contractType: "None",
    error: "No broker creation contracts on this chain",
  };
}

async function checkL1Permissions(
  chainConfig: EnvironmentChainConfig,
  walletAddress: string,
  chainName: string
): Promise<boolean> {
  try {
    if (!chainConfig.vaultAddress) return false;

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const vault = Vault__factory.connect(chainConfig.vaultAddress, provider);

    const BROKER_MANAGER_ROLE = await vault.BROKER_MANAGER_ROLE();
    return await vault.hasRole(BROKER_MANAGER_ROLE, walletAddress);
  } catch (error) {
    console.error("Error checking L1 permissions:", error);
    return false;
  }
}

async function checkOrderlyPermissions(
  chainConfig: EnvironmentChainConfig,
  walletAddress: string,
  chainName: string
): Promise<boolean> {
  try {
    if (!chainConfig.vaultManagerAddress) return false;

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const vaultManager = VaultManager__factory.connect(
      chainConfig.vaultManagerAddress,
      provider
    );

    const BROKER_MANAGER_ROLE = await vaultManager.BROKER_MANAGER_ROLE();
    return await vaultManager.hasRole(BROKER_MANAGER_ROLE, walletAddress);
  } catch (error) {
    console.error("Error checking Orderly permissions:", error);
    return false;
  }
}

export async function checkGasBalances(environment?: Environment): Promise<{
  success: boolean;
  warnings: string[];
  balanceDetails: Array<{
    chain: string;
    balance: string;
    estimatedCost: string;
    sufficient: boolean;
  }>;
}> {
  const warnings: string[] = [];
  const balanceDetails: Array<{
    chain: string;
    balance: string;
    estimatedCost: string;
    sufficient: boolean;
  }> = [];

  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    const privateKey = process.env.BROKER_CREATION_PRIVATE_KEY;
    if (!privateKey) {
      warnings.push(
        "BROKER_CREATION_PRIVATE_KEY environment variable is required"
      );
      return { success: false, warnings, balanceDetails };
    }

    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = wallet.address;

    console.log(
      `🔍 Checking gas balances for wallet: ${walletAddress} on environment: ${env}`
    );

    const balanceCheckPromises = Object.entries(config).map(
      ([chainName, chainConfig]) =>
        checkChainBalance(chainName, chainConfig, walletAddress)
    );

    const results = await Promise.all(balanceCheckPromises);

    for (const result of results) {
      balanceDetails.push(result);

      if (!result.sufficient) {
        warnings.push(
          `⚠️ ${result.chain}: Insufficient balance (${result.balance} ETH) for estimated gas cost (${result.estimatedCost} ETH)`
        );
      } else {
        console.log(
          `✅ ${result.chain}: Sufficient balance (${result.balance} ETH)`
        );
      }
    }

    return {
      success: warnings.length === 0,
      warnings,
      balanceDetails,
    };
  } catch (error) {
    warnings.push(
      `Error checking gas balances: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { success: false, warnings, balanceDetails };
  }
}

async function checkChainBalance(
  chainName: string,
  chainConfig: EnvironmentChainConfig,
  walletAddress: string
): Promise<{
  chain: string;
  balance: string;
  estimatedCost: string;
  sufficient: boolean;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const balance = await provider.getBalance(walletAddress);
    const gasPrice = await provider.getFeeData();

    let estimatedGas = BigInt(21000);
    let contractAddress = "";

    if (chainConfig.vaultAddress) {
      contractAddress = chainConfig.vaultAddress;
      try {
        const vault = Vault__factory.connect(contractAddress, provider);
        const testBrokerHash = ethers.keccak256(
          ethers.toUtf8Bytes("test_broker")
        );
        estimatedGas = await vault.setAllowedBroker.estimateGas(
          testBrokerHash,
          true
        );
      } catch {
        estimatedGas = BigInt(100000);
      }
    } else if (chainConfig.vaultManagerAddress) {
      contractAddress = chainConfig.vaultManagerAddress;
      try {
        const vaultManager = VaultManager__factory.connect(
          contractAddress,
          provider
        );
        const testBrokerHash = ethers.keccak256(
          ethers.toUtf8Bytes("test_broker")
        );
        estimatedGas = await vaultManager.setAllowedBroker.estimateGas(
          testBrokerHash,
          true
        );
      } catch {
        estimatedGas = BigInt(100000);
      }
    }

    const baseEstimatedCost =
      estimatedGas * (gasPrice.gasPrice || BigInt("20000000000")); // 20 gwei fallback
    const estimatedCostWithBuffer =
      baseEstimatedCost + (baseEstimatedCost * BigInt(20)) / BigInt(100);

    const sufficient = balance >= estimatedCostWithBuffer;

    return {
      chain: chainName,
      balance: ethers.formatEther(balance),
      estimatedCost: ethers.formatEther(estimatedCostWithBuffer),
      sufficient,
    };
  } catch (error) {
    console.error(`Error checking balance for ${chainName}:`, error);
    return {
      chain: chainName,
      balance: "0.0",
      estimatedCost: "unknown",
      sufficient: false,
    };
  }
}

export async function deleteBrokerId(
  brokerId: string,
  environment?: Environment
): Promise<BrokerCreationResult> {
  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    const privateKey = process.env.BROKER_CREATION_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "BROKER_CREATION_PRIVATE_KEY environment variable is required"
      );
    }

    console.log(
      `Simulating broker deletion for ID: ${brokerId} on environment: ${env}`
    );

    const simulationPromises: Promise<SimulationResult>[] = [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateL1Deletion(chainConfig, brokerId, privateKey, chainName)
        );
      }
    }

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultManagerAddress) {
        simulationPromises.push(
          simulateOrderlyDeletion(chainConfig, brokerId, privateKey, chainName)
        );
      }
    }

    const simulationResults = await Promise.all(simulationPromises);

    const failedSimulations = simulationResults.filter(
      result => !result.success
    );
    if (failedSimulations.length > 0) {
      const errors = failedSimulations
        .map(result => result.error)
        .filter(Boolean);
      console.error("Broker deletion simulation failed:", errors);
      return {
        success: false,
        errors: errors as string[],
      };
    }

    console.log(
      "All deletion simulations passed. Proceeding with actual transactions..."
    );

    const executionPromises: Promise<{ chainId: number; txHash: string }>[] =
      [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultAddress) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        executionPromises.push(
          executeL1Deletion(chainConfig, brokerId, privateKey, chainName).then(
            txHash => ({
              chainId,
              txHash,
            })
          )
        );
      }
    }

    for (const [chainName, chainConfig] of Object.entries(config)) {
      if (chainConfig.vaultManagerAddress) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        executionPromises.push(
          executeOrderlyDeletion(
            chainConfig,
            brokerId,
            privateKey,
            chainName
          ).then(txHash => ({
            chainId,
            txHash,
          }))
        );
      }
    }

    const results = await Promise.all(executionPromises);
    const transactionHashes: Record<number, string> = {};

    for (const { chainId, txHash } of results) {
      transactionHashes[chainId] = txHash;
    }

    console.log(`Successfully deleted broker ID ${brokerId} from all chains`);
    console.log(`Transaction hashes:`, transactionHashes);

    return {
      success: true,
      brokerId,
      transactionHashes,
    };
  } catch (error) {
    console.error("Broker deletion failed:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function simulateL1Deletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(privateKey, provider);
    const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

    const brokerHash = getBrokerHash(brokerId);

    // Check if broker exists
    const isAllowed = await vault.getAllowedBroker(brokerHash);
    if (!isAllowed) {
      throw new Error(`Broker ${brokerId} does not exist on ${chainName}`);
    }

    const gasEstimate = await vault.setAllowedBroker.estimateGas(
      brokerHash,
      false
    );

    const balance = await provider.getBalance(wallet.address);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));

    if (balance < estimatedCost) {
      throw new Error(
        `Insufficient balance. Required: ${ethers.formatEther(estimatedCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`
      );
    }

    return { success: true, gasEstimate };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function simulateOrderlyDeletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultManagerAddress) {
      throw new Error("VaultManager address not configured for Orderly L2");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(privateKey, provider);
    const vaultManager = VaultManager__factory.connect(
      chainConfig.vaultManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);

    const isAllowed = await vaultManager.getAllowedBroker(brokerHash);
    if (!isAllowed) {
      throw new Error(`Broker ${brokerId} does not exist on ${chainName}`);
    }

    const gasEstimate = await vaultManager.setAllowedBroker.estimateGas(
      brokerHash,
      false
    );

    const balance = await provider.getBalance(wallet.address);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));

    if (balance < estimatedCost) {
      throw new Error(
        `Insufficient balance. Required: ${ethers.formatEther(estimatedCost)} ETH, Available: ${ethers.formatEther(balance)} ETH`
      );
    }

    return { success: true, gasEstimate };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function executeL1Deletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(privateKey, provider);
  const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vault.setAllowedBroker(brokerHash, false);
  await tx.wait();

  return tx.hash;
}

async function executeOrderlyDeletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  privateKey: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultManagerAddress) {
    throw new Error("VaultManager address not configured for Orderly L2");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(privateKey, provider);
  const vaultManager = VaultManager__factory.connect(
    chainConfig.vaultManagerAddress,
    wallet
  );

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vaultManager.setAllowedBroker(brokerHash, false);
  await tx.wait();

  return tx.hash;
}
