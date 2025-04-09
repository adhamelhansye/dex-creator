import { z } from "zod";
import { prisma } from "../lib/prisma";

// User schema
export const userSchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  nonce: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

// Authentication request schema
export const authRequestSchema = z.object({
  address: z.string(),
});

// Authentication verification schema
export const authVerifySchema = z.object({
  address: z.string(),
  signature: z.string(),
});

// Token validation schema
export const tokenValidationSchema = z.object({
  address: z.string(),
  token: z.string(),
});

// Database-backed user store
class UserStore {
  async findByAddress(address: string) {
    return prisma.user.findUnique({
      where: {
        address: address.toLowerCase(),
      },
    });
  }

  async createOrUpdate(user: User) {
    const now = new Date();
    const existingUser = await this.findByAddress(user.address);

    if (existingUser) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nonce: user.nonce,
          updatedAt: now,
        },
      });
    } else {
      return prisma.user.create({
        data: {
          address: user.address.toLowerCase(),
          nonce: user.nonce,
        },
      });
    }
  }

  async generateNonce(address: string): Promise<string> {
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const existingUser = await this.findByAddress(address);

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { nonce },
      });
    } else {
      await prisma.user.create({
        data: {
          address: address.toLowerCase(),
          nonce,
        },
      });
    }

    return nonce;
  }

  async createToken(userId: string): Promise<string> {
    // Generate a new token
    const token = crypto.randomUUID();

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store the token
    await prisma.token.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateToken(token: string, userId: string): Promise<boolean> {
    // Find the token in the database
    const tokenData = await prisma.token.findUnique({
      where: { token },
    });

    // Check if token exists
    if (!tokenData) {
      return false;
    }

    // Check if token belongs to the user
    if (tokenData.userId !== userId) {
      return false;
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      // Remove expired token
      await prisma.token.delete({
        where: { id: tokenData.id },
      });
      return false;
    }

    return true;
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      await prisma.token.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      console.error("Error revoking token:", error);
      return false;
    }
  }

  // Clean up expired tokens (this can be called periodically)
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

export const userStore = new UserStore();
