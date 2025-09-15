import { z } from "zod";
import { prisma } from "../lib/prisma";

export const userSchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  nonce: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export const authRequestSchema = z.object({
  address: ethereumAddressSchema,
});

export const authVerifySchema = z.object({
  address: ethereumAddressSchema,
  signature: z.string(),
});

export const tokenValidationSchema = z.object({
  address: ethereumAddressSchema,
  token: z.string(),
});

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
    const token = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

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
    const tokenData = await prisma.token.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return false;
    }

    if (tokenData.userId !== userId) {
      return false;
    }

    if (new Date() > tokenData.expiresAt) {
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
