import { ethers } from "ethers";
import { Environment, getCurrentEnvironment } from "../models/dex";
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
  SolConnector__factory,
  Ledger__factory,
} from "../../types/index";
import { addBrokerToAllDatabases } from "./orderlyDb";
import { getNextBrokerIndex, createBrokerIndex } from "./brokerIndex";
import { getSecret } from "./secretManager";
import { createProvider } from "./fallbackProvider";

import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { solidityPackedKeccak256 } from "ethers";
import { IDL, type SolanaVault } from "../interface/types/solana_vault";
import { default as bs58 } from "bs58";

export const BROKER_MANAGER_ROLE = "BrokerManagerRole";
export const ACCESS_CONTROL_SEED = "AccessControl";

async function retryTransaction<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Transaction attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`✅ Transaction succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `❌ Transaction attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      );

      if (attempt < maxRetries) {
        const delay = delayMs * attempt;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

let evmPrivateKey: string;
let solanaPrivateKey: string;
let solanaKeypair: anchor.web3.Keypair | null = null;
let isInitialized = false;

let brokerCreationLock: Promise<BrokerCreationResult> | null = null;

async function getWalletPrivateKeys(): Promise<{
  evmPrivateKey: string;
  solanaPrivateKey: string;
}> {
  console.log("🔧 Getting wallet private keys from secret manager...");

  const evmPrivateKey = await getSecret("brokerCreationPrivateKey");
  const solanaPrivateKey = await getSecret("brokerCreationPrivateKeySol");

  return {
    evmPrivateKey,
    solanaPrivateKey,
  };
}

export async function initializeBrokerCreation(): Promise<void> {
  if (isInitialized) {
    return;
  }

  console.log("🔧 Initializing broker creation system...");

  const walletKeys = await getWalletPrivateKeys();
  evmPrivateKey = walletKeys.evmPrivateKey;
  solanaPrivateKey = walletKeys.solanaPrivateKey;

  const evmWallet = new ethers.Wallet(evmPrivateKey);
  console.log("✅ EVM private key loaded");
  console.log(`📍 EVM wallet address: ${evmWallet.address}`);

  try {
    solanaKeypair = parseSolanaPrivateKey(solanaPrivateKey);
    console.log("✅ Solana private key loaded");
    console.log(
      `📍 Solana wallet address: ${solanaKeypair.publicKey.toString()}`
    );
  } catch (error) {
    console.error("❌ Failed to parse Solana private key:", error);
    console.error(
      "   Expected format: base58 string or [1,2,3,4,...] (JSON array of numbers)"
    );
    throw error;
  }

  isInitialized = true;
  console.log("🚀 Broker creation system initialized");
}

function ensureInitialized(): void {
  if (!isInitialized) {
    throw new Error(
      "Broker creation system not initialized. Call initializeBrokerCreation() first."
    );
  }
}

function getEvmPrivateKey(): string {
  ensureInitialized();
  return evmPrivateKey;
}

function parseSolanaPrivateKey(privateKeyInput: string): anchor.web3.Keypair {
  const trimmedInput = privateKeyInput.trim();

  if (!trimmedInput.startsWith("[") && !trimmedInput.startsWith("{")) {
    try {
      const secretKeyBytes = bs58.decode(trimmedInput);
      if (secretKeyBytes.length === 64) {
        return anchor.web3.Keypair.fromSecretKey(secretKeyBytes);
      }
      throw new Error(
        `Invalid base58 private key length: ${secretKeyBytes.length} bytes, expected 64`
      );
    } catch {
      console.warn("⚠️ Failed to parse as base58, trying JSON array format...");
    }
  }

  try {
    const privateKeyArray = JSON.parse(trimmedInput);
    if (!Array.isArray(privateKeyArray)) {
      throw new Error("JSON format must be an array of numbers");
    }
    if (privateKeyArray.length !== 64) {
      throw new Error(
        `Invalid JSON array length: ${privateKeyArray.length}, expected 64`
      );
    }
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
  } catch (jsonError) {
    throw new Error(
      `Failed to parse Solana private key in both base58 and JSON formats. ` +
        `Expected: base58 string (e.g., "5Kk...xyz") or JSON array (e.g., [1,2,3,...,64]). ` +
        `Base58 error: ${jsonError instanceof Error ? jsonError.message : "Invalid format"}`
    );
  }
}

function getSolanaKeypair(): anchor.web3.Keypair {
  ensureInitialized();

  if (!solanaKeypair) {
    throw new Error("Solana keypair not initialized");
  }

  return solanaKeypair;
}

function getEvmProvider(
  chainName: string
): ethers.FallbackProvider | ethers.JsonRpcProvider {
  ensureInitialized();

  return createProvider(chainName as ChainName, true);
}

function getSolanaConnection(
  environment?: Environment
): anchor.web3.Connection {
  ensureInitialized();

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

function getSolanaWithdrawBrokerPda(
  programId: anchor.web3.PublicKey,
  brokerIndex: number
): anchor.web3.PublicKey {
  const indexBuffer = Buffer.alloc(2);
  indexBuffer.writeUInt16BE(brokerIndex, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Broker", "utf8"), indexBuffer],
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
  environment: Environment,
  brokerData: {
    brokerName: string;
    makerFee: number;
    takerFee: number;
    rwaMakerFee?: number;
    rwaTakerFee?: number;
  }
): Promise<BrokerCreationResult> {
  if (brokerCreationLock) {
    console.log(`⏳ Broker creation already in progress, waiting...`);
    try {
      await brokerCreationLock;
    } catch {}
  }

  const creationPromise = createAutomatedBrokerIdInternal(
    brokerId,
    environment,
    brokerData
  );

  const timeoutPromise = new Promise<BrokerCreationResult>((_, reject) => {
    setTimeout(
      () => {
        reject(new Error("Broker creation timed out after 2 minutes"));
      },
      2 * 60 * 1_000
    );
  });

  brokerCreationLock = Promise.race([creationPromise, timeoutPromise]);

  try {
    const result = await brokerCreationLock;
    return result;
  } finally {
    brokerCreationLock = null;
  }
}

async function createAutomatedBrokerIdInternal(
  brokerId: string,
  environment: Environment,
  brokerData: {
    brokerName: string;
    makerFee: number;
    takerFee: number;
    rwaMakerFee?: number;
    rwaTakerFee?: number;
  }
): Promise<BrokerCreationResult> {
  try {
    const env = environment || getCurrentEnvironment();
    const config = ENVIRONMENT_CONFIGS[env];

    if (!config) {
      throw new Error(`No configuration found for environment: ${env}`);
    }

    ensureInitialized();

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

    const nextBrokerIndexResult = await getNextBrokerIndex();
    if (!nextBrokerIndexResult.success) {
      throw new Error(
        `Failed to get next broker index: ${nextBrokerIndexResult.error}`
      );
    }
    const brokerIndex = nextBrokerIndexResult.data.brokerIndex;

    console.log(
      `📍 Using broker index: ${brokerIndex} for broker ID: ${brokerId}`
    );

    const orderlyChainName = env === "mainnet" ? "orderlyL2" : "orderlyTestnet";
    const orderlyConfig = config[orderlyChainName as keyof typeof config] as
      | EnvironmentChainConfig
      | undefined;

    if (!orderlyConfig || !orderlyConfig.ledgerAddress) {
      throw new Error(`No Ledger configuration found for ${orderlyChainName}`);
    }

    const evmVaultChainIds: number[] = [];
    for (const [chainName, chainConfig] of evmChains) {
      if (chainConfig.vaultAddress && chainName !== orderlyChainName) {
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        evmVaultChainIds.push(chainId);
      }
    }

    console.log(
      `📊 Will broadcast to ${evmVaultChainIds.length} EVM Vault chains via LayerZero: ${evmVaultChainIds.join(", ")}`
    );

    const simulationPromises: Array<
      Promise<{ chainName: string; result: SimulationResult }>
    > = [];

    if (evmVaultChainIds.length > 0) {
      simulationPromises.push(
        simulateLedgerSetBrokerFromLedger(
          orderlyConfig,
          brokerId,
          brokerIndex,
          evmVaultChainIds,
          orderlyChainName
        ).then(result => ({ chainName: orderlyChainName, result }))
      );
    }

    for (const [chainName, chainConfig] of solanaChains) {
      if (chainConfig.vaultAddress) {
        simulationPromises.push(
          simulateSolanaVaultTransaction(
            chainConfig,
            brokerId,
            brokerIndex,
            chainName
          ).then(result => ({ chainName, result }))
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

    console.log("🚀 Executing on-chain transactions...");

    const transactionHashes: Record<number, string> = {};
    const executionPromises: Array<Promise<void>> = [];

    if (evmVaultChainIds.length > 0) {
      console.log(
        `🌐 Executing Ledger.setBrokerFromLedger on ${orderlyChainName} (broadcasting to ${evmVaultChainIds.length} chains)...`
      );
      const orderlyChainId = ALL_CHAINS[orderlyChainName as ChainName].chainId;
      executionPromises.push(
        executeLedgerSetBrokerFromLedger(
          orderlyConfig,
          brokerId,
          brokerIndex,
          evmVaultChainIds,
          orderlyChainName
        ).then(txHash => {
          transactionHashes[orderlyChainId] = txHash;
        })
      );
    }

    for (const [chainName, chainConfig] of solanaChains) {
      if (chainConfig.vaultAddress) {
        console.log(`🔗 Executing Solana Vault transaction on ${chainName}...`);
        const chainId = ALL_CHAINS[chainName as ChainName].chainId;
        executionPromises.push(
          executeSolanaVaultTransaction(
            chainConfig,
            brokerId,
            chainName,
            brokerIndex
          ).then(txHash => {
            transactionHashes[chainId] = txHash;
          })
        );
      }
    }

    await Promise.all(executionPromises);

    console.log(`✅ Successfully created broker ID ${brokerId} on all chains`);
    console.log(`Transaction hashes:`, transactionHashes);

    console.log("💾 Adding broker to databases...");

    const localBrokerIndexResult = await createBrokerIndex(
      brokerId,
      brokerIndex
    );
    if (!localBrokerIndexResult.success) {
      console.error(
        `❌ Failed to create broker index entry: ${localBrokerIndexResult.error}`
      );
      return {
        success: false,
        brokerId,
        transactionHashes,
        errors: [
          `Blockchain transactions succeeded but local broker index creation failed: ${localBrokerIndexResult.error}`,
          "Manual database intervention may be required to sync with blockchain state",
        ],
      };
    }

    const orderlyDbResult = await addBrokerToAllDatabases({
      brokerId: brokerId,
      brokerName: brokerData.brokerName,
      makerFee: brokerData.makerFee,
      takerFee: brokerData.takerFee,
      rwaMakerFee: brokerData.rwaMakerFee,
      rwaTakerFee: brokerData.rwaTakerFee,
    });

    if (!orderlyDbResult.success) {
      console.error(
        `❌ Failed to add broker to Orderly databases: ${orderlyDbResult.error}`
      );
      return {
        success: false,
        brokerId,
        transactionHashes,
        errors: [
          `Blockchain transactions succeeded but Orderly database operation failed: ${orderlyDbResult.error}`,
          "Local broker index was created successfully",
          "Manual database intervention may be required to sync with Orderly state",
        ],
      };
    }

    console.log(`✅ Broker added to all databases with index: ${brokerIndex}`);

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

    const provider = createProvider(orderlyChainName as ChainName, true);
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);

    const feeManager = FeeManager__factory.connect(
      orderlyConfig.feeManagerAddress,
      wallet
    );

    const brokerHash = getBrokerHash(brokerId);

    const txHash = await retryTransaction(async () => {
      const tx = await feeManager.setBrokerAccountId(brokerHash, accountId);
      await tx.wait();
      return tx.hash;
    });

    console.log(
      `Successfully set broker account ID. Transaction hash: ${txHash}`
    );

    const orderlyChainId = ALL_CHAINS[orderlyChainName as ChainName].chainId;
    return {
      success: true,
      brokerId,
      transactionHashes: { [orderlyChainId]: txHash },
    };
  } catch (error) {
    console.error("Failed to set broker account ID:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export async function simulateLedgerSetBrokerFromLedger(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  brokerIndex: number,
  chainIds: number[],
  chainName: string
): Promise<SimulationResult> {
  try {
    if (!chainConfig.ledgerAddress) {
      throw new Error("Ledger address not configured for this chain");
    }

    const provider = createProvider(chainName as ChainName, true);
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
    const ledger = Ledger__factory.connect(chainConfig.ledgerAddress, wallet);

    const brokerHash = getBrokerHash(brokerId);

    const gasEstimate = await ledger.setBrokerFromLedger.estimateGas(
      chainIds,
      brokerHash,
      brokerIndex,
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

    console.log(
      `✅ ${chainName} Ledger.setBrokerFromLedger simulation successful for ${chainIds.length} chains, gas estimate: ${gasEstimate.toString()}`
    );
    return { success: true, gasEstimate };
  } catch (error) {
    console.error(
      `❌ ${chainName} Ledger.setBrokerFromLedger simulation failed:`,
      error
    );
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

    const provider = createProvider(chainName as ChainName, true);
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
  brokerIndex: number,
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
    const withdrawBrokerPda = getSolanaWithdrawBrokerPda(
      program.programId,
      brokerIndex
    );

    await program.methods
      .setWithdrawBroker({
        brokerHash: codedBrokerHash,
        brokerIndex: brokerIndex,
        allowed: true,
      })
      .accounts({
        brokerManager: keypair.publicKey,
        withdrawBroker: withdrawBrokerPda,
        managerRole: brokerManagerRolePda,
        systemProgram: SystemProgram.programId,
      })
      .simulate();

    console.log(
      `🔍 Solana simulation successful for broker ${brokerId} on ${chainName} with index ${brokerIndex}`
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

async function executeLedgerSetBrokerFromLedger(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  brokerIndex: number,
  chainIds: number[],
  chainName: string
): Promise<string> {
  if (!chainConfig.ledgerAddress) {
    throw new Error("Ledger address not configured for this chain");
  }

  return retryTransaction(async () => {
    const provider = getEvmProvider(chainName);
    const wallet = new ethers.Wallet(getEvmPrivateKey(), provider);
    const ledger = Ledger__factory.connect(chainConfig.ledgerAddress!, wallet);

    const brokerHash = getBrokerHash(brokerId);

    const tx = await ledger.setBrokerFromLedger(
      chainIds,
      brokerHash,
      brokerIndex,
      true
    );
    await tx.wait();

    console.log(
      `🚀 Ledger.setBrokerFromLedger executed for broker ${brokerId} on ${chainName} (broadcasting to ${chainIds.length} chains): ${tx.hash}`
    );

    return tx.hash;
  });
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

    if (chainConfig.solConnectorAddress) {
      try {
        const hasPermission = await checkSolConnectorPermissions(
          chainConfig,
          walletAddress,
          chainName
        );
        return {
          chain: chainName,
          hasPermission,
          contractType: "SolConnector",
          error: hasPermission
            ? undefined
            : "Missing BROKER_MANAGER_ROLE on SolConnector contract",
        };
      } catch (error) {
        return {
          chain: chainName,
          hasPermission: false,
          contractType: "SolConnector",
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

async function checkSolConnectorPermissions(
  chainConfig: EnvironmentChainConfig,
  walletAddress: string,
  chainName: string
): Promise<boolean> {
  try {
    if (!chainConfig.solConnectorAddress) return false;

    const provider = getEvmProvider(chainName);
    const solConnector = SolConnector__factory.connect(
      chainConfig.solConnectorAddress,
      provider
    );

    const BROKER_MANAGER_ROLE = await solConnector.BROKER_MANAGER_ROLE();
    return await solConnector.hasRole(BROKER_MANAGER_ROLE, walletAddress);
  } catch (error) {
    console.error("Error checking SolConnector permissions:", error);
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

async function executeSolanaVaultTransaction(
  chainConfig: EnvironmentChainConfig,
  brokerId: string,
  chainName: string,
  brokerIndex: number
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

  const setBrokerTx = await program.methods
    .setBroker({
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
    `🚀 Solana setBroker transaction executed for broker ${brokerId} on ${chainName}: ${setBrokerTx}`
  );

  const withdrawBrokerPda = getSolanaWithdrawBrokerPda(programId, brokerIndex);

  const setWithdrawBrokerTx = await program.methods
    .setWithdrawBroker({
      brokerHash: codedBrokerHash,
      brokerIndex: brokerIndex,
      allowed: true,
    })
    .accounts({
      brokerManager: keypair.publicKey,
      withdrawBroker: withdrawBrokerPda,
      managerRole: brokerManagerRolePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(
    `🚀 Solana setWithdrawBroker transaction executed for broker ${brokerId} on ${chainName}: ${setWithdrawBrokerTx}`
  );

  return setBrokerTx;
}
