import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createDex,
  dexSchema,
  getUserDex,
  getDexById,
  updateDex,
  deleteDex,
  updateDexRepoUrl,
} from "../models/dex";
import {
  forkTemplateRepository,
  setupRepositoryWithSingleCommit,
  getWorkflowRunStatus,
  getWorkflowRunDetails,
  updateDexConfig,
} from "../lib/github";
import { PrismaClient } from "@prisma/client";
import { generateRepositoryName } from "../lib/nameGenerator";

const prisma = new PrismaClient();

// Create a router for authenticated routes
const dexRoutes = new Hono();

// Get the current user's DEX
dexRoutes.get("/", async c => {
  try {
    // Get userId from context (set by authMiddleware)
    const userId = c.get("userId");

    // Get the user's DEX
    const dex = await getUserDex(userId);
    if (!dex) {
      return c.json({ exists: false }, { status: 200 });
    }

    // Return the DEX
    return c.json(dex, { status: 200 });
  } catch (error) {
    console.error("Error getting DEX:", error);
    return c.json({ error: "Failed to get DEX information" }, { status: 500 });
  }
});

// Get a specific DEX by ID
dexRoutes.get("/:id", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

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
  try {
    // Get userId from context (set by authMiddleware)
    const userId = c.get("userId");

    // Parse the request body
    const data = await c.req.json();

    // Create the DEX
    const dex = await createDex(data, userId);

    return c.json(dex, { status: 201 });
  } catch (error) {
    console.error("Error creating DEX:", error);
    let message = "Failed to create DEX";
    if (error instanceof Error) {
      message = error.message;
    }
    return c.json({ error: message }, { status: 500 });
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

  try {
    // Update the DEX in the database
    const updatedDex = await updateDex(id, data, userId);

    // Check if the DEX has a repository URL and update the config files if needed
    if (updatedDex.repoUrl) {
      const repoInfo = extractRepoInfoFromUrl(updatedDex.repoUrl);

      if (repoInfo) {
        try {
          // Use our new function to update everything in one commit
          await updateDexConfig(
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

// Delete a user's DEX
dexRoutes.delete("/:id", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  try {
    const deletedDex = await deleteDex(id, userId);
    return c.json({ message: "DEX deleted successfully", dex: deletedDex });
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

// Get workflow status for a DEX's repository
dexRoutes.get("/:id/workflow-status", async c => {
  const id = c.req.param("id");
  const workflowName = c.req.query("workflow");
  const userId = c.get("userId");

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

    // Check if this DEX has a repository
    if (!dex.repoUrl) {
      return c.json({ message: "This DEX does not have a repository" }, 400);
    }

    // Extract owner and repo from GitHub URL
    const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
    if (!repoInfo) {
      return c.json({ message: "Invalid repository URL" }, 400);
    }

    // Get workflow runs
    const workflowRuns = await getWorkflowRunStatus(
      repoInfo.owner,
      repoInfo.repo,
      workflowName
    );

    return c.json(workflowRuns);
  } catch (error) {
    console.error("Error fetching workflow status:", error);
    return c.json(
      { message: "Error fetching workflow status", error: String(error) },
      500
    );
  }
});

// Get details for a specific workflow run
dexRoutes.get("/:id/workflow-runs/:runId", async c => {
  const id = c.req.param("id");
  const runId = parseInt(c.req.param("runId"), 10);
  const userId = c.get("userId");

  if (isNaN(runId)) {
    return c.json({ message: "Invalid run ID" }, 400);
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

    // Check if this DEX has a repository
    if (!dex.repoUrl) {
      return c.json({ message: "This DEX does not have a repository" }, 400);
    }

    // Extract owner and repo from GitHub URL
    const repoInfo = extractRepoInfoFromUrl(dex.repoUrl);
    if (!repoInfo) {
      return c.json({ message: "Invalid repository URL" }, 400);
    }

    // Get workflow run details
    const runDetails = await getWorkflowRunDetails(
      repoInfo.owner,
      repoInfo.repo,
      runId
    );

    return c.json(runDetails);
  } catch (error) {
    console.error("Error fetching workflow run details:", error);
    return c.json(
      {
        message: "Error fetching workflow run details",
        error: String(error),
      },
      500
    );
  }
});

export default dexRoutes;
