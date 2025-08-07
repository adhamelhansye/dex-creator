import { Context } from "hono";
import { prisma } from "./prisma";

/**
 * Parse JWT token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token or null if not found or invalid format
 */
function parseJwt(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return token || null;
}

/**
 * Verify an authentication token and return the user ID if valid
 * @param token The auth token to verify
 * @returns User ID if token is valid, null otherwise
 */
async function verifyAuthToken(token: string): Promise<string | null> {
  try {
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return null;
    }

    return tokenRecord.userId;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Authentication middleware for protecting routes
 * @param c Hono context
 * @param next Next function
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = parseJwt(authHeader);

  if (!token) {
    return c.json({ error: "Unauthorized: No valid token provided" }, 401);
  }

  try {
    const userId = await verifyAuthToken(token);

    if (!userId) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }

    c.set("userId", userId);
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication error" }, 500);
  }
  await next();
}

/**
 * Admin middleware - same as auth middleware but also checks if user is an admin
 */
export async function adminMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = parseJwt(authHeader);

  if (!token) {
    return c.json({ error: "Unauthorized: No valid token provided" }, 401);
  }

  try {
    const userId = await verifyAuthToken(token);

    if (!userId) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    c.set("userId", userId);
    c.set("isAdmin", true);
  } catch (error) {
    console.error("Admin authentication error:", error);
    return c.json({ error: "Authentication error" }, 500);
  }
  await next();
}
