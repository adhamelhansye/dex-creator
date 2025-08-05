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

import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { solidityPackedKeccak256 } from "ethers";
import { IDL, type SolanaVault } from "../interface/types/solana_vault.js";

// Constants matching the other repository
export const BROKER_MANAGER_ROLE = "BrokerManagerRole";
export const ACCESS_CONTROL_SEED = "AccessControl";

let evmPrivateKey: string | null = null;
let solanaPrivateKey: string | null = null;
let solanaKeypair: anchor.web3.Keypair | null = null;
let isInitialized = false;

export function initializeBrokerCreation(): void {
  console.log("🔧 Initializing broker creation system...");

  evmPrivateKey = process.env.BROKER_CREATION_PRIVATE_KEY || null;
  if (!evmPrivateKey) {
    console.warn(
      "⚠️  BROKER_CREATION_PRIVATE_KEY not found - EVM operations will fail"
    );
  } else {
    const evmWallet = new ethers.Wallet(evmPrivateKey);
    console.log("✅ EVM private key loaded");
    console.log(`📍 EVM wallet address: ${evmWallet.address}`);
  }

  solanaPrivateKey = process.env.BROKER_CREATION_PRIVATE_KEY_SOL || null;
  if (!solanaPrivateKey) {
    console.warn(
      "⚠️  BROKER_CREATION_PRIVATE_KEY_SOL not found - Solana operations will fail"
    );
  } else {
    try {
      const privateKeyArray = JSON.parse(solanaPrivateKey);
      if (!Array.isArray(privateKeyArray)) {
        throw new Error("Solana private key must be a JSON array");
      }
      solanaKeypair = anchor.web3.Keypair.fromSecretKey(
        new Uint8Array(privateKeyArray)
      );
      console.log("✅ Solana private key loaded");
      console.log(
        `📍 Solana wallet address: ${solanaKeypair.publicKey.toString()}`
      );
    } catch (error) {
      console.error("❌ Failed to parse Solana private key:", error);
      console.error(
        "   Expected format: [1,2,3,4,...] (JSON array of numbers)"
      );
      solanaKeypair = null;
    }
  }

  if (!evmPrivateKey && !solanaPrivateKey) {
    console.error("❌ No private keys found! Broker creation will not work.");
    console.error(
      "   Please set either BROKER_CREATION_PRIVATE_KEY (for EVM) or BROKER_CREATION_PRIVATE_KEY_SOL (for Solana)"
    );
  }

  isInitialized = true;
  console.log("🚀 Broker creation system initialized");
}

function getEvmPrivateKey(): string {
  if (!isInitialized) {
    initializeBrokerCreation();
  }

  if (!evmPrivateKey) {
    throw new Error(
      "BROKER_CREATION_PRIVATE_KEY environment variable is required for EVM operations"
    );
  }

  return evmPrivateKey;
}

function getSolanaKeypair(): anchor.web3.Keypair {
  if (!isInitialized) {
    initializeBrokerCreation();
  }

  if (!solanaKeypair) {
    throw new Error("Solana keypair not initialized");
  }

  return solanaKeypair;
}

function getEvmProvider(chainName: string): ethers.JsonRpcProvider {
  if (!isInitialized) {
    initializeBrokerCreation();
  }

  const provider = new ethers.JsonRpcProvider(
    ALL_CHAINS[chainName as ChainName].rpcUrl
  );
  return provider;
}

function getSolanaConnection(
  environment?: Environment
): anchor.web3.Connection {
  if (!isInitialized) {
    initializeBrokerCreation();
  }

  const env = environment || getCurrentEnvironment();

  let solanaChainName: ChainName;
  if (env === "mainnet") {
    solanaChainName = "solana-mainnet-beta";
  } else {
    solanaChainName = "solana-devnet";
  }

  const solanaChain = ALL_CHAINS[solanaChainName];
  if (!solanaChain) {
    throw new Error(
      `No Solana chain configuration found for environment: ${env}`
    );
  }

  try {
    console.log("solanaChain.rpcUrl", solanaChain.rpcUrl);
    return new anchor.web3.Connection(solanaChain.rpcUrl);
  } catch (error) {
    console.warn(
      `⚠️  Failed to initialize Solana connection for ${env}:`,
      error
    );
    throw new Error(`Failed to initialize Solana connection for ${env}.`);
  }
}

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

function getManagerRoleHash(managerRole: string): string {
  return solidityPackedKeccak256(["string"], [managerRole]);
}

function getSolanaBrokerHash(brokerId: string): string {
  return solidityPackedKeccak256(["string"], [brokerId]);
}

function getSolanaBrokerPda(
  programId: anchor.web3.PublicKey,
  brokerHash: string
): anchor.web3.PublicKey {
  const hash = Array.from(Buffer.from(brokerHash.slice(2), "hex"));
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Broker", "utf8"), Buffer.from(hash)],
    programId
  )[0];
}

function getSolanaVaultProgram(
  environment?: Environment
): anchor.Program<SolanaVault> {
  const env = environment || getCurrentEnvironment();
  const config = ENVIRONMENT_CONFIGS[env];

  const solanaChainName =
    env === "mainnet" ? "solana-mainnet-beta" : "solana-devnet";
  const solanaConfig = config[
    solanaChainName as keyof typeof config
  ] as EnvironmentChainConfig;

  if (!solanaConfig?.vaultAddress) {
    throw new Error(
      `No Solana vault address configured for environment: ${env}`
    );
  }

  const programId = new anchor.web3.PublicKey(solanaConfig.vaultAddress);
  const connection = getSolanaConnection(env);
  const keypair = getSolanaKeypair();

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(keypair),
    {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }
  );

  return new anchor.Program(IDL, programId, provider);
}

interface SimulationResult {
  success: boolean;
  error?: string;
  gasEstimate?: bigint;
}

interface BrokerCreationResult {
  success: boolean;
  brokerId?: string;
  transactionHashes?: Record<number, string>;
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

    if (!isInitialized) {
      initializeBrokerCreation();
    }

    console.log(
      `🚀 Starting broker creation for broker ID: ${brokerId} on environment: ${env}`
    );

    const evmChains: Array<[string, EnvironmentChainConfig]> = [];
    const solanaChains: Array<[string, EnvironmentChainConfig]> = [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      const chainInfo = ALL_CHAINS[chainName as ChainName];
      if (!chainInfo) {
        console.warn(`⚠️ No chain info found for: ${chainName}`);
        continue;
      }

      if (chainInfo.chainType === "EVM") {
        evmChains.push([chainName, chainConfig]);
      } else if (chainInfo.chainType === "SOL") {
        solanaChains.push([chainName, chainConfig]);
      }
    }

    console.log(
      `📊 Found ${evmChains.length} EVM chains and ${solanaChains.length} Solana chains`
    );

    const simulationPromises: Array<
      Promise<{ chainName: string; result: SimulationResult }>
    > = [];

    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateVaultTransaction(chainConfig, brokerId, chainName).then(
            result => ({ chainName, result })
          )
        );
      }
    }

    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultManagerAddress) {
        simulationPromises.push(
          simulateVaultManagerTransaction(
            chainConfig,
            brokerId,
            chainName
          ).then(result => ({ chainName, result }))
        );
      }
    }

    for (const [chainName, chainConfig] of solanaChains) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateSolanaVaultTransaction(chainConfig, brokerId, chainName).then(
            result => ({ chainName, result })
          )
        );
      }
    }

    const simulationResults = await Promise.all(simulationPromises);

    const failedSimulations = simulationResults.filter(
      ({ result }) => !result.success
    );

    if (failedSimulations.length > 0) {
      const errors = failedSimulations.map(
        ({ chainName, result }) => `${chainName}: ${result.error}`
      );
      console.error("❌ Some simulations failed:", errors);
      return {
        success: false,
        errors,
      };
    }

    console.log("✅ All simulations passed, executing transactions...");

    const executionPromises: Array<
      Promise<{ chainId: number; txHash: string }>
    > = [];

    for (const [chainName, chainConfig] of evmChains) {
      const chainId = ALL_CHAINS[chainName as ChainName].chainId;
      if (chainConfig.vaultAddress) {
        executionPromises.push(
          executeVaultTransaction(chainConfig, brokerId, chainName).then(
            txHash => ({ chainId, txHash })
          )
        );
      } else if (chainConfig.vaultManagerAddress) {
        executionPromises.push(
          executeVaultManagerTransaction(chainConfig, brokerId, chainName).then(
            txHash => ({ chainId, txHash })
          )
        );
      }
    }

    for (const [chainName, chainConfig] of solanaChains) {
      const chainId = ALL_CHAINS[chainName as ChainName].chainId;
      if (chainConfig.vaultAddress) {
        executionPromises.push(
          executeSolanaVaultTransaction(chainConfig, brokerId, chainName).then(
            txHash => ({ chainId, txHash })
          )
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

    const simulationResult = await simulateFeeManagerTransaction(
      orderlyConfig,
      brokerId,
      accountId,
      orderlyChainName
    );

    if (!simulationResult.success) {
      throw new Error(`Simulation failed: ${simulationResult.error}`);
    }

    const orderlyChainConfig = ALL_CHAINS[orderlyChainName];
    const provider = new ethers.JsonRpcProvider(orderlyChainConfig.rpcUrl);
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);

    const feeManager = FeeManager__factory.connect(
      orderlyConfig.feeManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);
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

async function simulateVaultTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
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

async function simulateVaultManagerTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultManagerAddress) {
      throw new Error("VaultManager address not configured for Orderly L2");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
    const vaultManager = VaultManager__factory.connect(
      chainConfig.vaultManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);
    const isAllowed = await vaultManager.getAllowedBroker(brokerHash);
    if (isAllowed) {
      throw new Error(`Broker ${brokerId} already exists on ${chainName}`);
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

async function simulateFeeManagerTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  accountId: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.feeManagerAddress) {
      throw new Error("FeeManager address not configured for Orderly L2");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
    const feeManager = FeeManager__factory.connect(
      chainConfig.feeManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);
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

    return { success: true, gasEstimate };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function simulateSolanaVaultTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const env = getCurrentEnvironment();
    const program = getSolanaVaultProgram(env);
    const keypair = getSolanaKeypair();

    const brokerHash = getSolanaBrokerHash(brokerId);
    const brokerPda = getSolanaBrokerPda(program.programId, brokerHash);

    const brokerAccount =
      await program.provider.connection.getAccountInfo(brokerPda);
    if (brokerAccount) {
      const allowedBrokerData =
        await program.account.allowedBroker.fetch(brokerPda);
      if (allowedBrokerData.allowed) {
        throw new Error(
          `Broker ${brokerId} already exists and is allowed on ${chainName}`
        );
      }
    }

    const balance = await program.provider.connection.getBalance(
      keypair.publicKey
    );
    const estimatedFee = 5000;

    if (balance < estimatedFee) {
      throw new Error(
        `Insufficient balance. Required: ${estimatedFee} lamports, Available: ${balance} lamports`
      );
    }

    const brokerManagerRoleHash = getManagerRoleHash(BROKER_MANAGER_ROLE);
    console.log("brokerManagerRoleHash", brokerManagerRoleHash);
    const codedBrokerManagerRoleHash = Array.from(
      Buffer.from(brokerManagerRoleHash.slice(2), "hex")
    );
    console.log("codedBrokerManagerRoleHash", codedBrokerManagerRoleHash);
    const brokerManagerRolePda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(ACCESS_CONTROL_SEED, "utf8"),
        Buffer.from(codedBrokerManagerRoleHash),
        keypair.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
    console.log("keypair.publicKey", keypair.publicKey);
    console.log("program.programId", program.programId);
    console.log("brokerManagerRolePda", brokerManagerRolePda);

    const codedBrokerHash = Array.from(Buffer.from(brokerHash.slice(2), "hex"));
    console.log("codedBrokerHash", codedBrokerHash);

    await program.methods
      .setBroker({
        brokerManagerRole: codedBrokerManagerRoleHash,
        brokerHash: codedBrokerHash,
        allowed: true,
      })
      .accounts({
        brokerManager: keypair.publicKey,
        allowedBroker: brokerPda,
        managerRole: brokerManagerRolePda,
        systemProgram: SystemProgram.programId,
      })
      .simulate();

    console.log(
      `🔍 Solana simulation successful for broker ${brokerId} on ${chainName}`
    );
    return { success: true };
  } catch (error) {
    console.log("error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown simulation error",
    };
  }
}

async function executeVaultTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
  const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vault.setAllowedBroker(brokerHash, true);
  await tx.wait();

  return tx.hash;
}

async function executeVaultManagerTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultManagerAddress) {
    throw new Error("VaultManager address not configured for Orderly L2");
  }

  const provider = getEvmProvider(chainName);
  const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
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

    const wallet = new ethers.Wallet(getEvmPrivateKey());
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
  const chainInfo = ALL_CHAINS[chainName as ChainName];
  if (!chainInfo) {
    return {
      chain: chainName,
      hasPermission: false,
      contractType: "Unknown",
      error: "Chain not found in configuration",
    };
  }

  if (chainInfo.chainType === "EVM") {
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
  } else if (chainInfo.chainType === "SOL") {
    if (chainConfig.vaultAddress) {
      try {
        const hasPermission = await checkSolanaPermissions(chainConfig);
        return {
          chain: chainName,
          hasPermission,
          contractType: "SolanaVault",
          error: hasPermission
            ? undefined
            : "Missing BROKER_MANAGER_ROLE on Solana Vault program",
        };
      } catch (error) {
        return {
          chain: chainName,
          hasPermission: false,
          contractType: "SolanaVault",
          error: `Error checking permissions: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }

    return {
      chain: chainName,
      hasPermission: true,
      contractType: "None",
      error: "No broker creation contracts on this Solana chain",
    };
  }

  return {
    chain: chainName,
    hasPermission: false,
    contractType: "Unknown",
    error: "Unsupported chain type",
  };
}

async function checkL1Permissions(
  chainConfig: EnvironmentChainConfig,
  walletAddress: string,
  chainName: string
): Promise<boolean> {
  try {
    if (!chainConfig.vaultAddress) return false;

    const provider = getEvmProvider(chainName);
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

    const provider = getEvmProvider(chainName);
    const vaultManager = VaultManager__factory.connect(
      chainConfig.vaultManagerAddress,
      provider
    );

    const BROKER_MANAGER_ROLE = await vaultManager.BROKER_MANAGER_ROLE();
    return vaultManager.hasRole(BROKER_MANAGER_ROLE, walletAddress);
  } catch (error) {
    console.error("Error checking Orderly permissions:", error);
    return false;
  }
}

async function checkSolanaPermissions(
  chainConfig: EnvironmentChainConfig
): Promise<boolean> {
  try {
    if (!chainConfig.vaultAddress) return false;

    const env = getCurrentEnvironment();
    const program = getSolanaVaultProgram(env);
    const keypair = getSolanaKeypair();

    const brokerManagerRoleHash = getManagerRoleHash(BROKER_MANAGER_ROLE);
    const codedBrokerManagerRoleHash = Array.from(
      Buffer.from(brokerManagerRoleHash.slice(2), "hex")
    );
    const brokerManagerRolePda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(ACCESS_CONTROL_SEED, "utf8"),
        Buffer.from(codedBrokerManagerRoleHash),
        keypair.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const managerRoleAccount =
      await program.account.managerRole.fetch(brokerManagerRolePda);
    if (managerRoleAccount && managerRoleAccount.allowed) {
      return true;
    }

    const balance = await program.provider.connection.getBalance(
      keypair.publicKey
    );
    const estimatedFee = 5000;

    if (balance < estimatedFee) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking Solana permissions:", error);
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

    const balanceCheckPromises = Object.entries(config).map(
      ([chainName, chainConfig]) => {
        const chainInfo = ALL_CHAINS[chainName as ChainName];
        if (!chainInfo) {
          return Promise.resolve({
            chain: chainName,
            balance: "0.0",
            estimatedCost: "unknown",
            sufficient: false,
          });
        }

        if (chainInfo.chainType === "EVM") {
          const evmWallet = new ethers.Wallet(getEvmPrivateKey());
          return checkChainBalance(chainName, chainConfig, evmWallet.address);
        } else if (chainInfo.chainType === "SOL") {
          if (!solanaKeypair) {
            return Promise.resolve({
              chain: chainName,
              balance: "0.0",
              estimatedCost: "unknown",
              sufficient: false,
            });
          }
          return checkChainBalance(chainName, chainConfig, "");
        }

        return Promise.resolve({
          chain: chainName,
          balance: "0.0",
          estimatedCost: "unknown",
          sufficient: false,
        });
      }
    );

    const results = await Promise.all(balanceCheckPromises);

    for (const result of results) {
      balanceDetails.push(result);

      const chainInfo = ALL_CHAINS[result.chain as ChainName];
      const currency = chainInfo?.chainType === "SOL" ? "SOL" : "ETH";

      if (!result.sufficient) {
        warnings.push(
          `⚠️ ${result.chain}: Insufficient balance (${result.balance} ${currency}) for estimated gas cost (${result.estimatedCost} ${currency})`
        );
      } else {
        console.log(
          `✅ ${result.chain}: Sufficient balance (${result.balance} ${currency})`
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
  const chainInfo = ALL_CHAINS[chainName as ChainName];
  if (!chainInfo) {
    return {
      chain: chainName,
      balance: "0.0",
      estimatedCost: "unknown",
      sufficient: false,
    };
  }

  if (chainInfo.chainType === "EVM") {
    try {
      const provider = getEvmProvider(chainName);
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
      console.error(`Error checking EVM balance for ${chainName}:`, error);
      return {
        chain: chainName,
        balance: "0.0",
        estimatedCost: "unknown",
        sufficient: false,
      };
    }
  } else if (chainInfo.chainType === "SOL") {
    try {
      const env = getCurrentEnvironment();
      const connection = getSolanaConnection(env);

      const keypair = getSolanaKeypair();

      const balanceLamports = await connection.getBalance(keypair.publicKey);
      const balanceSOL = balanceLamports / 1e9;

      const estimatedFeeLamports = 5000;
      const estimatedFeeSOL = estimatedFeeLamports / 1e9;

      const sufficient = balanceLamports >= estimatedFeeLamports;

      return {
        chain: chainName,
        balance: balanceSOL.toFixed(6),
        estimatedCost: estimatedFeeSOL.toFixed(6),
        sufficient,
      };
    } catch (error) {
      console.error(`Error checking Solana balance for ${chainName}:`, error);
      return {
        chain: chainName,
        balance: "0.0",
        estimatedCost: "unknown",
        sufficient: false,
      };
    }
  }

  return {
    chain: chainName,
    balance: "0.0",
    estimatedCost: "unknown",
    sufficient: false,
  };
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
      `🗑️ Starting broker deletion for broker ID: ${brokerId} on environment: ${env}`
    );

    const evmChains: Array<[string, EnvironmentChainConfig]> = [];
    const solanaChains: Array<[string, EnvironmentChainConfig]> = [];

    for (const [chainName, chainConfig] of Object.entries(config)) {
      const chainInfo = ALL_CHAINS[chainName as ChainName];
      if (!chainInfo) {
        console.warn(`⚠️ No chain info found for: ${chainName}`);
        continue;
      }

      if (chainInfo.chainType === "EVM") {
        evmChains.push([chainName, chainConfig]);
      } else if (chainInfo.chainType === "SOL") {
        solanaChains.push([chainName, chainConfig]);
      }
    }

    console.log(
      `📊 Found ${evmChains.length} EVM chains and ${solanaChains.length} Solana chains for deletion`
    );

    const simulationPromises: Array<
      Promise<{ chainName: string; result: SimulationResult }>
    > = [];

    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateL1Deletion(chainConfig, brokerId, chainName).then(result => ({
            chainName,
            result,
          }))
        );
      }
    }

    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultManagerAddress) {
        simulationPromises.push(
          simulateOrderlyDeletion(chainConfig, brokerId, chainName).then(
            result => ({ chainName, result })
          )
        );
      }
    }

    for (const [chainName, chainConfig] of solanaChains) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateSolanaDeletion(chainConfig, brokerId, chainName).then(
            result => ({ chainName, result })
          )
        );
      }
    }

    const simulationResults = await Promise.all(simulationPromises);

    const successfulSimulations = simulationResults.filter(
      ({ result }) => result.success
    );
    const failedSimulations = simulationResults.filter(
      ({ result }) => !result.success
    );

    if (failedSimulations.length > 0) {
      console.warn(
        "⚠️ Some deletion simulations failed:",
        failedSimulations.map(
          ({ chainName, result }) => `${chainName}: ${result.error}`
        )
      );
    }

    if (successfulSimulations.length === 0) {
      const errors = failedSimulations.map(
        ({ chainName, result }) => `${chainName}: ${result.error}`
      );
      console.error("❌ All deletion simulations failed:", errors);
      return {
        success: false,
        errors,
      };
    }

    console.log(
      `✅ ${successfulSimulations.length} deletion simulations passed, executing transactions...`
    );

    const executionPromises: Array<
      Promise<{ chainId: number; txHash: string; chainName: string }>
    > = [];

    for (const { chainName } of successfulSimulations) {
      const chainConfig = config[
        chainName as keyof typeof config
      ] as EnvironmentChainConfig;
      const chainId = ALL_CHAINS[chainName as ChainName].chainId;

      if (chainConfig.vaultAddress) {
        executionPromises.push(
          executeL1Deletion(chainConfig, brokerId, chainName).then(txHash => ({
            chainId,
            txHash,
            chainName,
          }))
        );
      } else if (chainConfig.vaultManagerAddress) {
        executionPromises.push(
          executeOrderlyDeletion(chainConfig, brokerId, chainName).then(
            txHash => ({ chainId, txHash, chainName })
          )
        );
      }
    }

    for (const { chainName } of successfulSimulations) {
      const chainConfig = config[
        chainName as keyof typeof config
      ] as EnvironmentChainConfig;
      const chainId = ALL_CHAINS[chainName as ChainName].chainId;

      if (
        chainConfig.vaultAddress &&
        ALL_CHAINS[chainName as ChainName].chainType === "SOL"
      ) {
        executionPromises.push(
          executeSolanaDeletion(chainConfig, brokerId, chainName).then(
            txHash => ({ chainId, txHash, chainName })
          )
        );
      }
    }

    const results = await Promise.allSettled(executionPromises);
    const transactionHashes: Record<number, string> = {};
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { chainId, txHash, chainName } = result.value;
        transactionHashes[chainId] = txHash;
        console.log(`✅ Successfully deleted from ${chainName}: ${txHash}`);
      } else {
        errors.push(`Execution failed: ${result.reason}`);
      }
    }

    const successCount = Object.keys(transactionHashes).length;
    const totalChains = simulationResults.length;

    console.log(
      `🗑️ Deletion completed: ${successCount}/${totalChains} chains successful`
    );
    console.log(`Transaction hashes:`, transactionHashes);

    if (errors.length > 0) {
      console.warn("⚠️ Some executions failed:", errors);
    }

    return {
      success: successCount > 0,
      brokerId,
      transactionHashes,
      errors: errors.length > 0 ? errors : undefined,
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
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
    const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

    const brokerHash = getBrokerHash(brokerId);
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
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultManagerAddress) {
      throw new Error("VaultManager address not configured for Orderly L2");
    }

    const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
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

async function simulateSolanaDeletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.vaultAddress) {
      throw new Error("Vault address not configured for this chain");
    }

    const env = getCurrentEnvironment();
    const program = getSolanaVaultProgram(env);
    const keypair = getSolanaKeypair();

    const brokerHash = getSolanaBrokerHash(brokerId);
    const brokerPda = getSolanaBrokerPda(program.programId, brokerHash);

    const brokerAccount =
      await program.provider.connection.getAccountInfo(brokerPda);
    if (!brokerAccount) {
      throw new Error(`Broker ${brokerId} does not exist on ${chainName}`);
    }

    const balance = await program.provider.connection.getBalance(
      keypair.publicKey
    );
    const estimatedFee = 5000;

    if (balance < estimatedFee) {
      throw new Error(
        `Insufficient balance. Required: ${estimatedFee} lamports, Available: ${balance} lamports`
      );
    }

    const brokerManagerRoleHash = getManagerRoleHash(BROKER_MANAGER_ROLE);
    const codedBrokerManagerRoleHash = Array.from(
      Buffer.from(brokerManagerRoleHash.slice(2), "hex")
    );
    const brokerManagerRolePda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(ACCESS_CONTROL_SEED, "utf8"),
        Buffer.from(codedBrokerManagerRoleHash),
        keypair.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const codedBrokerHash = Array.from(Buffer.from(brokerHash.slice(2), "hex"));

    await program.methods
      .setBroker({
        brokerManagerRole: codedBrokerManagerRoleHash,
        brokerHash: codedBrokerHash,
        allowed: false,
      })
      .accounts({
        brokerManager: keypair.publicKey,
        allowedBroker: brokerPda,
        managerRole: brokerManagerRolePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .simulate();

    console.log(
      `🔍 Solana deletion simulation successful for broker ${brokerId} on ${chainName}`
    );
    return { success: true };
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
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const provider = new ethers.JsonRpcProvider(getRpcUrlForChain(chainName));
  const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
  const vault = Vault__factory.connect(chainConfig.vaultAddress, wallet);

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vault.setAllowedBroker(brokerHash, false);
  await tx.wait();

  return tx.hash;
}

async function executeOrderlyDeletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultManagerAddress) {
    throw new Error("VaultManager address not configured for Orderly L2");
  }

  const provider = getEvmProvider(chainName);
  const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
  const vaultManager = VaultManager__factory.connect(
    chainConfig.vaultManagerAddress,
    wallet
  );

  const brokerHash = getBrokerHash(brokerId);
  const tx = await vaultManager.setAllowedBroker(brokerHash, false);
  await tx.wait();

  return tx.hash;
}

async function executeSolanaDeletion(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const env = getCurrentEnvironment();
  const program = getSolanaVaultProgram(env);
  const keypair = getSolanaKeypair();

  const brokerHash = getSolanaBrokerHash(brokerId);
  const brokerPda = getSolanaBrokerPda(program.programId, brokerHash);

  const brokerAccount =
    await program.provider.connection.getAccountInfo(brokerPda);
  if (!brokerAccount) {
    throw new Error(`Broker ${brokerId} does not exist on ${chainName}`);
  }

  const brokerManagerRoleHash = getManagerRoleHash(BROKER_MANAGER_ROLE);
  const codedBrokerManagerRoleHash = Array.from(
    Buffer.from(brokerManagerRoleHash.slice(2), "hex")
  );
  const brokerManagerRolePda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from(ACCESS_CONTROL_SEED, "utf8"),
      Buffer.from(codedBrokerManagerRoleHash),
      keypair.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const codedBrokerHash = Array.from(Buffer.from(brokerHash.slice(2), "hex"));

  const tx = await program.methods
    .setBroker({
      brokerManagerRole: codedBrokerManagerRoleHash,
      brokerHash: codedBrokerHash,
      allowed: false,
    })
    .accounts({
      brokerManager: keypair.publicKey,
      allowedBroker: brokerPda,
      managerRole: brokerManagerRolePda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log(
    `🗑️ Solana deletion transaction executed for broker ${brokerId} on ${chainName}`
  );
  console.log(`📝 Transaction signature: ${tx}`);

  return tx;
}

async function executeSolanaVaultTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string
): Promise<string> {
  if (!chainConfig.vaultAddress) {
    throw new Error("Vault address not configured for this chain");
  }

  const env = getCurrentEnvironment();
  const program = getSolanaVaultProgram(env);
  const programId = program.programId;
  const keypair = getSolanaKeypair();

  const brokerHash = getSolanaBrokerHash(brokerId);
  const brokerPda = getSolanaBrokerPda(programId, brokerHash);

  const brokerAccount =
    await program.provider.connection.getAccountInfo(brokerPda);
  if (brokerAccount) {
    const allowedBrokerData =
      await program.account.allowedBroker.fetch(brokerPda);
    if (allowedBrokerData.allowed) {
      throw new Error(
        `Broker ${brokerId} already exists and is allowed on ${chainName}`
      );
    }
  }

  const brokerManagerRoleHash = getManagerRoleHash(BROKER_MANAGER_ROLE);
  const codedBrokerManagerRoleHash = Array.from(
    Buffer.from(brokerManagerRoleHash.slice(2), "hex")
  );
  const brokerManagerRolePda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from(ACCESS_CONTROL_SEED, "utf8"),
      Buffer.from(codedBrokerManagerRoleHash),
      keypair.publicKey.toBuffer(),
    ],
    programId
  )[0];

  const codedBrokerHash = Array.from(Buffer.from(brokerHash.slice(2), "hex"));

  const tx = await program.methods
    .setBroker({
      brokerManagerRole: codedBrokerManagerRoleHash,
      brokerHash: codedBrokerHash,
      allowed: true,
    })
    .accounts({
      brokerManager: keypair.publicKey,
      allowedBroker: brokerPda,
      managerRole: brokerManagerRolePda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log(
    `🚀 Solana transaction executed for broker ${brokerId} on ${chainName}`
  );
  console.log(`📝 Transaction signature: ${tx}`);

  return tx;
}
