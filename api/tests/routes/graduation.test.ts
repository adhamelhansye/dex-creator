import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestApp,
  createAuthenticatedRequest,
  resetMocks,
} from "../utils/test-app";
import {
  TestDataFactory,
  createMockBrokerId,
  TestUser,
} from "../utils/test-helpers";
import { Hono } from "hono";

describe("Graduation Routes", () => {
  let app: Hono;
  let testDataFactory: TestDataFactory;
  let testUser: TestUser;

  beforeEach(async () => {
    app = await createTestApp();
    testDataFactory = new TestDataFactory();
    resetMocks();

    testUser = await testDataFactory.createTestUser();
  });

  afterEach(async () => {
    await testDataFactory.cleanup();
  });

  describe("POST /api/graduation/verify-tx", () => {
    it("should verify transaction and graduate DEX", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Test DEX for Graduation",
        repoUrl: "https://github.com/test/test-repo",
      });

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const response = await request.post(
        "/api/graduation/verify-tx",
        graduationData
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("brokerCreationData");
      expect(body.brokerCreationData).toHaveProperty(
        "brokerId",
        graduationData.brokerId
      );
    });

    it("should return 400 for invalid broker ID", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/test/test-repo",
      });

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        brokerId: "INVALID_BROKER_ID!",
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const response = await request.post(
        "/api/graduation/verify-tx",
        graduationData
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for invalid fee values", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/test/test-repo",
      });

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 200,
        takerFee: 10,
        paymentType: "order" as const,
      };

      const response = await request.post(
        "/api/graduation/verify-tx",
        graduationData
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for missing parameters", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        paymentType: "order" as const,
      };

      const response = await request.post(
        "/api/graduation/verify-tx",
        graduationData
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 if user has no DEX", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const response = await request.post(
        "/api/graduation/verify-tx",
        graduationData
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("message");
    });
  });

  describe("PUT /api/graduation/fees", () => {
    it("should update DEX fees", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Test DEX for Fee Update",
        repoUrl: "https://github.com/test/test-repo",
      });

      const feeData = {
        makerFee: 15,
        takerFee: 35,
      };

      const response = await request.put("/api/graduation/fees", feeData);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message");
    });

    it("should return 400 for invalid fee values", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/test/test-repo",
      });

      const feeData = {
        makerFee: 200,
        takerFee: 10,
      };

      const response = await request.put("/api/graduation/fees", feeData);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 if user has no DEX", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      const feeData = {
        makerFee: 15,
        takerFee: 35,
      };

      const response = await request.put("/api/graduation/fees", feeData);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("message");
    });
  });

  describe("GET /api/graduation/fees", () => {
    it("should get DEX fees", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Test DEX for Fee Retrieval",
        makerFee: 20,
        takerFee: 40,
        repoUrl: "https://github.com/test/test-repo",
      });

      const response = await request.get("/api/graduation/fees");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("makerFee", 20);
      expect(body).toHaveProperty("takerFee", 40);
    });

    it("should return 400 if user has no DEX", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      const response = await request.get("/api/graduation/fees");
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("message");
    });
  });
});
