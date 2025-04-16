import { Context, Hono } from "hono";
import { z } from "zod";
import { getAllAdmins, isUserAdmin } from "../models/admin";
import { getDexById, updateBrokerId, updateDexRepoUrl } from "../models/dex";
import { PrismaClient } from "@prisma/client";
import {
  setupRepositoryWithSingleCommit,
  renameRepository,
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
adminRoutes.get("/check", async (c: Context) => {
  // Get userId from context if it exists (user might not be logged in)
  const userId = c.get("userId") as string | undefined;

  // If no userId is provided, user is not logged in, so definitely not admin
  if (!userId) {
    return c.json({ isAdmin: false }, 200);
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(userId);
  return c.json({ isAdmin }, 200);
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

// Admin endpoint to delete a DEX by wallet address (protected by adminMiddleware)
adminRoutes.delete("/dex/delete", async (c: AdminContext) => {
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

export default adminRoutes;
