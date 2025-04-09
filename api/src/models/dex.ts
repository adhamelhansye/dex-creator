import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { Prisma, Dex } from "@prisma/client";
import { forkTemplateRepository } from "../lib/github";

// Create schema for validation with base64-encoded image data
export const dexSchema = z.object({
  brokerName: z.string().min(3).max(50).optional(),
  themeCSS: z.string().optional(),
  // For image data, expect base64-encoded strings
  primaryLogo: z.string().optional(),
  secondaryLogo: z.string().optional(),
  favicon: z.string().optional(),
  telegramLink: z.string().url().optional(),
  discordLink: z.string().url().optional(),
  xLink: z.string().url().optional(),
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

  // Sanitize broker name to a clean dash-case format for shorter URLs
  // This creates a cleaner, shorter GitHub Pages URL
  let repoName = brokerName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove any characters that aren't alphanumeric or hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, "") // Remove leading and trailing hyphens
    .substring(0, 30); // Keep it reasonably short

  // Add a short, unique suffix ONLY if we're concerned about name collisions
  // Just use last 4 digits of the timestmap to keep it short
  const shortUniqueSuffix = Date.now().toString().slice(-4);
  repoName = `${repoName}-${shortUniqueSuffix}`;

  console.log(
    `Generated repository name: ${repoName} for wallet address ${user.address}`
  );

  let repoUrl = null;
  let forkError = null;

  // Try to fork the template repository, but don't prevent DEX creation if it fails
  try {
    console.log(
      "Attempting to create repository in OrderlyNetworkDexCreator organization..."
    );
    repoUrl = await forkTemplateRepository(repoName);
    console.log(`Successfully forked repository: ${repoUrl}`);
  } catch (error) {
    console.error("Error forking repository:", error);

    // Enhance error information for debugging
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common GitHub API errors
      if (
        errorMessage.includes(
          "Resource not accessible by personal access token"
        )
      ) {
        console.error(
          "Permission error: The GitHub token does not have sufficient permissions to create repositories in the OrderlyNetworkDexCreator organization."
        );
      } else if (errorMessage.includes("Not Found")) {
        console.error(
          "Not Found error: The GitHub template repository or organization may not exist or is not accessible."
        );
      }
    }

    forkError = new Error(`Repository creation failed: ${errorMessage}`);
    // Continue with DEX creation even though forking failed
  }

  // Create the DEX with base64-encoded image data and the repo URL (if available)
  try {
    const dex = await prisma.$transaction(async tx => {
      // Create properly typed data object
      return tx.dex.create({
        data: {
          brokerName: data.brokerName,
          themeCSS: data.themeCSS,
          primaryLogo: data.primaryLogo,
          secondaryLogo: data.secondaryLogo,
          favicon: data.favicon,
          telegramLink: data.telegramLink,
          discordLink: data.discordLink,
          xLink: data.xLink,
          repoUrl: repoUrl, // This will be null if forking failed
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
    });

    // If there was a forking error, log it but return the DEX anyway
    if (forkError) {
      console.warn(`DEX created but repository forking failed: ${forkError}`);
    }

    return dex;
  } catch (dbError) {
    console.error("Error creating DEX in database:", dbError);

    // If we had a forking error earlier, include it in the error message
    if (forkError) {
      throw new Error(
        `Database error: ${dbError}. Additionally, repository forking failed: ${forkError}`
      );
    }

    throw dbError;
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
  if (data.brokerName !== undefined) updateData.brokerName = data.brokerName;
  if (data.themeCSS !== undefined) updateData.themeCSS = data.themeCSS;
  if (data.telegramLink !== undefined)
    updateData.telegramLink = data.telegramLink;
  if (data.discordLink !== undefined) updateData.discordLink = data.discordLink;
  if (data.xLink !== undefined) updateData.xLink = data.xLink;

  // Handle image data with type assertions
  if (data.primaryLogo !== undefined) updateData.primaryLogo = data.primaryLogo;
  if (data.secondaryLogo !== undefined)
    updateData.secondaryLogo = data.secondaryLogo;
  if (data.favicon !== undefined) updateData.favicon = data.favicon;

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

  return prisma.dex.delete({
    where: {
      id,
    },
  });
}

// Update DEX repository URL after forking
export async function updateDexRepoUrl(
  id: string,
  repoUrl: string,
  userId: string
): Promise<Dex> {
  // Ensure the DEX belongs to the user
  const dex = await getDexById(id);

  if (!dex || dex.userId !== userId) {
    throw new Error("DEX not found or user is not authorized to update it");
  }

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

  // Delete the DEX
  return prisma.dex.delete({
    where: {
      id: dexId,
    },
  });
}
