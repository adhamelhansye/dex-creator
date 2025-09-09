import { Context, Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAllAdmins, isUserAdmin } from "../models/admin";
import {
  getDexById,
  updateBrokerId,
  updateDexRepoUrl,
  getAllDexes,
} from "../models/dex";

import { getCurrentEnvironment } from "../models/dex.js";
import { deleteBrokerId } from "../lib/brokerCreation.js";
import { PrismaClient } from "@prisma/client";
import { deleteBrokerFromOrderlyDb } from "../lib/orderlyDb.js";
import {
  setupRepositoryWithSingleCommit,
  renameRepository,
  deleteRepository,
  triggerRedeployment,
} from "../lib/github";

const prisma = new PrismaClient();

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

adminRoutes.get("/dexes/stats", async c => {
  try {
    const stats = await prisma.$transaction(async tx => {
      const totalDexes = await tx.dex.count();
      const graduatedDexes = await tx.dex.count({
        where: {
          brokerId: {
            not: "demo",
          },
        },
      });
      const demoDexes = await tx.dex.count({
        where: {
          brokerId: "demo",
        },
      });

      return {
        total: totalDexes,
        graduated: graduatedDexes,
        demo: demoDexes,
      };
    });

    return c.json(stats);
  } catch (error) {
    console.error("Error getting DEX statistics:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

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

adminRoutes.post("/dex/:id/broker-id", async (c: AdminContext) => {
  const id = c.req.param("id");

  const brokerIdSchema = z.object({
    brokerId: z
      .string()
      .min(5, "Broker ID must be at least 5 characters")
      .max(15, "Broker ID cannot exceed 15 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
      ),
  });

  let body;
  try {
    body = await c.req.json();
    brokerIdSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

  try {
    const dex = await getDexById(id);
    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    const updatedDex = await updateBrokerId(id, body.brokerId);

    if (updatedDex.repoUrl) {
      const repoInfo = extractRepoInfoFromUrl(updatedDex.repoUrl);

      if (repoInfo) {
        try {
          await setupRepositoryWithSingleCommit(
            repoInfo.owner,
            repoInfo.repo,
            {
              brokerId: body.brokerId,
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
});

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

    await prisma.dex.delete({
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

adminRoutes.post("/dex/:id/rename-repo", async (c: AdminContext) => {
  const id = c.req.param("id");

  const renameSchema = z.object({
    newName: z
      .string()
      .min(1)
      .max(90)
      .regex(
        /^[a-z0-9-]+$/,
        "Repository name must contain only lowercase letters, numbers, and hyphens"
      ),
  });

  let body;
  try {
    body = await c.req.json();
    renameSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

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
        body.newName
      );

      const updatedDex = await updateDexRepoUrl(id, newRepoUrl);

      return c.json({
        message: "Repository renamed successfully",
        dex: updatedDex,
        oldName: repoInfo.repo,
        newName: body.newName,
      });
    } catch (githubError) {
      console.error("GitHub API error:", githubError);

      if (
        githubError instanceof Error &&
        githubError.message.includes("Repository with this name already exists")
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
});

adminRoutes.post("/broker/delete", async (c: AdminContext) => {
  try {
    const deleteBrokerSchema = z.object({
      brokerId: z.string().min(1).max(50),
    });

    const result = deleteBrokerSchema.safeParse(await c.req.json());
    if (!result.success) {
      return c.json(
        { error: "Invalid request", details: result.error },
        { status: 400 }
      );
    }

    const { brokerId } = result.data;
    const env = getCurrentEnvironment();

    console.log(
      `Admin attempting to delete broker ID: ${brokerId} on environment: ${env}`
    );

    const dex = await prisma.dex.findFirst({
      where: { brokerId },
    });

    const deletionResult = await deleteBrokerId(brokerId, env);

    if (!deletionResult.success) {
      return c.json(
        {
          success: false,
          message: `Failed to delete broker ID from blockchain: ${deletionResult.errors?.join(", ")}`,
        },
        { status: 500 }
      );
    }

    try {
      console.log(
        `🗑️ Attempting to delete broker ${brokerId} from Orderly database...`
      );
      const orderlyDeletionResult = await deleteBrokerFromOrderlyDb(brokerId);

      if (!orderlyDeletionResult.success) {
        console.warn(
          `⚠️ Failed to delete broker ${brokerId} from Orderly database: ${orderlyDeletionResult.message}`
        );
      }
    } catch (orderlyDbError) {
      console.error(
        `❌ Error deleting broker ${brokerId} from Orderly database:`,
        orderlyDbError
      );
    }

    let updatedDex = null;
    if (dex) {
      updatedDex = await prisma.dex.update({
        where: { id: dex.id },
        data: {
          brokerId: "demo",
          isGraduated: false,
        },
      });
      console.log(
        `Successfully deleted broker ID ${brokerId} and reset DEX ${dex.id} to demo status with isGraduated=false`
      );
    } else {
      console.log(
        `No DEX found with broker ID ${brokerId}, but on-chain deletion succeeded.`
      );
    }

    return c.json({
      success: true,
      message:
        `Broker ID '${brokerId}' deleted successfully from all chains` +
        (dex ? " and DEX reset to demo" : " (no DEX found in DB)"),
      brokerId,
      transactionHashes: deletionResult.transactionHashes || {},
      dex: updatedDex
        ? {
            id: updatedDex.id,
            brokerName: updatedDex.brokerName,
            brokerId: updatedDex.brokerId,
          }
        : null,
    });
  } catch (error) {
    console.error("Error deleting broker ID:", error);
    return c.json(
      {
        success: false,
        message: `Error deleting broker ID: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
});

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

export default adminRoutes;
