/**
 * GitHub API client with ETag caching
 *
 * This module wraps the Octokit client with hooks that implement
 * ETag-based caching to reduce GitHub API rate limit consumption.
 *
 * The implementation:
 * 1. Uses Octokit hooks to intercept requests and responses
 * 2. Stores ETag headers and response data from successful requests
 * 3. Adds If-None-Match headers for subsequent requests to the same endpoints
 * 4. Returns cached data when GitHub responds with 304 Not Modified
 *
 * This implementation helps to:
 * - Reduce rate limit usage (304 responses don't count against rate limits)
 * - Improve response times for repeated requests
 * - Work seamlessly with existing code using the Octokit client
 */
import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import sodium from "libsodium-wrappers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GitHubResult, GitHubError, GitHubErrorType } from "./types";

let __dirname: string;
if (typeof import.meta !== "undefined" && import.meta.url) {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __dirname = (global as any).__dirname || process.cwd();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const etagCache = new Map<string, { etag: string; data: any }>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Returns stats about the GitHub ETag cache
 */
export function getGitHubETagCacheStats() {
  return {
    cacheSize: etagCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate:
      cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0,
    savedApiCalls: cacheHits,
  };
}

const MyOctokit = Octokit.plugin(restEndpointMethods);
const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
});

function getCacheKey(options: any): string {
  let url = options.url;

  if (url) {
    url = url.replace(/{([^}]+)}/g, (_: any, key: string) => {
      return options[key] ?? `{${key}}`;
    });
  }

  if (options.method && options.baseUrl && options.url) {
    return `${options.method} ${options.baseUrl}${url}`;
  }

  if (typeof options === "string") {
    return options;
  }

  return `${options.method || "GET"} ${options.url || ""}:${JSON.stringify(options.params || {})}`;
}

octokit.hook.before("request", async options => {
  try {
    if (options.method !== "GET") {
      return;
    }

    const cacheKey = getCacheKey(options);
    const cachedItem = etagCache.get(cacheKey);

    if (cachedItem) {
      if (!options.headers) {
        options.headers = {
          accept: "application/vnd.github.v3+json",
          "user-agent": "orderly-dex-creator",
        };
      } else {
        options.headers.accept =
          options.headers.accept || "application/vnd.github.v3+json";
        options.headers["user-agent"] =
          options.headers["user-agent"] || "orderly-dex-creator";
      }

      options.headers["If-None-Match"] = cachedItem.etag;
      console.log(`[GitHub ETag] Using cached ETag for ${cacheKey}`);
    }
  } catch (error) {
    console.error("[GitHub ETag] Error in before hook:", error);
  }
});

octokit.hook.after("request", async (response, options) => {
  try {
    if (options.method !== "GET") {
      return;
    }

    const cacheKey = getCacheKey(options);

    if (response.headers?.etag) {
      etagCache.set(cacheKey, {
        etag: response.headers.etag,
        data: response.data,
      });
      cacheMisses++;
      console.log(
        `[GitHub ETag] Cache MISS for ${cacheKey} - stored ETag: ${response.headers.etag}`
      );
    }
  } catch (error) {
    console.error("[GitHub ETag] Error in after hook:", error);
  }
});

function isRequestError(error: Error | any): error is {
  status: number;
  message?: string;
  response?: { headers?: any; url?: string };
} {
  return error && typeof error === "object" && "status" in error;
}

/**
 * Converts GitHub API errors to structured error types
 */
function handleGitHubError(error: unknown, operation: string): GitHubError {
  if (isRequestError(error)) {
    const status = error.status;
    const message = error.message || "Unknown GitHub API error";

    switch (status) {
      case 401:
      case 403:
        return {
          type: GitHubErrorType.FORK_PERMISSION_DENIED,
          message: `Permission denied for ${operation}: ${message}`,
          details: { status, originalError: error },
        };
      case 404:
        return {
          type: GitHubErrorType.FORK_REPOSITORY_NOT_FOUND,
          message: `Repository not found for ${operation}: ${message}`,
          details: { status, originalError: error },
        };
      case 422:
        if (
          message.includes("already exists") ||
          message.includes("name already taken")
        ) {
          return {
            type: GitHubErrorType.FORK_REPOSITORY_ALREADY_EXISTS,
            message: `Repository already exists for ${operation}: ${message}`,
            details: { status, originalError: error },
          };
        }
        return {
          type: GitHubErrorType.FORK_UNKNOWN_ERROR,
          message: `Validation error for ${operation}: ${message}`,
          details: { status, originalError: error },
        };
      case 429:
        return {
          type: GitHubErrorType.FORK_RATE_LIMITED,
          message: `Rate limited for ${operation}: ${message}`,
          details: { status, originalError: error },
        };
      default:
        return {
          type: GitHubErrorType.FORK_UNKNOWN_ERROR,
          message: `GitHub API error for ${operation}: ${message}`,
          details: { status, originalError: error },
        };
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    type: GitHubErrorType.FORK_UNKNOWN_ERROR,
    message: `Unknown error for ${operation}: ${message}`,
    details: { originalError: error },
  };
}

octokit.hook.error("request", async (error, options) => {
  try {
    if (isRequestError(error)) {
      if (error.status === 304) {
        if (options.method !== "GET") {
          throw error;
        }

        const cacheKey = getCacheKey(options);
        const cachedItem = etagCache.get(cacheKey);

        if (cachedItem) {
          cacheHits++;
          console.log(
            `[GitHub ETag] Cache HIT for ${cacheKey} - using cached data`
          );

          return {
            data: cachedItem.data,
            headers: { ...error.response?.headers, "x-cached": "true" },
            status: 200,
            url: error.response?.url,
          };
        }
      }

      console.error(
        `[GitHub ETag] Error for ${getCacheKey(options)}:`,
        error.status,
        error.message
      );
    } else {
      console.error(
        `[GitHub ETag] Error for ${getCacheKey(options)}:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    throw error;
  } catch (hookError) {
    console.error("[GitHub ETag] Error in error hook:", hookError);
    throw error;
  }
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const templateRepo =
  process.env.GITHUB_TEMPLATE_REPO ||
  "OrderlyNetworkDexCreator/dex-creator-template";
const [templateOwner, templateRepoName] = templateRepo.split("/");

/**
 * Creates a fork of the template repository for a user's DEX
 * @param repoName The name for the new repository
 * @returns The URL of the created repository
 */
export async function forkTemplateRepository(
  repoName: string
): Promise<GitHubResult<string>> {
  try {
    if (!repoName || repoName.trim() === "") {
      return {
        success: false,
        error: {
          type: GitHubErrorType.REPOSITORY_NAME_EMPTY,
          message: "Repository name cannot be empty",
        },
      };
    }

    if (!/^[a-z0-9-]+$/i.test(repoName)) {
      return {
        success: false,
        error: {
          type: GitHubErrorType.REPOSITORY_NAME_INVALID,
          message:
            "Repository name can only contain alphanumeric characters and hyphens",
        },
      };
    }

    if (repoName.length > 100) {
      return {
        success: false,
        error: {
          type: GitHubErrorType.REPOSITORY_NAME_TOO_LONG,
          message:
            "Repository name exceeds GitHub's maximum length of 100 characters",
        },
      };
    }

    console.log(
      `Forking repository ${templateOwner}/${templateRepoName} to OrderlyNetworkDexCreator/${repoName}`
    );

    const orgName = "OrderlyNetworkDexCreator";

    const response = await octokit.rest.repos.createFork({
      owner: templateOwner,
      repo: templateRepoName,
      organization: orgName,
      name: repoName,
    });

    const repoUrl = response.data.html_url;
    console.log(`Successfully forked repository: ${repoUrl}`);

    console.log("Waiting for fork to be fully created...");
    await new Promise(resolve => setTimeout(resolve, 5_000));

    await enableRepositoryActions(orgName, repoName);

    const deploymentToken = process.env.TEMPLATE_PAT;
    if (deploymentToken) {
      try {
        await addSecretToRepository(
          orgName,
          repoName,
          "TEMPLATE_PAT",
          deploymentToken
        );
        console.log(`Added TEMPLATE_PAT secret to ${orgName}/${repoName}`);
      } catch (secretError) {
        console.error(
          "Error adding GitHub Pages deployment token secret:",
          secretError
        );
      }
    } else {
      console.warn("TEMPLATE_PAT not found in environment variables");
      console.warn("GitHub Pages deployment may not work without this token");
    }

    try {
      await enableGitHubPages(orgName, repoName);
      console.log(`Enabled GitHub Pages for ${orgName}/${repoName}`);
    } catch (pagesError) {
      console.error("Error enabling GitHub Pages:", pagesError);
    }

    return {
      success: true,
      data: repoUrl,
    };
  } catch (error: unknown) {
    console.error("Error forking repository:", error);
    return {
      success: false,
      error: handleGitHubError(error, "fork repository"),
    };
  }
}

/**
 * Enables GitHub Actions on a repository
 * This is necessary because GitHub disables Actions by default on forked repositories
 * that contain workflows
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 */
async function enableRepositoryActions(
  owner: string,
  repo: string
): Promise<void> {
  try {
    await octokit.rest.actions.setGithubActionsPermissionsRepository({
      owner,
      repo,
      enabled: true,
      allowed_actions: "all",
    });

    await octokit.rest.actions.setGithubActionsDefaultWorkflowPermissionsRepository(
      {
        owner,
        repo,
        default_workflow_permissions: "write",
      }
    );
    console.log(`GitHub Actions successfully enabled on ${owner}/${repo}`);
  } catch (error) {
    console.error(`Error enabling GitHub Actions on ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Adds a secret to a GitHub repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param secretName The name of the secret
 * @param secretValue The plaintext value of the secret
 */
async function addSecretToRepository(
  owner: string,
  repo: string,
  secretName: string,
  secretValue: string
): Promise<void> {
  try {
    console.log(`Adding secret ${secretName} to ${owner}/${repo}...`);

    console.log(`Fetching public key for ${owner}/${repo}...`);
    const { data: publicKeyData } = await octokit.rest.actions.getRepoPublicKey(
      {
        owner,
        repo,
      }
    );

    console.log(`Received public key: ${publicKeyData.key}`);

    const encryptedValue = await encryptSecret(publicKeyData.key, secretValue);

    console.log(`Submitting encrypted secret to GitHub...`);
    await octokit.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: secretName,
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id,
    });

    console.log(`Successfully added secret ${secretName} to ${owner}/${repo}`);
  } catch (error) {
    console.error(
      `Error adding secret ${secretName} to ${owner}/${repo}:`,
      error
    );
    throw error;
  }
}

/**
 * Encrypts a secret using the repository's public key
 * @param publicKey The repository's public key (from GitHub API)
 * @param secretValue The plaintext secret value to encrypt
 * @returns The encrypted secret value ready for GitHub API
 */
async function encryptSecret(
  publicKey: string,
  secretValue: string
): Promise<string> {
  try {
    await sodium.ready;

    console.log("Processing public key:", publicKey);

    let normalizedKey = publicKey;
    if (publicKey.length % 4 !== 0) {
      const padding = 4 - (publicKey.length % 4);
      normalizedKey = publicKey + "=".repeat(padding);
      console.log("Added padding to key:", normalizedKey);
    }

    const buffer = Buffer.from(normalizedKey, "base64");
    const publicKeyBinary = new Uint8Array(buffer);

    if (publicKeyBinary.length !== 32) {
      console.error(
        `Invalid key length: ${publicKeyBinary.length} bytes, expected 32 bytes`
      );
      throw new Error("Invalid key length for GitHub encryption");
    }

    const secretBinary = sodium.from_string(secretValue);

    const encryptedBinary = sodium.crypto_box_seal(
      secretBinary,
      publicKeyBinary
    );

    const base64 = Buffer.from(encryptedBinary).toString("base64");
    console.log("Encrypted value (first 20 chars):", base64.substring(0, 20));

    return base64;
  } catch (error) {
    console.error("Error encrypting secret:", error);
    throw error;
  }
}

/**
 * Extract image data from a data URI
 * @param dataUri The data URI string
 * @returns The raw binary data buffer or null if invalid
 */
function extractImageDataFromUri(dataUri: string | undefined): Buffer | null {
  if (!dataUri) return null;

  try {
    const match = dataUri.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (!match || !match[2]) {
      console.warn("Invalid data URI format for image");
      return null;
    }

    return Buffer.from(match[2], "base64");
  } catch (error) {
    console.error("Error extracting image data from URI:", error);
    return null;
  }
}

function prepareDexConfigContent(
  config: {
    brokerId: string;
    brokerName: string;
    chainIds?: number[];
    defaultChain?: number;
    themeCSS?: string;
    telegramLink?: string;
    discordLink?: string;
    xLink?: string;
    walletConnectProjectId?: string;
    privyAppId?: string;
    privyTermsOfUse?: string;
    privyLoginMethods?: string;
    enabledMenus?: string;
    customMenus?: string;
    enableAbstractWallet?: boolean;
    disableMainnet?: boolean;
    disableTestnet?: boolean;
    disableEvmWallets?: boolean;
    disableSolanaWallets?: boolean;
    enableCampaigns?: boolean;
    tradingViewColorConfig?: string;
    availableLanguages?: string[];
    seoSiteName?: string;
    seoSiteDescription?: string;
    seoSiteLanguage?: string;
    seoSiteLocale?: string;
    seoTwitterHandle?: string;
    seoThemeColor?: string;
    seoKeywords?: string;
  },
  files?: {
    primaryLogo?: string;
    secondaryLogo?: string;
    favicon?: string;
    pnlPosters?: string[];
  },
  customDomain?: string,
  repoUrl?: string
): {
  configJsContent: string;
  envContent: string;
  themeCSS?: string;
  faviconData?: Buffer;
  primaryLogoData?: Buffer;
  secondaryLogoData?: Buffer;
  pnlPostersData?: Buffer[];
} {
  const faviconData = extractImageDataFromUri(files?.favicon);
  const primaryLogoData = extractImageDataFromUri(files?.primaryLogo);
  const secondaryLogoData = extractImageDataFromUri(files?.secondaryLogo);

  const pnlPostersData =
    (files?.pnlPosters
      ?.map(poster => extractImageDataFromUri(poster))
      .filter(Boolean) as Buffer[]) || [];

  const generateSiteUrl = (): string => {
    if (customDomain) {
      return `https://${customDomain}`;
    }

    if (repoUrl) {
      try {
        const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
        if (match && match[1]) {
          const repoName = match[1];
          return `https://dex.orderly.network/${repoName}/`;
        }
      } catch (error) {
        console.error("Error constructing deployment URL:", error);
      }
    }

    return "";
  };

  const mainnetChainIds = [
    42161, // Arbitrum One
    10, // Optimism
    8453, // Base
    5000, // Mantle
    1, // Ethereum
    56, // BNB Chain
    1329, // Sei
    43114, // Avalanche
    900900900, // Solana
    2818, // Morph
    146, // Sonic
    80094, // Berachain
    1514, // Story
    34443, // Mode
    98866, // Plume
    2741, // Abstract
  ];

  const testnetChainIds = [
    421614, // Arbitrum Sepolia
    84532, // Base Sepolia
    97, // BSC Testnet
    901901901, // Solana Devnet
    11124, // Abstract Sepolia
  ];

  const selectedChainIds = config.chainIds || [];
  const selectedMainnetChains = selectedChainIds.filter(id =>
    mainnetChainIds.includes(id)
  );
  const selectedTestnetChains = selectedChainIds.filter(id =>
    testnetChainIds.includes(id)
  );

  const runtimeConfig = {
    // Broker settings
    VITE_ORDERLY_BROKER_ID: config.brokerId,
    VITE_ORDERLY_BROKER_NAME: config.brokerName,

    // Network settings
    VITE_DISABLE_MAINNET: String(config.disableMainnet ?? false),
    VITE_DISABLE_TESTNET: String(config.disableTestnet ?? false),
    VITE_ORDERLY_MAINNET_CHAINS: selectedMainnetChains.join(","),
    VITE_ORDERLY_TESTNET_CHAINS: selectedTestnetChains.join(","),
    VITE_DEFAULT_CHAIN: config.defaultChain ? String(config.defaultChain) : "",

    // Wallet settings
    VITE_PRIVY_APP_ID: config.privyAppId || "",
    VITE_PRIVY_LOGIN_METHODS: config.privyLoginMethods || "email",
    VITE_PRIVY_TERMS_OF_USE: config.privyTermsOfUse || "",
    VITE_ENABLE_ABSTRACT_WALLET: String(config.enableAbstractWallet ?? false),
    VITE_DISABLE_EVM_WALLETS: String(config.disableEvmWallets ?? false),
    VITE_DISABLE_SOLANA_WALLETS: String(config.disableSolanaWallets ?? false),
    VITE_WALLETCONNECT_PROJECT_ID: config.walletConnectProjectId || "",

    // UI/Branding settings
    VITE_APP_NAME: config.brokerName || "Orderly App",
    VITE_APP_DESCRIPTION:
      config.seoSiteDescription || "Orderly Trading Application",
    VITE_HAS_PRIMARY_LOGO: primaryLogoData ? "true" : "false",
    VITE_HAS_SECONDARY_LOGO: secondaryLogoData ? "true" : "false",

    // Navigation
    VITE_ENABLED_MENUS:
      config.enabledMenus || "Trading,Portfolio,Markets,Leaderboard",
    VITE_CUSTOM_MENUS: config.customMenus || "",
    VITE_ENABLE_CAMPAIGNS: String(config.enableCampaigns ?? false),

    // Social links
    VITE_TELEGRAM_URL: config.telegramLink || "",
    VITE_DISCORD_URL: config.discordLink || "",
    VITE_TWITTER_URL: config.xLink || "",

    // SEO settings
    VITE_SEO_SITE_NAME: config.seoSiteName || "",
    VITE_SEO_SITE_DESCRIPTION: config.seoSiteDescription || "",
    VITE_SEO_SITE_URL: generateSiteUrl(),
    VITE_SEO_SITE_LANGUAGE: config.seoSiteLanguage || "en",
    VITE_SEO_SITE_LOCALE: config.seoSiteLocale || "en_US",
    VITE_SEO_TWITTER_HANDLE: config.seoTwitterHandle || "",
    VITE_SEO_THEME_COLOR: config.seoThemeColor || "#000000",
    VITE_SEO_KEYWORDS: config.seoKeywords || "",

    // Language settings
    VITE_AVAILABLE_LANGUAGES: (config.availableLanguages || ["en"]).join(","),

    // PnL/Trading View
    VITE_USE_CUSTOM_PNL_POSTERS: pnlPostersData.length > 0 ? "true" : "false",
    VITE_CUSTOM_PNL_POSTER_COUNT: String(pnlPostersData.length),
    VITE_TRADING_VIEW_COLOR_CONFIG: config.tradingViewColorConfig || "",
  };

  const configJsContent = `window.__RUNTIME_CONFIG__ = ${JSON.stringify(
    runtimeConfig,
    null,
    2
  )};`;

  const envContent =
    "# Build-time environment variables only\n# Runtime configuration is in /public/config.js";

  return {
    configJsContent,
    envContent,
    themeCSS: config.themeCSS,
    faviconData: faviconData || undefined,
    primaryLogoData: primaryLogoData || undefined,
    secondaryLogoData: secondaryLogoData || undefined,
    pnlPostersData: pnlPostersData.length > 0 ? pnlPostersData : undefined,
  };
}

/**
 * Helper function to create a single commit with multiple file changes
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param fileContents Map of file paths to their contents
 * @param binaryFiles Map of file paths to their binary contents
 * @param commitMessage The commit message
 */
async function createSingleCommit(
  owner: string,
  repo: string,
  fileContents: Map<string, string>,
  binaryFiles: Map<string, Buffer> = new Map(),
  commitMessage: string
): Promise<void> {
  console.log(`Getting latest commit for ${owner}/${repo}...`);
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });
  const latestCommitSha = refData.object.sha;

  console.log("Creating blobs for text files...");
  const textBlobPromises = Array.from(fileContents.entries()).map(
    ([path, content]) =>
      octokit.rest.git
        .createBlob({
          owner,
          repo,
          content: Buffer.from(content).toString("base64"),
          encoding: "base64",
        })
        .then(response => ({ path, sha: response.data.sha }))
  );

  console.log("Creating blobs for binary files...");
  const binaryBlobPromises = Array.from(binaryFiles.entries()).map(
    ([path, buffer]) =>
      octokit.rest.git
        .createBlob({
          owner,
          repo,
          content: buffer.toString("base64"),
          encoding: "base64",
        })
        .then(response => ({ path, sha: response.data.sha }))
  );

  const textBlobs = await Promise.all(textBlobPromises);
  const binaryBlobs = await Promise.all(binaryBlobPromises);

  const treeEntries = [
    ...textBlobs.map(({ path, sha }) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      sha,
    })),
    ...binaryBlobs.map(({ path, sha }) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      sha,
    })),
  ];

  console.log("Creating git tree with all files...");
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: latestCommitSha,
    tree: treeEntries,
  });

  console.log("Creating commit with all files...");
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  console.log("Updating branch reference...");
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: newCommit.sha,
  });

  console.log(`Successfully committed changes to ${owner}/${repo}`);
}

/**
 * Updates DEX configuration files in the repository using a single commit
 */
export async function updateDexConfig(
  owner: string,
  repo: string,
  config: {
    brokerId: string;
    brokerName: string;
    chainIds?: number[];
    defaultChain?: number;
    themeCSS?: string;
    telegramLink?: string;
    discordLink?: string;
    xLink?: string;
    walletConnectProjectId?: string;
    privyAppId?: string;
    privyTermsOfUse?: string;
    privyLoginMethods?: string;
    enabledMenus?: string;
    customMenus?: string;
    enableAbstractWallet?: boolean;
    disableMainnet?: boolean;
    disableTestnet?: boolean;
    disableEvmWallets?: boolean;
    disableSolanaWallets?: boolean;
    enableCampaigns?: boolean;
    tradingViewColorConfig?: string;
    availableLanguages?: string[];
    seoSiteName?: string;
    seoSiteDescription?: string;
    seoSiteLanguage?: string;
    seoSiteLocale?: string;
    seoTwitterHandle?: string;
    seoThemeColor?: string;
    seoKeywords?: string;
  },
  files?: {
    primaryLogo?: string;
    secondaryLogo?: string;
    favicon?: string;
    pnlPosters?: string[];
  },
  customDomain?: string
): Promise<void> {
  try {
    const {
      configJsContent,
      envContent,
      themeCSS,
      faviconData,
      primaryLogoData,
      secondaryLogoData,
      pnlPostersData,
    } = prepareDexConfigContent(
      config,
      files,
      customDomain,
      `https://github.com/${owner}/${repo}`
    );

    const fileContents = new Map<string, string>();
    fileContents.set("public/config.js", configJsContent);
    fileContents.set(".env", envContent);

    if (themeCSS) {
      fileContents.set("app/styles/theme.css", themeCSS);
    }

    const binaryFiles = new Map<string, Buffer>();

    if (faviconData) {
      binaryFiles.set("public/favicon.webp", faviconData);
    }

    if (primaryLogoData) {
      binaryFiles.set("public/logo.webp", primaryLogoData);
    }

    if (secondaryLogoData) {
      binaryFiles.set("public/logo-secondary.webp", secondaryLogoData);
    }

    if (pnlPostersData) {
      pnlPostersData.forEach((posterData, index) => {
        binaryFiles.set(`public/pnl/poster_bg_${index + 1}.webp`, posterData);
      });
    }

    await createSingleCommit(
      owner,
      repo,
      fileContents,
      binaryFiles,
      "Update DEX configuration and branding"
    );
  } catch (error: unknown) {
    console.error("Error updating DEX configuration:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to update DEX configuration: ${errorMessage}`);
  }
}

/**
 * Enables GitHub Pages for a repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 */
async function enableGitHubPages(owner: string, repo: string): Promise<void> {
  console.log(`Enabling GitHub Pages for ${owner}/${repo}...`);

  await octokit.rest.repos.createPagesSite({
    owner,
    repo,
    build_type: "workflow",
  });

  console.log(`Successfully enabled GitHub Pages for ${owner}/${repo}`);
}

/**
 * Setup repository with one commit - combining workflow files and DEX configuration
 */
export async function setupRepositoryWithSingleCommit(
  owner: string,
  repo: string,
  config: {
    brokerId: string;
    brokerName: string;
    chainIds?: number[];
    defaultChain?: number;
    themeCSS?: string;
    telegramLink?: string;
    discordLink?: string;
    xLink?: string;
    walletConnectProjectId?: string;
    privyAppId?: string;
    privyTermsOfUse?: string;
    privyLoginMethods?: string;
    enabledMenus?: string;
    customMenus?: string;
    enableAbstractWallet?: boolean;
    disableMainnet?: boolean;
    disableTestnet?: boolean;
    disableEvmWallets?: boolean;
    disableSolanaWallets?: boolean;
    enableCampaigns?: boolean;
    tradingViewColorConfig?: string;
    availableLanguages?: string[];
    seoSiteName?: string;
    seoSiteDescription?: string;
    seoSiteLanguage?: string;
    seoSiteLocale?: string;
    seoTwitterHandle?: string;
    seoThemeColor?: string;
    seoKeywords?: string;
  },
  files: {
    primaryLogo?: string;
    secondaryLogo?: string;
    favicon?: string;
    pnlPosters?: string[];
  },
  customDomain?: string
): Promise<void> {
  console.log(`Setting up repository ${owner}/${repo} with a single commit...`);

  try {
    const workflowsDir = path.resolve(__dirname, "../workflows");

    if (!fs.existsSync(workflowsDir)) {
      throw new Error(`Workflows directory not found at ${workflowsDir}`);
    }

    const deployYmlContent = fs.readFileSync(
      path.join(workflowsDir, "deploy.yml"),
      "utf-8"
    );
    const syncForkYmlContent = fs.readFileSync(
      path.join(workflowsDir, "sync-fork.yml"),
      "utf-8"
    );

    const {
      configJsContent,
      envContent,
      themeCSS,
      faviconData,
      primaryLogoData,
      secondaryLogoData,
      pnlPostersData,
    } = prepareDexConfigContent(
      config,
      files,
      customDomain,
      `https://github.com/${owner}/${repo}`
    );

    const fileContents = new Map<string, string>();
    fileContents.set(".github/workflows/deploy.yml", deployYmlContent);
    fileContents.set(".github/workflows/sync-fork.yml", syncForkYmlContent);
    fileContents.set("public/config.js", configJsContent);
    fileContents.set(".env", envContent);

    if (themeCSS) {
      fileContents.set("app/styles/theme.css", themeCSS);
    }

    const binaryFiles = new Map<string, Buffer>();

    if (faviconData) {
      binaryFiles.set("public/favicon.webp", faviconData);
    }

    if (primaryLogoData) {
      binaryFiles.set("public/logo.webp", primaryLogoData);
    }

    if (secondaryLogoData) {
      binaryFiles.set("public/logo-secondary.webp", secondaryLogoData);
    }

    if (pnlPostersData) {
      pnlPostersData.forEach((posterData, index) => {
        binaryFiles.set(`public/pnl/poster_bg_${index + 1}.webp`, posterData);
      });
    }

    await createSingleCommit(
      owner,
      repo,
      fileContents,
      binaryFiles,
      "Setup DEX with workflow files and configuration"
    );
  } catch (error) {
    console.error(`Error setting up repository ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Get the status of workflow runs for a repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param workflowName Optional workflow name to filter by
 * @returns The workflow runs with their statuses
 */
export async function getWorkflowRunStatus(
  owner: string,
  repo: string,
  workflowName?: string
): Promise<{
  totalCount: number;
  workflowRuns: Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    createdAt: string;
    updatedAt: string;
    htmlUrl: string;
  }>;
}> {
  try {
    console.log(`Fetching workflow runs for ${owner}/${repo}...`);

    const { data: workflows } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    });

    if (workflows.total_count === 0) {
      console.log(`No workflows found in ${owner}/${repo}`);
      return { totalCount: 0, workflowRuns: [] };
    }

    let workflowId: number | undefined;

    if (workflowName) {
      const workflow = workflows.workflows.find(
        (wf: { name: string }) => wf.name === workflowName
      );
      if (workflow) {
        workflowId = workflow.id;
      } else {
        console.warn(
          `Workflow "${workflowName}" not found in ${owner}/${repo}`
        );
      }
    }

    if (workflowId) {
      const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        per_page: 10,
        workflow_id: workflowId,
      });

      const workflowRuns = runs.workflow_runs.map(run => ({
        id: run.id,
        name: run.name || "Unnamed workflow",
        status: run.status || "unknown",
        conclusion: run.conclusion,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        htmlUrl: run.html_url,
      }));

      return {
        totalCount: runs.total_count,
        workflowRuns,
      };
    } else {
      const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo(
        {
          owner,
          repo,
          per_page: 10,
        }
      );

      const workflowRuns = runs.workflow_runs.map(run => ({
        id: run.id,
        name: run.name || "Unnamed workflow",
        status: run.status || "unknown",
        conclusion: run.conclusion,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        htmlUrl: run.html_url,
      }));

      return {
        totalCount: runs.total_count,
        workflowRuns,
      };
    }
  } catch (error) {
    console.error(`Error fetching workflow runs for ${owner}/${repo}:`, error);
    throw new Error(
      `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getWorkflowRunDetails(
  owner: string,
  repo: string,
  runId: number
): Promise<{
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  jobs: Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    startedAt: string | null;
    completedAt: string | null;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
    }>;
  }>;
}> {
  try {
    console.log(
      `Fetching details for workflow run ${runId} in ${owner}/${repo}...`
    );

    const { data: run } = await octokit.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    const { data: jobsData } =
      await octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

    const jobs = jobsData.jobs.map(job => ({
      id: job.id,
      name: job.name || "Unnamed job",
      status: job.status || "unknown",
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      steps: (job.steps || []).map(step => ({
        name: step.name || "Unnamed step",
        status: step.status || "unknown",
        conclusion: step.conclusion,
        number: step.number,
      })),
    }));

    return {
      id: run.id,
      name: run.name || "Unnamed workflow run",
      status: run.status || "unknown",
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
      jobs,
    };
  } catch (error) {
    console.error(
      `Error fetching workflow run details for ${runId} in ${owner}/${repo}:`,
      error
    );
    throw new Error(
      `Failed to get workflow run details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Renames a GitHub repository
 * @param owner The repository owner (username or organization)
 * @param repo The current repository name
 * @param newName The new repository name
 * @returns The new repository URL
 */
export async function renameRepository(
  owner: string,
  repo: string,
  newName: string
): Promise<string> {
  try {
    console.log(
      `Renaming repository ${owner}/${repo} to ${owner}/${newName}...`
    );

    if (!newName || !/^[a-z0-9-]+$/i.test(newName)) {
      throw new Error(
        "Repository name can only contain alphanumeric characters and hyphens"
      );
    }

    if (newName.length > 100) {
      throw new Error(
        "Repository name exceeds GitHub's maximum length of 100 characters"
      );
    }

    const { data } = await octokit.rest.repos.update({
      owner,
      repo,
      name: newName,
    });

    return data.html_url;
  } catch (error) {
    console.error(`Error renaming repository ${owner}/${repo}:`, error);
    throw new Error(
      `Failed to rename repository: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deletes a GitHub repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @returns A boolean indicating success
 */
export async function deleteRepository(
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    console.log(`Deleting repository ${owner}/${repo}...`);

    await octokit.rest.repos.delete({
      owner,
      repo,
    });

    console.log(`Successfully deleted repository ${owner}/${repo}`);
    return true;
  } catch (error) {
    console.error(`Error deleting repository ${owner}/${repo}:`, error);
    return false;
  }
}

/**
 * Set a custom domain for GitHub Pages
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param domain The custom domain to set
 * @returns The domain that was set
 */
export async function setCustomDomain(
  owner: string,
  repo: string,
  domain: string
): Promise<string> {
  console.log(`Setting custom domain for ${owner}/${repo} to ${domain}...`);

  if (
    !domain.match(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    )
  ) {
    throw new Error(`Invalid domain format: ${domain}`);
  }

  try {
    try {
      await enableGitHubPages(owner, repo);
    } catch {
      console.warn(
        `Note: GitHub Pages might already be enabled for ${owner}/${repo}`
      );
    }

    const response = await octokit.rest.repos.updateInformationAboutPagesSite({
      owner,
      repo,
      cname: domain,
    });

    const validStatusCodes = [200, 201, 204];
    if (!validStatusCodes.includes(response.status)) {
      throw new Error(
        `Failed to set custom domain for ${owner}/${repo}: ${response.status}`
      );
    }

    const cnameContent = domain;

    const fileContents = new Map<string, string>();
    fileContents.set("CNAME", cnameContent);

    await createSingleCommit(
      owner,
      repo,
      fileContents,
      new Map(),
      "Add CNAME file for custom domain"
    );

    console.log(
      `Successfully set custom domain for ${owner}/${repo} to ${domain}`
    );
    return domain;
  } catch (error) {
    console.error(`Error setting custom domain for ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Remove a custom domain from GitHub Pages
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @returns A boolean indicating success
 */
export async function removeCustomDomain(
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    console.log(`Removing custom domain for ${owner}/${repo}...`);

    await octokit.rest.repos.updateInformationAboutPagesSite({
      owner,
      repo,
      cname: "",
    });

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: "CNAME",
      });

      if (fileData) {
        const sha =
          typeof fileData === "object" && "sha" in fileData
            ? fileData.sha
            : Array.isArray(fileData) &&
                fileData.length > 0 &&
                "sha" in fileData[0]
              ? fileData[0].sha
              : undefined;

        if (sha) {
          await octokit.rest.repos.deleteFile({
            owner,
            repo,
            path: "CNAME",
            message: "Remove CNAME file for custom domain",
            sha,
          });
        }
      }
    } catch {
      console.log("CNAME file might not exist, continuing...");
    }

    console.log(`Successfully removed custom domain for ${owner}/${repo}`);
    return true;
  } catch (error) {
    console.error(`Error removing custom domain for ${owner}/${repo}:`, error);
    throw new Error(
      `Failed to remove custom domain: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Trigger a workflow dispatch to redeploy a DEX
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param dexConfig The DEX configuration
 * @param files The files associated with the DEX configuration
 * @returns A boolean indicating success
 */
export async function triggerRedeployment(
  owner: string,
  repo: string,
  dexConfig: {
    brokerId: string;
    brokerName: string;
    chainIds?: number[];
    defaultChain?: number;
    themeCSS?: string;
    telegramLink?: string;
    discordLink?: string;
    xLink?: string;
    walletConnectProjectId?: string;
    privyAppId?: string;
    privyTermsOfUse?: string;
    privyLoginMethods?: string;
    enabledMenus?: string;
    customMenus?: string;
    enableAbstractWallet?: boolean;
    disableMainnet?: boolean;
    disableTestnet?: boolean;
    disableEvmWallets?: boolean;
    disableSolanaWallets?: boolean;
    enableCampaigns?: boolean;
    tradingViewColorConfig?: string;
    availableLanguages?: string[];
    seoSiteName?: string;
    seoSiteDescription?: string;
    seoSiteLanguage?: string;
    seoSiteLocale?: string;
    seoTwitterHandle?: string;
    seoThemeColor?: string;
    seoKeywords?: string;
  },
  files?: {
    primaryLogo?: string;
    secondaryLogo?: string;
    favicon?: string;
    pnlPosters?: string[];
  },
  customDomain?: string
): Promise<boolean> {
  try {
    console.log(`Creating redeployment commit for ${owner}/${repo}...`);

    await updateDexConfig(owner, repo, dexConfig, files, customDomain);

    console.log(
      `Successfully created redeployment commit for ${owner}/${repo}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error creating redeployment commit for ${owner}/${repo}:`,
      error
    );
    throw new Error(
      `Failed to create redeployment commit: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface DexConfig {
  brokerId: string;
  brokerName: string;
  chainIds?: number[];
  defaultChain?: number;
  themeCSS?: string;
  telegramLink?: string;
  discordLink?: string;
  xLink?: string;
  walletConnectProjectId?: string;
  privyAppId?: string;
  privyTermsOfUse?: string;
  privyLoginMethods?: string;
  enabledMenus?: string;
  customMenus?: string;
  enableAbstractWallet?: boolean;
  disableMainnet?: boolean;
  disableTestnet?: boolean;
  disableEvmWallets?: boolean;
  disableSolanaWallets?: boolean;
  enableCampaigns?: boolean;
  tradingViewColorConfig?: string;
  availableLanguages?: string[];
  seoSiteName?: string;
  seoSiteDescription?: string;
  seoSiteLanguage?: string;
  seoSiteLocale?: string;
  seoTwitterHandle?: string;
  seoThemeColor?: string;
  seoKeywords?: string;
}
