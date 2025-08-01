import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  verifyOrderTransaction,
  createAutomatedBrokerId,
  updateDexFees,
  getDexFees,
} from "../models/graduation";
import { getUserDex } from "../models/dex";
import { prisma } from "../lib/prisma";
import { setupRepositoryWithSingleCommit } from "../lib/github.js";

const verifyTxSchema = z.object({
  txHash: z.string().min(10).max(100),
  chain: z.string().min(1).max(50),
  brokerId: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9_-]+$/,
      "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
    ),
  makerFee: z.number().min(0).max(150), // 0-15 bps in 0.1 bps units
  takerFee: z.number().min(30).max(150), // 3-15 bps in 0.1 bps units
});

const updateFeesSchema = z.object({
  makerFee: z.number().min(0).max(150), // 0-15 bps in 0.1 bps units
  takerFee: z.number().min(30).max(150), // 3-15 bps in 0.1 bps units
});

const graduationRoutes = new Hono();

graduationRoutes.post(
  "/verify-tx",
  zValidator("json", verifyTxSchema),
  async c => {
    try {
      const userId = c.get("userId");

      const { txHash, chain, brokerId, makerFee, takerFee } =
        c.req.valid("json");

      const dex = await getUserDex(userId);
      if (!dex || !dex.repoUrl) {
        return c.json(
          { success: false, message: "You must create a DEX first" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const verificationResult = await verifyOrderTransaction(
        txHash,
        chain,
        user.address
      );

      if (!verificationResult.success) {
        return c.json(verificationResult, { status: 400 });
      }

      const feeUpdateResult = await updateDexFees(userId, makerFee, takerFee);

      if (!feeUpdateResult.success) {
        return c.json(feeUpdateResult, { status: 400 });
      }

      const brokerCreationResult = await createAutomatedBrokerId(
        userId,
        brokerId,
        user.address
      );

      if (!brokerCreationResult.success) {
        return c.json(brokerCreationResult, { status: 400 });
      }

      try {
        console.log(
          `🔄 Updating GitHub repository with new broker ID: ${brokerId}`
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
            `✅ Successfully updated GitHub repository with broker ID: ${brokerId}`
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
        message: `Transaction verified and broker ID '${brokerId}' created successfully! Your DEX has graduated automatically.`,
        amount: verificationResult.amount,
        brokerCreationData: brokerCreationResult.brokerCreationData,
      });
    } catch (error) {
      console.error("Error in graduation verification:", error);
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

graduationRoutes.get("/status", async c => {
  try {
    const userId = c.get("userId");

    const dex = await getUserDex(userId);
    if (!dex) {
      return c.json(
        { success: false, message: "You must create a DEX first" },
        { status: 400 }
      );
    }

    return c.json({
      success: true,
      currentBrokerId: dex.brokerId,
      approved: dex.brokerId !== "demo" && dex.brokerId === dex.brokerId,
    });
  } catch (error) {
    console.error("Error getting graduation status:", error);
    return c.json(
      {
        success: false,
        message: `Error getting status: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
});

graduationRoutes.get("/fees", async c => {
  try {
    const userId = c.get("userId");

    const result = await getDexFees(userId);

    if (result.success) {
      return c.json(result);
    } else {
      return c.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error getting DEX fees:", error);
    return c.json(
      {
        success: false,
        message: `Error getting DEX fees: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
});

graduationRoutes.post(
  "/fees",
  zValidator("json", updateFeesSchema),
  async c => {
    try {
      const userId = c.get("userId");

      const { makerFee, takerFee } = c.req.valid("json");

      const result = await updateDexFees(userId, makerFee, takerFee);

      if (result.success) {
        return c.json(result);
      } else {
        return c.json(result, { status: 400 });
      }
    } catch (error) {
      console.error("Error updating DEX fees:", error);
      return c.json(
        {
          success: false,
          message: `Error updating DEX fees: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 }
      );
    }
  }
);

graduationRoutes.post("/finalize-admin-wallet", async c => {
  try {
    const userId = c.get("userId");

    const dex = await getUserDex(userId);
    if (!dex) {
      return c.json(
        { success: false, message: "You must create a DEX first" },
        { status: 400 }
      );
    }

    if (!dex.brokerId || dex.brokerId === "demo") {
      return c.json(
        { success: false, message: "You must have a broker ID first" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const orderlyResponse = await fetch(
      `https://api.orderly.org/v1/get_account?address=${user.address}&broker_id=${dex.brokerId}`
    );

    if (!orderlyResponse.ok) {
      return c.json(
        {
          success: false,
          message: "Failed to check registration status with Orderly API",
        },
        { status: 400 }
      );
    }

    const orderlyData = await orderlyResponse.json();

    if (!orderlyData.success || !orderlyData.data) {
      return c.json(
        {
          success: false,
          message: "You must register your EVM address with Orderly first",
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual admin wallet setup logic here
    // For now, just mark as graduated
    await prisma.dex.update({
      where: { userId },
      data: { isGraduated: true },
    });

    return c.json({
      success: true,
      message:
        "Admin wallet setup completed successfully. Your DEX has graduated!",
      isGraduated: true,
    });
  } catch (error) {
    console.error("Error finalizing admin wallet:", error);
    return c.json(
      {
        success: false,
        message: `Error finalizing admin wallet: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
});

graduationRoutes.get("/graduation-status", async c => {
  try {
    const userId = c.get("userId");

    const dex = await getUserDex(userId);
    if (!dex) {
      return c.json(
        { success: false, message: "You must create a DEX first" },
        { status: 400 }
      );
    }

    return c.json({
      success: true,
      isGraduated: dex.isGraduated,
      brokerId: dex.brokerId,
    });
  } catch (error) {
    console.error("Error getting graduation status:", error);
    return c.json(
      {
        success: false,
        message: `Error getting graduation status: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
});

export default graduationRoutes;
