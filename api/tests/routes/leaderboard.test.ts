import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createTestApp,
  createAuthenticatedRequest,
  resetMocks,
} from "../utils/test-app";
import { TestDataFactory, TestUser } from "../utils/test-helpers";
import { Hono } from "hono";

describe("Leaderboard Routes", () => {
  let app: Hono;
  let testDataFactory: TestDataFactory;
  let testUser: TestUser;

  beforeEach(async () => {
    app = await createTestApp();
    testDataFactory = new TestDataFactory();
    resetMocks();

    testUser = await testDataFactory.createTestUser();
    await testDataFactory.createTestDex(testUser.id, {
      brokerId: "test-broker-123",
      brokerName: "Test DEX",
      description: "A test DEX for leaderboard testing",
      banner: "https://example.com/banner.jpg",
      logo: "https://example.com/logo.jpg",
      tokenAddress: "0x1234567890123456789012345678901234567890",
      tokenChain: "ethereum",
      telegramLink: "https://t.me/testdex",
      discordLink: "https://discord.gg/testdex",
      xLink: "https://x.com/testdex",
      websiteUrl: "https://testdex.com",
      repoUrl: "https://github.com/testuser/testdex",
    });

    resetMocks();
  });

  afterEach(async () => {
    await testDataFactory.cleanup();
  });

  describe("GET /api/leaderboard/broker/:brokerId", () => {
    it("should return broker data when trading data exists", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);
      const response = await request.get(
        "/api/leaderboard/broker/test-broker-123"
      );
      const body = await response.json();
      console.log(body);

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("dex");
      expect(body.data).toHaveProperty("aggregated");
      expect(body.data).toHaveProperty("daily");

      expect(body.data.dex).toHaveProperty("id");
      expect(body.data.dex).toHaveProperty("brokerId", "test-broker-123");
      expect(body.data.dex).toHaveProperty("brokerName", "Test DEX");
      expect(body.data.dex).toHaveProperty(
        "description",
        "A test DEX for leaderboard testing"
      );
      expect(body.data.dex).toHaveProperty(
        "banner",
        "https://example.com/banner.jpg"
      );
      expect(body.data.dex).toHaveProperty(
        "logo",
        "https://example.com/logo.jpg"
      );
      expect(body.data.dex).toHaveProperty(
        "telegramLink",
        "https://t.me/testdex"
      );
      expect(body.data.dex).toHaveProperty(
        "discordLink",
        "https://discord.gg/testdex"
      );
      expect(body.data.dex).toHaveProperty("xLink", "https://x.com/testdex");
      expect(body.data.dex).toHaveProperty("websiteUrl", "https://testdex.com");

      expect(body.data.aggregated).toHaveProperty("totalVolume");
      expect(body.data.aggregated).toHaveProperty("totalPnl");
      expect(body.data.aggregated).toHaveProperty("totalBrokerFee");
      expect(body.data.aggregated).toHaveProperty("lastUpdated");

      expect(body.data.daily).toHaveProperty("length");
    });

    it("should generate correct DEX URL from GitHub repo", async () => {
      const { leaderboardService } = await import(
        "../../src/services/leaderboardService"
      );

      vi.mocked(leaderboardService.getBrokerStats).mockReturnValue(null);
      vi.mocked(leaderboardService.getAggregatedBrokerStats).mockReturnValue(
        null
      );

      const request = createAuthenticatedRequest(app, testUser.id);
      const response = await request.get(
        "/api/leaderboard/broker/test-broker-123"
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.dex).toHaveProperty(
        "dexUrl",
        "https://dex.orderly.network/testdex"
      );
    });

    it("should return 404 for non-existent broker", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);
      const response = await request.get(
        "/api/leaderboard/broker/non-existent-broker"
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toHaveProperty("error", "DEX not found");
    });
  });
});
