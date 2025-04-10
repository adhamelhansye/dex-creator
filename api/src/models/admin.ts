import { prisma } from "../lib/prisma";

/**
 * Check if a user is an admin by their user ID
 * Uses Prisma's type-safe query API
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return user?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get all admin users
 * Uses Prisma's type-safe query API
 */
export async function getAllAdmins() {
  try {
    return await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        address: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Error getting all admins:", error);
    throw error;
  }
}
