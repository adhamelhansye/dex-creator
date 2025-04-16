import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { Prisma, Dex } from "@prisma/client";
import {
  forkTemplateRepository,
  setupRepositoryWithSingleCommit,
  deleteRepository,
} from "../lib/github";
import { generateRepositoryName } from "../lib/nameGenerator";

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

// Create schema for validation with base64-encoded image data
export const dexSchema = z.object({
  brokerName: z.string().min(3).max(50).nullish(),
  themeCSS: z.string().nullish(),
  // For image data, expect base64-encoded strings
  primaryLogo: z.string().nullish(),
  secondaryLogo: z.string().nullish(),
  favicon: z.string().nullish(),
  telegramLink: z.string().url().nullish(),
  discordLink: z.string().url().nullish(),
  xLink: z.string().url().nullish(),
});

// Helper function to generate a simple ID
export function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Create DEX in database
export async function createDex(
  data: z.infer<typeof dexSchema>,
  userId: string
): Promise<Dex> {
  // First check if user already has a DEX
  const existingDex = await getUserDex(userId);

  if (existingDex) {
    throw new Error(
      "User already has a DEX. Only one DEX per user is allowed."
    );
  }

  // Get the user's address to use as the repo owner
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { address: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate a repository name based on the broker name or a default
  const brokerName = data.brokerName || "Orderly DEX";

  // Use the helper function to generate a standardized repository name
  const repoName = generateRepositoryName(brokerName);

  let repoUrl: string;

  // First create the repository - this is required for DEX creation
  try {
    console.log(
      "Creating repository in OrderlyNetworkDexCreator organization..."
    );
    repoUrl = await forkTemplateRepository(repoName);
    console.log(`Successfully forked repository: ${repoUrl}`);

    // Extract repo info from URL
    const repoInfo = extractRepoInfoFromUrl(repoUrl);
    if (!repoInfo) {
      throw new Error(
        `Failed to extract repository information from URL: ${repoUrl}`
      );
    }

    // Always use 'demo' as the brokerId - only admins can change this
    const brokerId = "demo";

    // Set up the repository with a single commit
    await setupRepositoryWithSingleCommit(
      repoInfo.owner,
      repoInfo.repo,
      {
        brokerId,
        brokerName,
        themeCSS: data.themeCSS?.toString(),
        telegramLink: data.telegramLink || undefined,
        discordLink: data.discordLink || undefined,
        xLink: data.xLink || undefined,
      },
      {
        primaryLogo: data.primaryLogo || undefined,
        secondaryLogo: data.secondaryLogo || undefined,
        favicon: data.favicon || undefined,
      }
    );
    console.log(`Successfully set up repository for ${brokerName}`);
  } catch (error) {
    // If repository creation fails, the entire DEX creation fails
    console.error("Error creating repository:", error);

    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide more context for common errors
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

  // If we get here, repository creation was successful
  // Now create the DEX in the database
  try {
    // Always use 'demo' as the brokerId - only admins can change this
    const brokerId = "demo";

    return await prisma.dex.create({
      data: {
        brokerName: data.brokerName ?? undefined,
        brokerId: brokerId,
        themeCSS: data.themeCSS,
        primaryLogo: data.primaryLogo,
        secondaryLogo: data.secondaryLogo,
        favicon: data.favicon,
        telegramLink: data.telegramLink,
        discordLink: data.discordLink,
        xLink: data.xLink,
        repoUrl: repoUrl, // Repository URL is now guaranteed to exist
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  } catch (dbError) {
    console.error("Error creating DEX in database:", dbError);

    // Try to clean up by deleting the repository we just created
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

// Get the DEX for a specific user
export async function getUserDex(userId: string): Promise<Dex | null> {
  return prisma.dex.findUnique({
    where: {
      userId,
    },
  });
}

// Get a specific DEX by ID
export async function getDexById(id: string): Promise<Dex | null> {
  return prisma.dex.findUnique({
    where: {
      id,
    },
  });
}

// Update a DEX
export async function updateDex(
  id: string,
  data: z.infer<typeof dexSchema>,
  userId: string
): Promise<Dex> {
  // Ensure the DEX belongs to the user
  const dex = await getDexById(id);

  if (!dex || dex.userId !== userId) {
    throw new Error("DEX not found or user is not authorized to update it");
  }

  // Prepare update data with properly typed properties
  const updateData: Prisma.DexUpdateInput = {};

  // Only update fields if they're provided
  if (data.brokerName != null) updateData.brokerName = data.brokerName;
  if (data.themeCSS != null) updateData.themeCSS = data.themeCSS;
  if (data.telegramLink != null) updateData.telegramLink = data.telegramLink;
  if (data.discordLink != null) updateData.discordLink = data.discordLink;
  if (data.xLink != null) updateData.xLink = data.xLink;

  // Handle image data with type assertions
  if (data.primaryLogo != null) updateData.primaryLogo = data.primaryLogo;
  if (data.secondaryLogo != null) updateData.secondaryLogo = data.secondaryLogo;
  if (data.favicon != null) updateData.favicon = data.favicon;

  return prisma.dex.update({
    where: {
      id,
    },
    data: updateData,
  });
}

// Delete a DEX
export async function deleteDex(id: string, userId: string): Promise<Dex> {
  // Ensure the DEX belongs to the user
  const dex = await getDexById(id);

  if (!dex || dex.userId !== userId) {
    throw new Error("DEX not found or user is not authorized to delete it");
  }

  // If the DEX has a GitHub repository, attempt to delete it
  if (dex.repoUrl) {
    try {
      const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
      if (repoInfo) {
        // Attempt to delete the repository, but continue even if it fails
        await deleteRepository(repoInfo.owner, repoInfo.repo);
      }
    } catch (error) {
      console.error("Error deleting GitHub repository:", error);
      // Continue with DEX deletion even if repository deletion fails
    }
  }

  // Delete the DEX from the database
  return prisma.dex.delete({
    where: {
      id,
    },
  });
}

// Update DEX repository URL after forking
export async function updateDexRepoUrl(
  id: string,
  repoUrl: string
): Promise<Dex> {
  // Simply update the repository URL without any ownership checks
  // Authorization should be handled at the controller/route level
  return prisma.dex.update({
    where: {
      id,
    },
    data: {
      repoUrl,
    },
  });
}

// Update broker ID (admin only)
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
    },
  });
}

// Delete a DEX by wallet address (admin only)
export async function deleteDexByWalletAddress(
  address: string
): Promise<Dex | null> {
  // First find the user by address
  const user = await prisma.user.findUnique({
    where: {
      address: address.toLowerCase(), // Ensure address is in lowercase
    },
    include: {
      dex: true,
    },
  });

  // If no user or no DEX, return null
  if (!user || !user.dex) {
    return null;
  }

  const dexId = user.dex.id;
  const dex = user.dex;

  // If the DEX has a GitHub repository, attempt to delete it
  if (dex.repoUrl) {
    try {
      const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
      if (repoInfo) {
        // Attempt to delete the repository, but continue even if it fails
        await deleteRepository(repoInfo.owner, repoInfo.repo);
      }
    } catch (error) {
      console.error("Error deleting GitHub repository:", error);
      // Continue with DEX deletion even if repository deletion fails
    }
  }

  // Delete the DEX
  return prisma.dex.delete({
    where: {
      id: dexId,
    },
  });
}

// Get all DEXes with associated user data (admin only)
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
