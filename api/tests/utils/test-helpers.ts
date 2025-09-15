import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

export interface TestUser {
  id: string;
  address: string;
  nonce: string;
  isAdmin?: boolean;
}

export interface TestDex {
  id: string;
  brokerId: string;
  brokerName: string;
  userId: string;
  chainIds: number[];
  primaryLogo?: string;
  secondaryLogo?: string;
  favicon?: string;
  themeCSS?: string;
  telegramLink?: string;
  discordLink?: string;
  xLink?: string;
  walletConnectProjectId?: string;
  privyAppId?: string;
  privyTermsOfUse?: string;
  enabledMenus?: string;
  customMenus?: string;
  repoUrl?: string;
  customDomain?: string;
  makerFee?: number;
  takerFee?: number;
  availableLanguages: string[];
  enableCampaigns: boolean;
  enableAbstractWallet: boolean;
  disableMainnet: boolean;
  disableTestnet: boolean;
  disableEvmWallets: boolean;
  disableSolanaWallets: boolean;
  tradingViewColorConfig?: string;
  seoSiteName?: string;
  seoSiteDescription?: string;
  seoSiteLanguage?: string;
  seoSiteLocale?: string;
  seoTwitterHandle?: string;
  seoThemeColor?: string;
  seoKeywords?: string;
  privyLoginMethods?: string;
  isGraduated: boolean;
  description?: string;
  banner?: string;
  logo?: string;
  tokenAddress?: string;
  tokenChain?: string;
  websiteUrl?: string;
}

export interface TestToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
}

export class TestDataFactory {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const address = overrides.address || ethers.Wallet.createRandom().address;
    const nonce = overrides.nonce || Math.random().toString(36).substring(7);

    const user = await this.prisma.user.create({
      data: {
        nonce,
        isAdmin: false,
        ...overrides,
        address: address.toLowerCase(),
      },
    });

    return user as TestUser;
  }

  async createTestAdmin(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.createTestUser({ ...overrides, isAdmin: true });
  }

  async createTestToken(
    userId: string,
    expiresInHours: number = 24
  ): Promise<TestToken> {
    const token =
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const tokenRecord = await this.prisma.token.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return tokenRecord as TestToken;
  }

  async createTestDex(
    userId: string,
    overrides: Partial<TestDex> = {}
  ): Promise<TestDex> {
    const dex = await this.prisma.dex.create({
      data: {
        brokerId: "test-broker",
        brokerName: "Test DEX",
        userId,
        chainIds: [1, 137], // Ethereum and Polygon
        availableLanguages: ["en"],
        enableCampaigns: false,
        enableAbstractWallet: false,
        disableMainnet: false,
        disableTestnet: false,
        disableEvmWallets: false,
        disableSolanaWallets: false,
        isGraduated: false,
        ...overrides,
      },
    });

    return dex as TestDex;
  }

  async cleanup() {
    await this.prisma.token.deleteMany();
    await this.prisma.dex.deleteMany();
    await this.prisma.user.deleteMany();
  }
}

export function createMockWallet() {
  return ethers.Wallet.createRandom();
}

export function createMockBrokerId(): string {
  return `test-${Math.random().toString(36).substring(2, 8)}`;
}

export function createMockThemeCSS(): string {
  return `
    :root {
      --primary-color: #595bff;
      --secondary-color: #9d4edd;
      --background-color: #1a1b23;
      --text-color: #ffffff;
    }
  `;
}

export function createMockLogoData(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
}
