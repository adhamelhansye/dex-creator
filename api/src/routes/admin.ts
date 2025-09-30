import { Context, Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAllAdmins, isUserAdmin } from "../models/admin";
import {
  getDexById,
  updateBrokerId,
  updateDexRepoUrl,
  getAllDexes,
  getCurrentEnvironment,
} from "../models/dex";
import { getPrisma } from "../lib/prisma";
import { createAutomatedBrokerId } from "../lib/brokerCreation";
import {
  updateDexFees,
  verifyOrderTransaction,
  TransactionVerificationError,
} from "../models/graduation";
import {
  setupRepositoryWithSingleCommit,
  renameRepository,
  deleteRepository,
  triggerRedeployment,
} from "../lib/github";

type AdminContext = Context<{
  Variables: {
    userId: string;
    isAdmin?: boolean;
  };
}>;

const adminRoutes = new Hono();

adminRoutes.get("/users", async (c: AdminContext) => {
  try {
    const admins = await getAllAdmins();
    return c.json({ admins });
  } catch (error) {
    console.error("Error getting admins:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

adminRoutes.get("/check", async c => {
  const userId = c.get("userId") as string | undefined;

  if (!userId) {
    return c.json({ isAdmin: false }, 200);
  }

  const isAdmin = await isUserAdmin(userId);
  return c.json({ isAdmin }, 200);
});

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
});

adminRoutes.get(
  "/dexes",
  zValidator("query", paginationQuerySchema),
  async c => {
    const query = c.req.valid("query");
    const result = await getAllDexes(query.limit, query.offset, query.search);
    return c.json(result);
  }
);

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

const brokerIdSchema = z.object({
  brokerId: z
    .string()
    .min(3, "Broker ID must be at least 3 characters")
    .max(20, "Broker ID cannot exceed 20 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
    ),
});

const manualBrokerCreationSchema = z.object({
  brokerId: z
    .string()
    .min(5, "Broker ID must be at least 5 characters")
    .max(15, "Broker ID cannot exceed 15 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
    )
    .refine(
      value => !value.includes("orderly"),
      "Broker ID cannot contain 'orderly'"
    ),
  makerFee: z.number().min(0).max(150),
  takerFee: z.number().min(30).max(150),
  txHash: z
    .string()
    .min(10)
    .max(100, "Transaction hash must be between 10-100 characters"),
});

adminRoutes.post(
  "/dex/:id/broker-id",
  zValidator("json", brokerIdSchema),
  async c => {
    const id = c.req.param("id");
    const { brokerId } = c.req.valid("json");

    try {
      const dex = await getDexById(id);
      if (!dex) {
        return c.json({ message: "DEX not found" }, 404);
      }

      const result = await updateBrokerId(id, brokerId);

      if (!result.success) {
        return c.json({ message: result.error }, 400);
      }

      const updatedDex = result.data;

      if (updatedDex.repoUrl) {
        const repoInfo = extractRepoInfoFromUrl(updatedDex.repoUrl);

        if (repoInfo) {
          try {
            await setupRepositoryWithSingleCommit(
              repoInfo.owner,
              repoInfo.repo,
              {
                brokerId: brokerId,
                brokerName: updatedDex.brokerName,
                chainIds: updatedDex.chainIds,
                defaultChain: updatedDex.defaultChain || undefined,
                themeCSS: updatedDex.themeCSS?.toString(),
                telegramLink: updatedDex.telegramLink || undefined,
                discordLink: updatedDex.discordLink || undefined,
                xLink: updatedDex.xLink || undefined,
                walletConnectProjectId:
                  updatedDex.walletConnectProjectId || undefined,
                privyAppId: updatedDex.privyAppId || undefined,
                privyTermsOfUse: updatedDex.privyTermsOfUse || undefined,
                enabledMenus: updatedDex.enabledMenus || undefined,
                customMenus: updatedDex.customMenus || undefined,
                enableAbstractWallet: updatedDex.enableAbstractWallet || false,
                disableMainnet: updatedDex.disableMainnet || false,
                disableTestnet: updatedDex.disableTestnet || false,
                disableEvmWallets: updatedDex.disableEvmWallets || false,
                disableSolanaWallets: updatedDex.disableSolanaWallets || false,
                enableCampaigns: updatedDex.enableCampaigns || false,
                tradingViewColorConfig:
                  updatedDex.tradingViewColorConfig || undefined,
                availableLanguages: updatedDex.availableLanguages,
                seoSiteName: updatedDex.seoSiteName || undefined,
                seoSiteDescription: updatedDex.seoSiteDescription || undefined,
                seoSiteLanguage: updatedDex.seoSiteLanguage || undefined,
                seoSiteLocale: updatedDex.seoSiteLocale || undefined,
                seoTwitterHandle: updatedDex.seoTwitterHandle || undefined,
                seoThemeColor: updatedDex.seoThemeColor || undefined,
                seoKeywords: updatedDex.seoKeywords || undefined,
              },
              {
                primaryLogo: updatedDex.primaryLogo || undefined,
                secondaryLogo: updatedDex.secondaryLogo || undefined,
                favicon: updatedDex.favicon || undefined,
                pnlPosters: updatedDex.pnlPosters || undefined,
              },
              updatedDex.customDomain || undefined
            );

            console.log(
              `Admin updated broker ID in repository for ${updatedDex.brokerName} with a single commit`
            );
          } catch (configError) {
            console.error("Error updating repository files:", configError);
          }
        }
      }

      return c.json(updatedDex);
    } catch (error) {
      console.error("Error updating broker ID:", error);
      return c.json(
        { message: "Error updating broker ID", error: String(error) },
        500
      );
    }
  }
);

adminRoutes.delete("/dex/:id", async (c: AdminContext) => {
  const id = c.req.param("id");

  try {
    const dex = await getDexById(id);
    if (!dex) {
      return c.json({ error: "DEX not found" }, 404);
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

    const prismaClient = await getPrisma();
    await prismaClient.dex.delete({
      where: {
        id,
      },
    });

    return c.json({ success: true, message: "DEX deleted successfully" });
  } catch (error) {
    console.error("Error deleting DEX by ID:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

const renameSchema = z.object({
  newName: z
    .string()
    .min(5)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Repository name must contain only lowercase letters, numbers, and hyphens"
    ),
});

adminRoutes.post(
  "/dex/:id/rename-repo",
  zValidator("json", renameSchema),
  async c => {
    const id = c.req.param("id");
    const { newName } = c.req.valid("json");

    try {
      const dex = await getDexById(id);
      if (!dex) {
        return c.json({ message: "DEX not found" }, 404);
      }

      if (!dex.repoUrl) {
        return c.json({ message: "This DEX does not have a repository" }, 400);
      }

      const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
      if (!repoInfo) {
        return c.json({ message: "Invalid repository URL" }, 400);
      }

      try {
        const newRepoUrl = await renameRepository(
          repoInfo.owner,
          repoInfo.repo,
          newName
        );

        const updatedDex = await updateDexRepoUrl(id, newRepoUrl);

        return c.json({
          message: "Repository renamed successfully",
          dex: updatedDex,
          oldName: repoInfo.repo,
          newName: newName,
        });
      } catch (githubError) {
        console.error("GitHub API error:", githubError);

        if (
          githubError instanceof Error &&
          githubError.message.includes(
            "Repository with this name already exists"
          )
        ) {
          return c.json(
            {
              message: "Repository name already exists",
              error: githubError.message,
            },
            400
          );
        }

        return c.json(
          { message: "Error renaming repository", error: String(githubError) },
          500
        );
      }
    } catch (error) {
      console.error("Error renaming repository:", error);
      return c.json(
        { message: "Error renaming repository", error: String(error) },
        500
      );
    }
  }
);

adminRoutes.post("/dex/:id/redeploy", async (c: AdminContext) => {
  const id = c.req.param("id");

  try {
    const dex = await getDexById(id);
    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    if (!dex.repoUrl) {
      return c.json({ message: "This DEX does not have a repository" }, 400);
    }

    const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
    if (!repoInfo) {
      return c.json({ message: "Invalid repository URL" }, 400);
    }

    const success = await triggerRedeployment(
      repoInfo.owner,
      repoInfo.repo,
      {
        brokerId: dex.brokerId,
        brokerName: dex.brokerName,
        chainIds: dex.chainIds,
        defaultChain: dex.defaultChain || undefined,
        themeCSS: dex.themeCSS?.toString(),
        telegramLink: dex.telegramLink || undefined,
        discordLink: dex.discordLink || undefined,
        xLink: dex.xLink || undefined,
        walletConnectProjectId: dex.walletConnectProjectId || undefined,
        privyAppId: dex.privyAppId || undefined,
        privyTermsOfUse: dex.privyTermsOfUse || undefined,
        privyLoginMethods: dex.privyLoginMethods || undefined,
        enabledMenus: dex.enabledMenus || undefined,
        customMenus: dex.customMenus || undefined,
        enableAbstractWallet: dex.enableAbstractWallet || false,
        disableMainnet: dex.disableMainnet || false,
        disableTestnet: dex.disableTestnet || false,
        disableEvmWallets: dex.disableEvmWallets || false,
        disableSolanaWallets: dex.disableSolanaWallets || false,
        enableCampaigns: dex.enableCampaigns || false,
        tradingViewColorConfig: dex.tradingViewColorConfig || undefined,
        availableLanguages: dex.availableLanguages,
        seoSiteName: dex.seoSiteName || undefined,
        seoSiteDescription: dex.seoSiteDescription || undefined,
        seoSiteLanguage: dex.seoSiteLanguage || undefined,
        seoSiteLocale: dex.seoSiteLocale || undefined,
        seoTwitterHandle: dex.seoTwitterHandle || undefined,
        seoThemeColor: dex.seoThemeColor || undefined,
        seoKeywords: dex.seoKeywords || undefined,
      },
      {
        primaryLogo: dex.primaryLogo || undefined,
        secondaryLogo: dex.secondaryLogo || undefined,
        favicon: dex.favicon || undefined,
        pnlPosters: dex.pnlPosters || undefined,
      },
      dex.customDomain || undefined
    );

    if (success) {
      return c.json({
        message: `Redeployment triggered successfully for ${dex.brokerName}`,
        success: true,
      });
    } else {
      return c.json(
        { message: "Failed to trigger redeployment", success: false },
        500
      );
    }
  } catch (error) {
    console.error("Error triggering redeployment:", error);
    return c.json(
      { message: "Error triggering redeployment", error: String(error) },
      500
    );
  }
});

adminRoutes.post(
  "/dex/:dexId/create-broker",
  zValidator("json", manualBrokerCreationSchema),
  async c => {
    try {
      const { brokerId, makerFee, takerFee, txHash } = c.req.valid("json");
      const dexId = c.req.param("dexId");

      const prismaClient = await getPrisma();

      const dex = await prismaClient.dex.findUnique({
        where: { id: dexId },
        include: { user: true },
      });
      if (!dex || !dex.repoUrl) {
        return c.json(
          {
            success: false,
            message: "User must have a DEX with repository first",
          },
          { status: 400 }
        );
      }

      const existingDex = await prismaClient.dex.findFirst({
        where: {
          brokerId: brokerId,
        },
      });

      if (existingDex) {
        return c.json(
          {
            success: false,
            message:
              "This broker ID is already taken. Please choose another one.",
          },
          { status: 400 }
        );
      }

      if (dex.brokerId && dex.brokerId !== "demo") {
        return c.json(
          {
            success: false,
            message:
              "User already has a broker ID. Each user can only have one broker ID.",
          },
          { status: 400 }
        );
      }

      const existingUsedTx = await prismaClient.usedTransactionHash.findUnique({
        where: {
          txHash: txHash,
        },
      });

      if (existingUsedTx) {
        return c.json(
          {
            success: false,
            message:
              "This transaction hash has already been used for graduation. Please use a different transaction.",
          },
          { status: 400 }
        );
      }

      try {
        const verificationResult = await verifyOrderTransaction(
          txHash,
          "ethereum",
          dex.user.address,
          "order"
        );

        if (!verificationResult.success) {
          const message = verificationResult.message;
          if (
            message.includes(
              TransactionVerificationError.TRANSACTION_NOT_FOUND
            ) ||
            message.includes(TransactionVerificationError.TRANSACTION_FAILED) ||
            message.includes(TransactionVerificationError.WRONG_SENDER)
          ) {
            return c.json(
              {
                success: false,
                message: `Transaction validation failed: ${message}`,
              },
              { status: 400 }
            );
          }
          console.log(
            `⚠️ Admin bypassing payment validation for tx: ${txHash}, reason: ${message}`
          );
        }
      } catch (verificationError) {
        console.error(
          "Error validating transaction for admin:",
          verificationError
        );
        return c.json(
          {
            success: false,
            message: `Error validating transaction: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`,
          },
          { status: 400 }
        );
      }

      const feeUpdateResult = await updateDexFees(
        dex.userId,
        makerFee,
        takerFee
      );
      if (!feeUpdateResult.success) {
        return c.json(feeUpdateResult, { status: 400 });
      }

      const brokerCreationResult = await createAutomatedBrokerId(
        brokerId,
        getCurrentEnvironment(),
        {
          brokerName: dex.brokerName,
          makerFee: makerFee,
          takerFee: takerFee,
        }
      );

      if (!brokerCreationResult.success) {
        return c.json(brokerCreationResult, { status: 400 });
      }

      let updatedDex;
      try {
        updatedDex = await prismaClient.dex.update({
          where: { id: dexId },
          data: {
            brokerId,
            isGraduated: false,
            graduationTxHash: txHash,
          },
        });

        await prismaClient.usedTransactionHash.create({
          data: {
            txHash,
            userId: dex.userId,
            dexId: updatedDex.id,
          },
        });
      } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error) {
          const prismaError = error as {
            code: string;
            meta?: { target?: string[] };
          };
          if (
            prismaError.code === "P2002" &&
            prismaError.meta?.target?.includes("graduationTxHash")
          ) {
            return c.json(
              {
                success: false,
                message:
                  "This transaction hash has already been used for graduation. Please use a different transaction.",
              },
              { status: 400 }
            );
          }
          if (
            prismaError.code === "P2002" &&
            prismaError.meta?.target?.includes("txHash")
          ) {
            return c.json(
              {
                success: false,
                message:
                  "This transaction hash has already been used for graduation. Please use a different transaction.",
              },
              { status: 400 }
            );
          }
        }
        throw error;
      }

      try {
        console.log(
          `🔄 Admin updating GitHub repository with new broker ID: ${brokerId}`
        );

        const repoUrlMatch = dex.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (repoUrlMatch) {
          const [, owner, repo] = repoUrlMatch;

          await setupRepositoryWithSingleCommit(
            owner,
            repo,
            {
              brokerId: brokerId,
              brokerName: dex.brokerName,
              chainIds: dex.chainIds,
              defaultChain: dex.defaultChain || undefined,
              themeCSS: dex.themeCSS?.toString(),
              telegramLink: dex.telegramLink || undefined,
              discordLink: dex.discordLink || undefined,
              xLink: dex.xLink || undefined,
              walletConnectProjectId: dex.walletConnectProjectId || undefined,
              privyAppId: dex.privyAppId || undefined,
              privyTermsOfUse: dex.privyTermsOfUse || undefined,
              privyLoginMethods: dex.privyLoginMethods || undefined,
              enabledMenus: dex.enabledMenus || undefined,
              customMenus: dex.customMenus || undefined,
              enableAbstractWallet: dex.enableAbstractWallet || false,
              disableMainnet: dex.disableMainnet || false,
              disableTestnet: dex.disableTestnet || false,
              disableEvmWallets: dex.disableEvmWallets || false,
              disableSolanaWallets: dex.disableSolanaWallets || false,
              enableCampaigns: dex.enableCampaigns || false,
              tradingViewColorConfig: dex.tradingViewColorConfig?.toString(),
              availableLanguages: dex.availableLanguages,
              seoSiteName: dex.seoSiteName || undefined,
              seoSiteDescription: dex.seoSiteDescription || undefined,
              seoSiteLanguage: dex.seoSiteLanguage || undefined,
              seoSiteLocale: dex.seoSiteLocale || undefined,
              seoTwitterHandle: dex.seoTwitterHandle || undefined,
              seoThemeColor: dex.seoThemeColor || undefined,
              seoKeywords: dex.seoKeywords || undefined,
            },
            {
              primaryLogo: dex.primaryLogo || undefined,
              secondaryLogo: dex.secondaryLogo || undefined,
              favicon: dex.favicon || undefined,
              pnlPosters: dex.pnlPosters || undefined,
            },
            dex.customDomain || undefined
          );

          console.log(
            `✅ Admin successfully updated GitHub repository with broker ID: ${brokerId}`
          );
        } else {
          console.warn(
            `⚠️ Could not extract repository info from URL: ${dex.repoUrl}`
          );
        }
      } catch (repoError) {
        console.error("❌ Error updating GitHub repository:", repoError);
      }

      return c.json({
        success: true,
        message: `Admin successfully created broker ID '${brokerId}' for user. DEX has graduated automatically.`,
        brokerCreationData: {
          brokerId,
          transactionHashes: brokerCreationResult.transactionHashes || {},
        },
        dex: {
          id: updatedDex.id,
          brokerId: updatedDex.brokerId,
          brokerName: updatedDex.brokerName,
          isGraduated: updatedDex.isGraduated,
        },
      });
    } catch (error) {
      console.error("Error in admin manual broker creation:", error);
      return c.json(
        {
          success: false,
          message: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 }
      );
    }
  }
);

export default adminRoutes;
