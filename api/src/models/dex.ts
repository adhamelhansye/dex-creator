import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { Prisma, Dex } from "@prisma/client";
import {
  forkTemplateRepository,
  setupRepositoryWithSingleCommit,
  deleteRepository,
  setCustomDomain,
  removeCustomDomain,
} from "../lib/github";
import { generateRepositoryName } from "../lib/nameGenerator";
import { validateTradingViewColorConfig } from "./tradingViewConfig.js";

export enum LocaleEnum {
  en = "en",
  zh = "zh",
  ja = "ja",
  es = "es",
  ko = "ko",
  vi = "vi",
  de = "de",
  fr = "fr",
  ru = "ru",
  id = "id",
  tr = "tr",
  it = "it",
  pt = "pt",
  uk = "uk",
  pl = "pl",
  nl = "nl",
}

/**
 * Helper function to extract owner and repo from GitHub URL
 */
function extractRepoInfoFromUrl(
  repoUrl: string
): { owner: string; repo: string } | null {
  if (!repoUrl) return null;

  try {
    const repoPath = repoUrl.split("github.com/")[1];
    if (!repoPath) return null;

    const [owner, repo] = repoPath.split("/");
    if (!owner || !repo) return null;

    return { owner, repo };
  } catch (error) {
    console.error("Error extracting repo info from URL:", error);
    return null;
  }
}

export const dexSchema = z.object({
  brokerName: z.string().min(3).max(50).nullish(),
  chainIds: z.array(z.number().positive().int()).optional(),
  themeCSS: z.string().nullish(),
  primaryLogo: z
    .string()
    .max(250000, "Primary logo must be smaller than 250KB")
    .nullish(),
  secondaryLogo: z
    .string()
    .max(100000, "Secondary logo must be smaller than 100KB")
    .nullish(),
  favicon: z.string().max(50000, "Favicon must be smaller than 50KB").nullish(),
  pnlPosters: z
    .array(z.string().max(250000, "Each PnL poster must be smaller than 250KB"))
    .optional()
    .default([]),
  telegramLink: z.string().url().nullish(),
  discordLink: z.string().url().nullish(),
  xLink: z.string().url().nullish(),
  walletConnectProjectId: z.string().nullish(),
  privyAppId: z.string().nullish(),
  privyTermsOfUse: z.string().nullish(),
  enabledMenus: z.string().nullish(),
  customMenus: z
    .string()
    .refine(
      value => {
        if (!value || value.trim() === "") return true;

        const menuItems = value.split(";");
        return menuItems.every(item => {
          if (!item.trim()) return false;
          const parts = item.split(",");
          if (parts.length !== 2) return false;
          const [name, url] = parts.map(p => p.trim());
          if (!name || !url) return false;

          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        });
      },
      {
        message:
          "Custom menus must be in format 'Name,URL;Name2,URL2' with valid URLs",
      }
    )
    .nullish(),
  enableAbstractWallet: z.boolean().optional(),
  disableMainnet: z.boolean().optional(),
  disableTestnet: z.boolean().optional(),
  disableEvmWallets: z.boolean().optional(),
  disableSolanaWallets: z.boolean().optional(),
  tradingViewColorConfig: z.string().nullish(),
  availableLanguages: z.array(z.nativeEnum(LocaleEnum)).optional(),

  seoSiteName: z
    .string()
    .max(100, "Site name must be 100 characters or less")
    .nullish(),
  seoSiteDescription: z
    .string()
    .max(300, "Site description must be 300 characters or less")
    .nullish(),
  seoSiteLanguage: z
    .string()
    .regex(
      /^[a-z]{2}(-[A-Z]{2})?$/,
      "Site language must be in format 'en' or 'en-US'"
    )
    .nullish(),
  seoSiteLocale: z
    .string()
    .regex(/^[a-z]{2}_[A-Z]{2}$/, "Site locale must be in format 'en_US'")
    .nullish(),
  seoTwitterHandle: z
    .string()
    .regex(
      /^@[a-zA-Z0-9_]+$/,
      "Twitter handle must start with @ and contain only alphanumeric characters and underscores"
    )
    .nullish(),
  seoThemeColor: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      "Theme color must be a valid hex color (e.g., #1a1b23)"
    )
    .nullish(),
  seoKeywords: z
    .string()
    .max(500, "Keywords must be 500 characters or less")
    .nullish(),
});

export const customDomainSchema = z.object({
  domain: z
    .string()
    .regex(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
      message:
        "Invalid domain format. Please enter a valid domain like 'example.com'",
    }),
});

export function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export const CreateDexSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  brokerName: z.string().optional(),
  brokerPrivateKey: z.string().optional(),
  tradingViewColorConfig: z.string().optional(),
});

export const UpdateDexSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  brokerName: z.string().optional(),
  brokerPrivateKey: z.string().optional(),
  repositoryUrl: z.string().optional(),
  deploymentUrl: z.string().optional(),
  tradingViewColorConfig: z.string().optional(),
});

export async function createDex(
  data: z.infer<typeof dexSchema>,
  userId: string
): Promise<Dex> {
  const validatedData = dexSchema.parse(data);

  if (validatedData.tradingViewColorConfig) {
    validateTradingViewColorConfig(validatedData.tradingViewColorConfig);
  }

  const existingDex = await getUserDex(userId);

  if (existingDex) {
    throw new Error(
      "User already has a DEX. Only one DEX per user is allowed."
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { address: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const brokerName = validatedData.brokerName || "Orderly DEX";

  const repoName = generateRepositoryName(brokerName);

  let repoUrl: string;

  try {
    console.log(
      "Creating repository in OrderlyNetworkDexCreator organization..."
    );
    repoUrl = await forkTemplateRepository(repoName);
    console.log(`Successfully forked repository: ${repoUrl}`);

    const repoInfo = extractRepoInfoFromUrl(repoUrl);
    if (!repoInfo) {
      throw new Error(
        `Failed to extract repository information from URL: ${repoUrl}`
      );
    }

    const brokerId = "demo";

    await setupRepositoryWithSingleCommit(
      repoInfo.owner,
      repoInfo.repo,
      {
        brokerId,
        brokerName,
        chainIds: validatedData.chainIds,
        themeCSS: validatedData.themeCSS?.toString(),
        telegramLink: validatedData.telegramLink || undefined,
        discordLink: validatedData.discordLink || undefined,
        xLink: validatedData.xLink || undefined,
        walletConnectProjectId:
          validatedData.walletConnectProjectId || undefined,
        privyAppId: validatedData.privyAppId || undefined,
        privyTermsOfUse: validatedData.privyTermsOfUse || undefined,
        enabledMenus: validatedData.enabledMenus || undefined,
        customMenus: validatedData.customMenus || undefined,
        enableAbstractWallet: validatedData.enableAbstractWallet,
        disableMainnet: validatedData.disableMainnet,
        disableTestnet: validatedData.disableTestnet,
        disableEvmWallets: validatedData.disableEvmWallets,
        disableSolanaWallets: validatedData.disableSolanaWallets,
        tradingViewColorConfig:
          validatedData.tradingViewColorConfig || undefined,
        availableLanguages: validatedData.availableLanguages,
        seoSiteName: validatedData.seoSiteName || undefined,
        seoSiteDescription: validatedData.seoSiteDescription || undefined,
        seoSiteLanguage: validatedData.seoSiteLanguage || undefined,
        seoSiteLocale: validatedData.seoSiteLocale || undefined,
        seoTwitterHandle: validatedData.seoTwitterHandle || undefined,
        seoThemeColor: validatedData.seoThemeColor || undefined,
        seoKeywords: validatedData.seoKeywords || undefined,
      },
      {
        primaryLogo: validatedData.primaryLogo || undefined,
        secondaryLogo: validatedData.secondaryLogo || undefined,
        favicon: validatedData.favicon || undefined,
        pnlPosters: validatedData.pnlPosters || undefined,
      },
      undefined
    );
    console.log(`Successfully set up repository for ${brokerName}`);
  } catch (error) {
    console.error("Error creating repository:", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      if (
        errorMessage.includes(
          "Resource not accessible by personal access token"
        )
      ) {
        throw new Error(
          "Repository creation failed: The GitHub token does not have sufficient permissions"
        );
      } else if (errorMessage.includes("Not Found")) {
        throw new Error(
          "Repository creation failed: Template repository or organization not found"
        );
      } else if (errorMessage.includes("already exists")) {
        throw new Error(
          "Repository creation failed: A repository with this name already exists"
        );
      }
    }

    throw new Error(`Repository creation failed: ${errorMessage}`);
  }

  try {
    const brokerId = "demo";

    return await prisma.dex.create({
      data: {
        brokerName: validatedData.brokerName ?? undefined,
        brokerId: brokerId,
        chainIds: validatedData.chainIds ?? [],
        themeCSS: validatedData.themeCSS,
        primaryLogo: validatedData.primaryLogo,
        secondaryLogo: validatedData.secondaryLogo,
        favicon: validatedData.favicon,
        pnlPosters: validatedData.pnlPosters ?? [],
        telegramLink: validatedData.telegramLink,
        discordLink: validatedData.discordLink,
        xLink: validatedData.xLink,
        walletConnectProjectId: validatedData.walletConnectProjectId,
        privyAppId: validatedData.privyAppId,
        privyTermsOfUse: validatedData.privyTermsOfUse,
        enabledMenus: validatedData.enabledMenus,
        customMenus: validatedData.customMenus,
        enableAbstractWallet: validatedData.enableAbstractWallet,
        disableMainnet: validatedData.disableMainnet,
        disableTestnet: validatedData.disableTestnet,
        disableEvmWallets: validatedData.disableEvmWallets,
        disableSolanaWallets: validatedData.disableSolanaWallets,
        tradingViewColorConfig: validatedData.tradingViewColorConfig,
        availableLanguages: validatedData.availableLanguages,
        seoSiteName: validatedData.seoSiteName,
        seoSiteDescription: validatedData.seoSiteDescription,
        seoSiteLanguage: validatedData.seoSiteLanguage,
        seoSiteLocale: validatedData.seoSiteLocale,
        seoTwitterHandle: validatedData.seoTwitterHandle,
        seoThemeColor: validatedData.seoThemeColor,
        seoKeywords: validatedData.seoKeywords,
        repoUrl: repoUrl,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  } catch (dbError) {
    console.error("Error creating DEX in database:", dbError);

    try {
      const repoInfo = extractRepoInfoFromUrl(repoUrl);
      if (repoInfo) {
        await deleteRepository(repoInfo.owner, repoInfo.repo);
        console.log(`Cleaned up repository after database creation failure`);
      }
    } catch (cleanupError) {
      console.error("Failed to clean up repository:", cleanupError);
    }

    throw new Error(
      `Failed to create DEX in database: ${dbError instanceof Error ? dbError.message : String(dbError)}`
    );
  }
}

export async function getUserDex(userId: string): Promise<Dex | null> {
  return prisma.dex.findUnique({
    where: {
      userId,
    },
  });
}

export async function getDexById(id: string): Promise<Dex | null> {
  return prisma.dex.findUnique({
    where: {
      id,
    },
  });
}

export async function updateDex(
  id: string,
  userId: string,
  data: z.infer<typeof dexSchema>
): Promise<Dex> {
  const validatedData = dexSchema.parse(data);

  if (validatedData.tradingViewColorConfig) {
    validateTradingViewColorConfig(validatedData.tradingViewColorConfig);
  }

  const dex = await getDexById(id);

  if (!dex || dex.userId !== userId) {
    throw new Error("DEX not found or user is not authorized to update it");
  }

  const updateData: Prisma.DexUpdateInput = {};

  if ("brokerName" in validatedData)
    updateData.brokerName = validatedData.brokerName ?? undefined;
  if ("chainIds" in validatedData)
    updateData.chainIds = validatedData.chainIds ?? [];
  if ("themeCSS" in validatedData) updateData.themeCSS = validatedData.themeCSS;
  if ("telegramLink" in validatedData)
    updateData.telegramLink = validatedData.telegramLink;
  if ("discordLink" in validatedData)
    updateData.discordLink = validatedData.discordLink;
  if ("xLink" in validatedData) updateData.xLink = validatedData.xLink;
  if ("walletConnectProjectId" in validatedData) {
    updateData.walletConnectProjectId = validatedData.walletConnectProjectId;
  }
  if ("privyAppId" in validatedData)
    updateData.privyAppId = validatedData.privyAppId;
  if ("privyTermsOfUse" in validatedData)
    updateData.privyTermsOfUse = validatedData.privyTermsOfUse;
  if ("enabledMenus" in validatedData)
    updateData.enabledMenus = validatedData.enabledMenus;
  if ("customMenus" in validatedData)
    updateData.customMenus = validatedData.customMenus;

  if ("primaryLogo" in validatedData)
    updateData.primaryLogo = validatedData.primaryLogo;
  if ("secondaryLogo" in validatedData)
    updateData.secondaryLogo = validatedData.secondaryLogo;
  if ("favicon" in validatedData) updateData.favicon = validatedData.favicon;
  if ("pnlPosters" in validatedData)
    updateData.pnlPosters = validatedData.pnlPosters ?? [];
  if ("enableAbstractWallet" in validatedData)
    updateData.enableAbstractWallet = validatedData.enableAbstractWallet;
  if ("disableMainnet" in validatedData)
    updateData.disableMainnet = validatedData.disableMainnet;
  if ("disableTestnet" in validatedData)
    updateData.disableTestnet = validatedData.disableTestnet;
  if ("disableEvmWallets" in validatedData)
    updateData.disableEvmWallets = validatedData.disableEvmWallets;
  if ("disableSolanaWallets" in validatedData)
    updateData.disableSolanaWallets = validatedData.disableSolanaWallets;
  if ("tradingViewColorConfig" in validatedData)
    updateData.tradingViewColorConfig = validatedData.tradingViewColorConfig;
  if ("availableLanguages" in validatedData)
    updateData.availableLanguages = validatedData.availableLanguages;

  if ("seoSiteName" in validatedData)
    updateData.seoSiteName = validatedData.seoSiteName;
  if ("seoSiteDescription" in validatedData)
    updateData.seoSiteDescription = validatedData.seoSiteDescription;
  if ("seoSiteLanguage" in validatedData)
    updateData.seoSiteLanguage = validatedData.seoSiteLanguage;
  if ("seoSiteLocale" in validatedData)
    updateData.seoSiteLocale = validatedData.seoSiteLocale;
  if ("seoTwitterHandle" in validatedData)
    updateData.seoTwitterHandle = validatedData.seoTwitterHandle;
  if ("seoThemeColor" in validatedData)
    updateData.seoThemeColor = validatedData.seoThemeColor;
  if ("seoKeywords" in validatedData)
    updateData.seoKeywords = validatedData.seoKeywords;

  return prisma.dex.update({
    where: {
      id,
    },
    data: updateData,
  });
}

export async function deleteDex(id: string, userId: string): Promise<Dex> {
  const dex = await getDexById(id);

  if (!dex || dex.userId !== userId) {
    throw new Error("DEX not found or user is not authorized to delete it");
  }

  if (dex.repoUrl) {
    try {
      const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
      if (repoInfo) {
        await deleteRepository(repoInfo.owner, repoInfo.repo);
      }
    } catch (error) {
      console.error("Error deleting GitHub repository:", error);
    }
  }

  return prisma.dex.delete({
    where: {
      id,
    },
  });
}

export async function updateDexRepoUrl(
  id: string,
  repoUrl: string
): Promise<Dex> {
  return prisma.dex.update({
    where: {
      id,
    },
    data: {
      repoUrl,
    },
  });
}

export async function updateBrokerId(
  id: string,
  brokerId: string
): Promise<Dex> {
  return prisma.dex.update({
    where: {
      id,
    },
    data: {
      brokerId,
      preferredBrokerId: brokerId,
    },
  });
}

export async function deleteDexByWalletAddress(
  address: string
): Promise<Dex | null> {
  const user = await prisma.user.findUnique({
    where: {
      address: address.toLowerCase(),
    },
    include: {
      dex: true,
    },
  });

  if (!user || !user.dex) {
    return null;
  }

  const dexId = user.dex.id;
  const dex = user.dex;

  if (dex.repoUrl) {
    try {
      const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
      if (repoInfo) {
        await deleteRepository(repoInfo.owner, repoInfo.repo);
      }
    } catch (error) {
      console.error("Error deleting GitHub repository:", error);
    }
  }

  return prisma.dex.delete({
    where: {
      id: dexId,
    },
  });
}

export async function getAllDexes() {
  return prisma.dex.findMany({
    include: {
      user: {
        select: {
          address: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Update the custom domain for a DEX
 * @param id The DEX ID
 * @param domain The custom domain to set
 * @param userId The user ID (for authorization)
 * @returns The updated DEX
 */
export async function updateDexCustomDomain(
  id: string,
  domain: string,
  userId: string
): Promise<Dex> {
  const dex = await prisma.dex.findUnique({
    where: { id },
  });

  if (!dex) {
    throw new Error("DEX not found");
  }

  if (dex.userId !== userId) {
    throw new Error("User is not authorized to update this DEX");
  }

  if (!dex.repoUrl) {
    throw new Error("This DEX doesn't have a repository URL");
  }

  const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
  if (!repoInfo) {
    throw new Error("Invalid repository URL");
  }

  try {
    await setCustomDomain(repoInfo.owner, repoInfo.repo, domain);
  } catch (error) {
    throw new Error(
      `Failed to set custom domain in GitHub: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return prisma.dex.update({
    where: { id },
    data: {
      customDomain: domain,
      updatedAt: new Date(),
    },
  });
}

/**
 * Remove custom domain from a DEX
 * @param id The DEX ID
 * @param userId The user ID (for authorization)
 * @returns The updated DEX
 */
export async function removeDexCustomDomain(
  id: string,
  userId: string
): Promise<Dex> {
  const dex = await prisma.dex.findUnique({
    where: { id },
  });

  if (!dex) {
    throw new Error("DEX not found");
  }

  if (dex.userId !== userId) {
    throw new Error("User is not authorized to update this DEX");
  }

  if (!dex.customDomain) {
    throw new Error("This DEX doesn't have a custom domain configured");
  }

  if (!dex.repoUrl) {
    throw new Error("This DEX doesn't have a repository URL");
  }

  const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
  if (!repoInfo) {
    throw new Error("Invalid repository URL");
  }

  try {
    await removeCustomDomain(repoInfo.owner, repoInfo.repo);
    console.log(
      `Successfully removed custom domain for ${repoInfo.owner}/${repoInfo.repo}`
    );
  } catch (error) {
    throw new Error(
      `Failed to remove custom domain in GitHub: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return prisma.dex.update({
    where: { id },
    data: {
      customDomain: null,
      updatedAt: new Date(),
    },
  });
}
