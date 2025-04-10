import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createDex,
  dexSchema,
  getUserDex,
  getDexById,
  updateDex,
  deleteDex,
  updateDexRepoUrl,
  updateBrokerId,
} from "../models/dex";
import {
  forkTemplateRepository,
  setupRepositoryWithSingleCommit,
} from "../lib/github";
import { PrismaClient } from "@prisma/client";
import { generateRepositoryName } from "../lib/nameGenerator";
import { isUserAdmin } from "../models/admin";

const prisma = new PrismaClient();

// Create a router for authenticated routes
const dexRoutes = new Hono();

// Get the current user's DEX
dexRoutes.get("/", async c => {
  // Get the authenticated user's ID from the context
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const dex = await getUserDex(userId);
    return c.json(dex || { exists: false });
  } catch (error) {
    console.error("Error fetching DEX:", error);
    return c.json({ message: "Error fetching DEX", error: String(error) }, 500);
  }
});

// Get a specific DEX by ID
dexRoutes.get("/:id", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const dex = await getDexById(id);

    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    // Check if the DEX belongs to the user
    if (dex.userId !== userId) {
      return c.json({ message: "Unauthorized to access this DEX" }, 403);
    }

    return c.json(dex);
  } catch (error) {
    console.error("Error fetching DEX:", error);
    return c.json({ message: "Error fetching DEX", error: String(error) }, 500);
  }
});

// Create a new DEX
dexRoutes.post("/", zValidator("json", dexSchema), async c => {
  const data = c.req.valid("json");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const newDex = await createDex(data, userId);
    return c.json(newDex, 201);
  } catch (error) {
    console.error("Error creating DEX:", error);

    // Handle the case where user already has a DEX
    if (
      error instanceof Error &&
      error.message.includes("User already has a DEX")
    ) {
      return c.json({ message: error.message }, 400);
    }

    // Handle GitHub API errors separately with more descriptive messages
    if (
      error instanceof Error &&
      error.message.includes("Failed to fork repository")
    ) {
      return c.json(
        {
          message: "Error creating DEX repository. Please try again later.",
          error: error.message,
          repositoryError: true,
        },
        500
      );
    }

    return c.json({ message: "Error creating DEX", error: String(error) }, 500);
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

// Update an existing DEX
dexRoutes.put("/:id", zValidator("json", dexSchema), async c => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Update the DEX in the database
    const updatedDex = await updateDex(id, data, userId);

    // Check if the DEX has a repository URL and update the config files if needed
    if (updatedDex.repoUrl) {
      const repoInfo = extractRepoInfoFromUrl(updatedDex.repoUrl);

      if (repoInfo) {
        try {
          // Use our new function to update everything in one commit
          await setupRepositoryWithSingleCommit(
            repoInfo.owner,
            repoInfo.repo,
            {
              brokerId: updatedDex.brokerId,
              brokerName: updatedDex.brokerName,
              themeCSS: updatedDex.themeCSS?.toString(),
              telegramLink: updatedDex.telegramLink || undefined,
              discordLink: updatedDex.discordLink || undefined,
              xLink: updatedDex.xLink || undefined,
            },
            {
              primaryLogo: updatedDex.primaryLogo || undefined,
              secondaryLogo: updatedDex.secondaryLogo || undefined,
              favicon: updatedDex.favicon || undefined,
            }
          );

          console.log(
            `Successfully updated repository files for ${updatedDex.brokerName} with a single commit`
          );
        } catch (configError) {
          // Log the error but don't fail the update
          console.error("Error updating repository files:", configError);
          // We continue and return the updated DEX even if the repo update failed
        }
      }
    }

    return c.json(updatedDex);
  } catch (error) {
    console.error("Error updating DEX:", error);

    // Handle unauthorized access
    if (
      error instanceof Error &&
      error.message.includes("user is not authorized")
    ) {
      return c.json({ message: error.message }, 403);
    }

    // Handle DEX not found
    if (error instanceof Error && error.message.includes("DEX not found")) {
      return c.json({ message: "DEX not found" }, 404);
    }

    return c.json({ message: "Error updating DEX", error: String(error) }, 500);
  }
});

// Delete a DEX
dexRoutes.delete("/:id", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    await deleteDex(id, userId);
    return c.json({ message: "DEX deleted successfully" });
  } catch (error) {
    console.error("Error deleting DEX:", error);

    // Handle unauthorized access
    if (
      error instanceof Error &&
      error.message.includes("user is not authorized")
    ) {
      return c.json({ message: error.message }, 403);
    }

    // Handle DEX not found
    if (error instanceof Error && error.message.includes("DEX not found")) {
      return c.json({ message: "DEX not found" }, 404);
    }

    return c.json({ message: "Error deleting DEX", error: String(error) }, 500);
  }
});

// Fork the template repository and set up DEX
dexRoutes.post("/:id/fork", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    // Get the DEX details
    const dex = await getDexById(id);

    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    // Check if the DEX belongs to the user
    if (dex.userId !== userId) {
      return c.json({ message: "Unauthorized to access this DEX" }, 403);
    }

    // Check if this DEX already has a repository
    if (dex.repoUrl) {
      return c.json(
        {
          message: "This DEX already has a repository",
          repoUrl: dex.repoUrl,
        },
        400
      );
    }

    // Check if broker name exists
    if (!dex.brokerName || dex.brokerName.trim() === "") {
      return c.json(
        { message: "Broker name is required to create a repository" },
        400
      );
    }

    // Get user's wallet address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { address: true },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    // Use the standardized repository name generator - same as in createDex
    const baseRepoName = generateRepositoryName(dex.brokerName);

    // Ensure repo name doesn't exceed GitHub's limits (90 chars)
    let repoName = baseRepoName.substring(0, 90);
    let finalRepoName = repoName;

    // Check for name collision and append timestamp if needed
    let nameCollision = true;
    let attemptCount = 0;

    while (nameCollision && attemptCount < 5) {
      try {
        // Assume no collision for the first attempt
        nameCollision = false;

        if (attemptCount > 0) {
          // If we've tried before, add a timestamp
          const timestamp = Date.now().toString().slice(-6);
          const suffix = `-${timestamp}`;
          finalRepoName = repoName.substring(0, 90 - suffix.length) + suffix;
        }

        attemptCount++;
      } catch (error: unknown) {
        // If this is a 404 error, the repo doesn't exist
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          error.status === 404
        ) {
          nameCollision = false;
        } else {
          // For other errors, just continue with the loop
          attemptCount++;
        }
      }
    }

    if (nameCollision) {
      return c.json(
        {
          message:
            "Could not generate a unique repository name after multiple attempts",
        },
        500
      );
    }

    // Fork the template repository
    const repoUrl = await forkTemplateRepository(finalRepoName);

    // Extract repo name from URL for further operations
    const repoPath = repoUrl.split("github.com/")[1];
    const [owner, repo] = repoPath.split("/");

    // Use our new function to update DEX config, workflow files, and logo files in a single commit
    await setupRepositoryWithSingleCommit(
      owner,
      repo,
      {
        brokerId: dex.brokerId,
        brokerName: dex.brokerName,
        themeCSS: dex.themeCSS?.toString(),
        telegramLink: dex.telegramLink || undefined,
        discordLink: dex.discordLink || undefined,
        xLink: dex.xLink || undefined,
      },
      {
        primaryLogo: dex.primaryLogo || undefined,
        secondaryLogo: dex.secondaryLogo || undefined,
        favicon: dex.favicon || undefined,
      }
    );

    // Update the DEX record with the repository URL
    const updatedDex = await updateDexRepoUrl(id, repoUrl, userId);

    return c.json({
      message: "Repository forked successfully",
      dex: updatedDex,
    });
  } catch (error) {
    console.error("Error forking repository:", error);
    return c.json(
      { message: "Error forking repository", error: String(error) },
      500
    );
  }
});

// Admin endpoint to update brokerId
dexRoutes.post("/:id/broker-id", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Validate the request body
  const brokerIdSchema = z.object({
    brokerId: z.string().min(1).max(50),
  });

  // Validate body
  let body;
  try {
    body = await c.req.json();
    brokerIdSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

  try {
    // Check if the user is an admin
    const isAdmin = await isUserAdmin(userId);

    if (!isAdmin) {
      return c.json({ message: "Forbidden: Admin access required" }, 403);
    }

    // Get the DEX with current data before updating
    const dex = await getDexById(id);
    if (!dex) {
      return c.json({ message: "DEX not found" }, 404);
    }

    // Update the broker ID in the database
    const updatedDex = await updateBrokerId(id, body.brokerId);

    // If the DEX has a repository, update the config files
    if (updatedDex.repoUrl) {
      const repoInfo = extractRepoInfoFromUrl(updatedDex.repoUrl);

      if (repoInfo) {
        try {
          // Use our new function to update everything in one commit
          await setupRepositoryWithSingleCommit(
            repoInfo.owner,
            repoInfo.repo,
            {
              brokerId: body.brokerId,
              brokerName: updatedDex.brokerName,
              themeCSS: updatedDex.themeCSS?.toString(),
              telegramLink: updatedDex.telegramLink || undefined,
              discordLink: updatedDex.discordLink || undefined,
              xLink: updatedDex.xLink || undefined,
            },
            {
              primaryLogo: updatedDex.primaryLogo || undefined,
              secondaryLogo: updatedDex.secondaryLogo || undefined,
              favicon: updatedDex.favicon || undefined,
            }
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

// Admin endpoint to delete a DEX by wallet address
dexRoutes.delete("/admin/delete", async c => {
  // Get the authenticated user's ID from the context
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Validate request body
  const schema = z.object({
    walletAddress: z.string(),
  });

  const result = schema.safeParse(await c.req.json());

  if (!result.success) {
    return c.json(
      { error: "Invalid request body", details: result.error },
      400
    );
  }

  const { walletAddress } = result.data;

  try {
    // Check if the user is an admin
    const isAdmin = await isUserAdmin(userId);

    if (!isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    // Get the user whose DEX should be deleted
    const targetUser = await prisma.user.findFirst({
      where: {
        address: walletAddress,
      },
    });

    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Delete the DEX using Prisma's type-safe query
    await prisma.dex.deleteMany({
      where: {
        userId: targetUser.id,
      },
    });

    return c.json({ success: true, message: "DEX deleted successfully" });
  } catch (error) {
    console.error("Error deleting DEX:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default dexRoutes;
