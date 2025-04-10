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
  updateDexConfig,
  uploadLogoFiles,
} from "../lib/github";
import { PrismaClient } from "@prisma/client";
import { generateRepositoryName } from "../lib/nameGenerator";

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

// Update an existing DEX
dexRoutes.put("/:id", zValidator("json", dexSchema), async c => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const updatedDex = await updateDex(id, data, userId);
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

    // Update DEX config in the new repository
    await updateDexConfig(owner, repo, {
      brokerId: dex.brokerId,
      brokerName: dex.brokerName,
      themeCSS: dex.themeCSS?.toString(),
      telegramLink: dex.telegramLink || undefined,
      discordLink: dex.discordLink || undefined,
      xLink: dex.xLink || undefined,
    });

    // Upload logo files if available
    await uploadLogoFiles(owner, repo, {
      primaryLogo: dex.primaryLogo || undefined,
      secondaryLogo: dex.secondaryLogo || undefined,
      favicon: dex.favicon || undefined,
    });

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

// Update repository URL after forking
dexRoutes.post("/:id/repo", async c => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  // Validate the request body
  const repoSchema = z.object({
    repoUrl: z.string().url(),
  });

  // Validate body
  let body;
  try {
    body = await c.req.json();
    repoSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const updatedDex = await updateDexRepoUrl(id, body.repoUrl, userId);
    return c.json(updatedDex);
  } catch (error) {
    console.error("Error updating repository URL:", error);

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

    return c.json(
      { message: "Error updating repository URL", error: String(error) },
      500
    );
  }
});

// Admin endpoint to update brokerId
dexRoutes.post("/:id/broker-id", async c => {
  const id = c.req.param("id");

  // Validate the request body
  const brokerIdSchema = z.object({
    brokerId: z.string().min(1).max(50),
    adminKey: z.string(), // Admin API key for authorization
  });

  // Validate body
  let body;
  try {
    body = await c.req.json();
    brokerIdSchema.parse(body);
  } catch (e) {
    return c.json({ message: "Invalid request body", error: String(e) }, 400);
  }

  // Check admin API key (this should be properly implemented with a secure method)
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey || body.adminKey !== adminApiKey) {
    return c.json({ message: "Unauthorized: Invalid admin credentials" }, 403);
  }

  try {
    const updatedDex = await updateBrokerId(id, body.brokerId);
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
    // Check if the user is an admin using raw query
    const adminCheck = await prisma.$queryRawUnsafe(
      `SELECT "isAdmin" FROM "User" WHERE id = $1`,
      userId
    );

    const isAdmin =
      adminCheck &&
      Array.isArray(adminCheck) &&
      adminCheck.length > 0 &&
      adminCheck[0].isAdmin === true;

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

    // Delete the DEX
    await prisma.$queryRawUnsafe(
      `DELETE FROM "Dex" WHERE "userId" = $1`,
      targetUser.id
    );

    return c.json({ success: true, message: "DEX deleted successfully" });
  } catch (error) {
    console.error("Error deleting DEX:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default dexRoutes;
