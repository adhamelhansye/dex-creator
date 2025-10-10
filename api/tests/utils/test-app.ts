import { Hono } from "hono";
import { vi } from "vitest";
import { authMiddleware, adminMiddleware } from "../../src/lib/auth";
import { PrismaClient } from "@prisma/client";

vi.mock("../../src/lib/prisma", () => {
  const mockPrismaClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  return {
    prisma: mockPrismaClient,
    getPrisma: vi.fn().mockResolvedValue(mockPrismaClient),
    initializePrisma: vi.fn().mockResolvedValue(mockPrismaClient),
  };
});

vi.mock("../../src/lib/orderlyDb", () => ({
  addBrokerToOrderlyDb: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker added to Orderly database successfully",
      brokerIndex: 1,
    },
  }),
  getBrokerFromOrderlyDb: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker found in Orderly database",
      brokerIndex: 1,
    },
  }),
  updateBrokerAdminAccountId: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Admin account ID updated successfully",
    },
  }),
  deleteBrokerFromOrderlyDb: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker deleted from Orderly database successfully",
    },
  }),
  getNextBrokerIndex: vi.fn().mockResolvedValue({
    success: true,
    data: {
      brokerIndex: 2,
    },
  }),
  addBrokerToNexusDb: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker added to Nexus database successfully",
      brokerIndex: 1,
    },
  }),
  deleteBrokerFromNexusDb: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker deleted from Nexus database successfully",
    },
  }),
  addBrokerToAllDatabases: vi.fn().mockResolvedValue({
    success: true,
    data: {
      message: "Broker added to all databases successfully",
      orderlyBrokerIndex: 1,
      nexusBrokerIndex: 1,
    },
  }),
}));

vi.mock("../../src/lib/github", () => ({
  setupRepositoryWithSingleCommit: vi
    .fn()
    .mockResolvedValue({ html_url: "https://github.com/test/test-repo" }),
  getWorkflowRunStatus: vi.fn().mockResolvedValue({ status: "completed" }),
  getWorkflowRunDetails: vi.fn().mockResolvedValue({ jobs: [] }),
  updateDexConfig: vi.fn().mockResolvedValue({ success: true }),
  forkTemplateRepository: vi.fn().mockResolvedValue({
    success: true,
    data: "https://github.com/test/forked-repo",
  }),
  deleteRepository: vi.fn().mockResolvedValue({ success: true }),
  renameRepository: vi.fn().mockResolvedValue({ success: true }),
  triggerRedeployment: vi.fn().mockResolvedValue({ success: true }),
  setCustomDomain: vi.fn().mockResolvedValue("example.com"),
  removeCustomDomain: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../src/services/geckoTerminalService", () => ({
  geckoTerminalService: {
    getTokenInfo: vi.fn().mockResolvedValue({
      symbol: "TEST",
      name: "Test Token",
      price: 1.0,
      marketCap: 1000000,
      imageUrl: "https://example.com/token.png",
    }),
  },
}));

vi.mock("../../src/services/leaderboardService", () => ({
  leaderboardService: {
    getLeaderboardData: vi.fn().mockResolvedValue([]),
    getBrokerStats: vi.fn(),
    getAggregatedBrokerStats: vi.fn(),
  },
}));

vi.mock("../../src/lib/brokerCreation", () => ({
  initializeBrokerCreation: vi.fn().mockResolvedValue({ success: true }),
  checkBrokerCreationPermissions: vi
    .fn()
    .mockResolvedValue({ canCreate: true }),
  checkGasBalances: vi.fn().mockResolvedValue({ hasEnoughGas: true }),
  createAutomatedBrokerId: vi
    .fn()
    .mockImplementation((brokerId, _environment, _brokerData) => {
      if (brokerId.includes("INVALID")) {
        return Promise.resolve({
          success: false,
          errors: ["Invalid broker ID"],
        });
      }
      return Promise.resolve({
        success: true,
        brokerId: brokerId,
        transactionHashes: { 1: "0x123", 137: "0x456" },
      });
    }),
  deleteBrokerId: vi.fn().mockResolvedValue({
    success: true,
    brokerId: "test-broker",
    transactionHashes: { 1: "0x123" },
  }),
}));

vi.mock("../../src/lib/rateLimiter", () => ({
  deploymentRateLimiter: {
    isRateLimited: vi.fn().mockReturnValue(false),
    recordRequest: vi.fn(),
    getRemainingCooldown: vi.fn().mockReturnValue(0),
  },
  themeRateLimiter: {
    isRateLimited: vi.fn().mockReturnValue(false),
    recordRequest: vi.fn(),
    getRemainingCooldown: vi.fn().mockReturnValue(0),
  },
  createDeploymentRateLimit: vi.fn().mockReturnValue(
    vi.fn().mockImplementation(async (c, next) => {
      await next();
    })
  ),
}));

vi.mock("../../src/models/graduation", () => ({
  TransactionVerificationError: {
    TRANSACTION_NOT_FOUND: "Transaction not found",
    TRANSACTION_FAILED: "Transaction failed",
    WRONG_SENDER: "was not sent from your wallet",
    CHAIN_NOT_SUPPORTED: "Chain not supported",
    TX_ALREADY_USED:
      "This transaction hash has already been used for graduation",
    INSUFFICIENT_AMOUNT: "Insufficient amount transferred",
    NO_TRANSFERS_FOUND:
      "No ORDER token transfers to the required address found",
    CONFIGURATION_ERROR: "Graduation fee configuration is incomplete",
  },
  verifyOrderTransaction: vi.fn().mockImplementation(txHash => {
    if (
      txHash &&
      typeof txHash === "string" &&
      txHash.startsWith("0x") &&
      txHash.length === 66
    ) {
      return Promise.resolve({
        success: true,
        message: "Transaction verified successfully",
        amount: "1000000000000000000",
      });
    }
    return Promise.resolve({
      success: false,
      message: "Invalid transaction",
    });
  }),
  updateDexFees: vi
    .fn()
    .mockImplementation(async (userId, makerFee, takerFee) => {
      const { getPrisma } = await import("../../src/lib/prisma");
      const prisma = await getPrisma();
      const dex = await prisma.dex.findFirst({ where: { userId } });

      if (!dex) {
        return Promise.resolve({
          success: false,
          message: "DEX not found",
        });
      }

      if (makerFee > 150 || takerFee < 30 || takerFee > 150) {
        return Promise.resolve({
          success: false,
          message: "Invalid fee values",
        });
      }
      return Promise.resolve({
        success: true,
        message: "Fees updated successfully",
      });
    }),
  getDexFees: vi.fn().mockImplementation(async userId => {
    const { getPrisma } = await import("../../src/lib/prisma");
    const prisma = await getPrisma();
    const dex = await prisma.dex.findFirst({ where: { userId } });

    if (!dex) {
      return Promise.resolve({
        success: false,
        message: "DEX not found",
      });
    }

    return Promise.resolve({
      success: true,
      makerFee: 30,
      takerFee: 60,
    });
  }),
}));

vi.mock("../../src/lib/orderlyDb", async () => {
  const actual = await vi.importActual("../../src/lib/orderlyDb");
  return {
    ...actual,
    getBrokerFeesFromOrderlyDb: vi.fn().mockImplementation(async () => {
      return Promise.resolve({
        success: true,
        data: {
          makerFee: 30,
          takerFee: 60,
        },
      });
    }),
    updateBrokerFeesInOrderlyDb: vi
      .fn()
      .mockImplementation(async (brokerId, makerFee, takerFee) => {
        if (makerFee > 150 || takerFee < 30 || takerFee > 150) {
          return Promise.resolve({
            success: false,
            error: "Invalid fee values",
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            message: "Broker fees updated successfully",
          },
        });
      }),
  };
});

vi.mock("../../src/lib/auth", () => ({
  authMiddleware: vi.fn().mockImplementation((c, next) => {
    c.set("userId", "test-user-id");
    return next();
  }),
  adminMiddleware: vi.fn().mockImplementation((c, next) => {
    c.set("userId", "test-user-id");
    c.set("isAdmin", true);
    return next();
  }),
}));

process.env.GITHUB_TOKEN = "test-github-token";
process.env.TEMPLATE_PAT = "test-template-pat";
process.env.CEREBRAS_API_KEY = "test-cerebras-key";
process.env.CEREBRAS_API_URL = "https://api.cerebras.ai/v1";
process.env.BROKER_CREATION_PRIVATE_KEY =
  "0x1234567890123456789012345678901234567890123456789012345678901234";
process.env.BROKER_CREATION_PRIVATE_KEY_SOL = "test-solana-private-key";
process.env.ORDER_RECEIVER_ADDRESS =
  "0x1234567890123456789012345678901234567890";
process.env.ORDERLY_DATABASE_URL =
  "mysql://test:test@localhost:3306/orderly_test";
process.env.ORDERLY_DATABASE_USER = "test";
process.env.ORDERLY_DATABASE_PASSWORD = "test";
process.env.ORDERLY_DATABASE_URL_NEXUS =
  "mysql://test:test@localhost:3306/nexus_test";

export async function createTestApp(): Promise<Hono> {
  process.env.NODE_ENV = "test";

  const { app } = await import("../../src/index");
  return app;
}

export function createTestRequest(app: Hono) {
  return {
    get: (path: string) => app.request(path, { method: "GET" }),
    post: (path: string, body?) => {
      if (body instanceof FormData) {
        return app.request(path, {
          method: "POST",
          body: body,
        });
      }
      return app.request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    put: (path, body?) => {
      if (body instanceof FormData) {
        return app.request(path, {
          method: "PUT",
          body: body,
        });
      }
      return app.request(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    delete: (path: string, body?: unknown) =>
      app.request(path, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
  };
}

export function createAuthenticatedRequest(
  app: Hono,
  userId: string,
  isAdmin: boolean = false
) {
  vi.mocked(authMiddleware).mockImplementation((c, next) => {
    c.set("userId", userId);
    c.set("isAdmin", isAdmin);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });

  vi.mocked(adminMiddleware).mockImplementation((c, next) => {
    c.set("userId", userId);
    c.set("isAdmin", isAdmin);
    if (!isAdmin) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });

  return createTestRequest(app);
}

export function createAdminRequest(app: Hono, userId: string) {
  return createAuthenticatedRequest(app, userId, true);
}

export function mockAuthMiddleware(userId: string, isAdmin: boolean = false) {
  vi.mocked(authMiddleware).mockImplementation((c, next) => {
    c.set("userId", userId);
    c.set("isAdmin", isAdmin);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });
}

export function mockAdminMiddleware(userId: string) {
  vi.mocked(adminMiddleware).mockImplementation((c, next) => {
    c.set("userId", userId);
    c.set("isAdmin", true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });
}

export function resetMocks() {
  vi.clearAllMocks();

  vi.mocked(authMiddleware).mockImplementation((c, next) => {
    c.set("userId", "test-user-id");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });

  vi.mocked(adminMiddleware).mockImplementation((c, next) => {
    c.set("userId", "test-user-id");
    c.set("isAdmin", true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return next() as any;
  });
}
