import { z } from "zod";
import { getPrisma } from "../lib/prisma";

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
    const prismaClient = await getPrisma();
    return prismaClient.user.findUnique({
      where: {
        address: address.toLowerCase(),
      },
    });
  }

  async createOrUpdate(user: User) {
    const now = new Date();
    const existingUser = await this.findByAddress(user.address);
    const prismaClient = await getPrisma();

    if (existingUser) {
      return prismaClient.user.update({
        where: { id: existingUser.id },
        data: {
          nonce: user.nonce,
          updatedAt: now,
        },
      });
    } else {
      return prismaClient.user.create({
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
    const prismaClient = await getPrisma();

    if (existingUser) {
      await prismaClient.user.update({
        where: { id: existingUser.id },
        data: { nonce },
      });
    } else {
      await prismaClient.user.create({
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

    const prismaClient = await getPrisma();
    await prismaClient.token.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateToken(token: string, userId: string): Promise<boolean> {
    const prismaClient = await getPrisma();
    const tokenData = await prismaClient.token.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return false;
    }

    if (tokenData.userId !== userId) {
      return false;
    }

    if (new Date() > tokenData.expiresAt) {
      const prismaClient = await getPrisma();
      await prismaClient.token.delete({
        where: { id: tokenData.id },
      });
      return false;
    }

    return true;
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      const prismaClient = await getPrisma();
      await prismaClient.token.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      console.error("Error revoking token:", error);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const prismaClient = await getPrisma();
    const result = await prismaClient.token.deleteMany({
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
