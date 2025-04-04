import { z } from 'zod';

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

// In-memory user store (replace with a database in production)
class UserStore {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async findByAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.address.toLowerCase() === address.toLowerCase()
    );
  }

  async createOrUpdate(user: User): Promise<User> {
    const now = new Date().toISOString();
    const existingUser = await this.findByAddress(user.address);

    const updatedUser: User = {
      ...user,
      id: existingUser?.id || crypto.randomUUID(),
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    this.users.set(updatedUser.id!, updatedUser);
    return updatedUser;
  }

  async generateNonce(address: string): Promise<string> {
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const existingUser = await this.findByAddress(address);

    if (existingUser) {
      await this.createOrUpdate({
        ...existingUser,
        nonce,
      });
    } else {
      await this.createOrUpdate({
        address,
        nonce,
      });
    }

    return nonce;
  }

  createToken(userId: string): string {
    // Generate a new token
    const token = crypto.randomUUID();

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store the token
    this.tokens.set(token, { userId, expiresAt });

    return token;
  }

  validateToken(token: string, userId: string): boolean {
    const tokenData = this.tokens.get(token);

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
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }
}

export const userStore = new UserStore();
