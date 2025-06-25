import { Context, Hono } from "hono";
import { z } from "zod";
import { getAllAdmins, isUserAdmin } from "../models/admin";
import {
  getDexById,
  updateBrokerId,
  updateDexRepoUrl,
  getAllDexes,
} from "../models/dex";
import { PrismaClient } from "@prisma/client";
import {
  setupRepositoryWithSingleCommit,
  renameRepository,
  deleteRepository,
  triggerRedeployment,
} from "../lib/github";

const prisma = new PrismaClient();

// Define a type for the context that includes userId and isAdmin
type AdminContext = Context<{
  Variables: {
    userId: string;
    isAdmin?: boolean;
  };
}>;

const adminRoutes = new Hono();

// Get all admins (protected by adminMiddleware in app)
adminRoutes.get("/users", async (c: AdminContext) => {
  try {
    const admins = await getAllAdmins();
    return c.json({ admins });
  } catch (error) {
    console.error("Error getting admins:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Check if current user is admin (public endpoint - always returns 200)
adminRoutes.get("/check", async c => {
  // Get userId from context if it exists (user might not be logged in)
  const userId = c.get("userId") as string | undefined;
  console.log("userId", userId);

  // If no userId is provided, user is not logged in, so definitely not admin
  if (!userId) {
    return c.json({ isAdmin: false }, 200);
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(userId);
  return c.json({ isAdmin }, 200);
});

// Get all DEXes (admin only)
adminRoutes.get("/dexes", async (c: AdminContext) => {
  try {
    const dexes = await getAllDexes();
    return c.json({ dexes });
  } catch (error) {
    console.error("Error fetching all DEXes:", error);
    return c.json({ error: "Failed to fetch DEXes" }, 500);
  }
});

// Helper function to extract owner and repo from GitHub URL
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

// Admin endpoint to update brokerId (protected by adminMiddleware)
adminRoutes.post("/dex/:id/broker-id", async (c: AdminContext) => {
  const id = c.req.param("id");

  const brokerIdSchema = z.object({
    brokerId: z.string().min(1).max(50),
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
          // Log the error but don't fail the update
          console.error("Error updating repository files:", configError);
          // We continue even if the repo update failed
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

// Admin endpoint to rename a repository (protected by adminMiddleware)
adminRoutes.post("/dex/:id/rename-repo", async (c: AdminContext) => {
  const id = c.req.param("id");

  // Validate the request body
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

  // Validate body
  let body;
  try {
    body = await c.req.json();
    renameSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

  try {
    // Get the DEX with current data
    const dex = await getDexById(id);
    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    // Check if the DEX has a repository URL
    if (!dex.repoUrl) {
      return c.json({ message: "This DEX does not have a repository" }, 400);
    }

    // Extract owner and repo from GitHub URL
    const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
    if (!repoInfo) {
      return c.json({ message: "Invalid repository URL" }, 400);
    }

    try {
      // Use the renameRepository function from github.ts
      const newRepoUrl = await renameRepository(
        repoInfo.owner,
        repoInfo.repo,
        body.newName
      );

      // Update the DEX record with the new repository URL
      // No need to pass userId since we removed the authorization check in the model
      const updatedDex = await updateDexRepoUrl(id, newRepoUrl);

      return c.json({
        message: "Repository renamed successfully",
        dex: updatedDex,
        oldName: repoInfo.repo,
        newName: body.newName,
      });
    } catch (githubError) {
      // Handle GitHub API errors
      console.error("GitHub API error:", githubError);

      // Check for specific GitHub errors
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

// Admin endpoint to approve a broker ID
adminRoutes.post("/graduation/approve", async (c: AdminContext) => {
  try {
    const approveBrokerIdSchema = z.object({
      dexId: z.string().uuid(),
      customBrokerId: z.string().optional(),
    });

    const result = approveBrokerIdSchema.safeParse(await c.req.json());
    if (!result.success) {
      return c.json(
        { error: "Invalid request", details: result.error },
        { status: 400 }
      );
    }

    const { dexId, customBrokerId } = result.data;

    const dex = await prisma.dex.findUnique({
      where: { id: dexId },
    });

    if (!dex) {
      return c.json(
        { success: false, message: "DEX not found" },
        { status: 404 }
      );
    }

    if (!dex.preferredBrokerId) {
      return c.json(
        {
          success: false,
          message: "This DEX has not requested a broker ID yet",
        },
        { status: 400 }
      );
    }

    const brokerId = customBrokerId || dex.preferredBrokerId;

    const updatedDex = await prisma.dex.update({
      where: { id: dexId },
      data: {
        brokerId,
        preferredBrokerId: brokerId,
      },
    });

    return c.json({
      success: true,
      message: "Broker ID approved successfully",
      dex: {
        id: updatedDex.id,
        brokerName: updatedDex.brokerName,
        brokerId: updatedDex.brokerId,
        preferredBrokerId: updatedDex.preferredBrokerId,
      },
    });
  } catch (error) {
    console.error("Error approving broker ID:", error);
    return c.json(
      {
        success: false,
        message: `Error approving broker ID: ${error instanceof Error ? error.message : String(error)}`,
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
        themeCSS: dex.themeCSS?.toString(),
        telegramLink: dex.telegramLink || undefined,
        discordLink: dex.discordLink || undefined,
        xLink: dex.xLink || undefined,
        walletConnectProjectId: dex.walletConnectProjectId || undefined,
        privyAppId: dex.privyAppId || undefined,
        privyTermsOfUse: dex.privyTermsOfUse || undefined,
        enabledMenus: dex.enabledMenus || undefined,
        customMenus: dex.customMenus || undefined,
        enableAbstractWallet: dex.enableAbstractWallet || false,
        disableMainnet: dex.disableMainnet || false,
        disableTestnet: dex.disableTestnet || false,
        disableEvmWallets: dex.disableEvmWallets || false,
        disableSolanaWallets: dex.disableSolanaWallets || false,
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
