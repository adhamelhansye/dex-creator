import { prisma } from "../lib/prisma";

/**
 * Check if a user is an admin by their user ID
 * This uses a raw query to avoid TypeScript issues
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Use raw query to avoid TypeScript issues
    const result = await prisma.$queryRawUnsafe(
      `SELECT "isAdmin" FROM "User" WHERE id = $1`,
      userId
    );

    // Result is an array of objects with the isAdmin property
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0].isAdmin === true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get all admin users
 * This uses a raw query to avoid TypeScript issues with the schema
 */
export async function getAllAdmins() {
  try {
    // Use raw query to avoid TypeScript issues
    return await prisma.$queryRawUnsafe(
      `SELECT id, address, "isAdmin", "createdAt", "updatedAt" FROM "User" WHERE "isAdmin" = true`
    );
  } catch (error) {
    console.error("Error getting all admins:", error);
    throw error;
  }
}
