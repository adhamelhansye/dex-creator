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
  generateRandomTxHash,
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
        brokerId: "demo",
      });

      const txHash = generateRandomTxHash();

      const graduationData = {
        txHash,
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
        brokerId: "demo",
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

    it("should return 400 for broker ID containing 'orderly'", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/test/test-repo",
        brokerId: "demo",
      });

      const graduationData = {
        txHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        chain: "ethereum",
        brokerId: "my-orderly-dex",
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
      expect(body).toHaveProperty("error");
      expect(body.error.issues[0].message).toContain("orderly");
    });

    it("should return 400 for invalid fee values", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/test/test-repo",
        brokerId: "demo",
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

    it("should prevent duplicate broker IDs across all users", async () => {
      const firstUser = await testDataFactory.createTestUser();
      const secondUser = await testDataFactory.createTestUser();

      await testDataFactory.createTestDex(firstUser.id, {
        brokerName: "First DEX",
        repoUrl: "https://github.com/test/test-repo-1",
        brokerId: "demo",
      });
      await testDataFactory.createTestDex(secondUser.id, {
        brokerName: "Second DEX",
        repoUrl: "https://github.com/test/test-repo-2",
        brokerId: "demo",
      });

      const sameBrokerId = createMockBrokerId();

      const txHash1 = generateRandomTxHash();
      const txHash2 = generateRandomTxHash();

      const graduationData1 = {
        txHash: txHash1,
        chain: "ethereum",
        brokerId: sameBrokerId,
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const graduationData2 = {
        txHash: txHash2,
        chain: "ethereum",
        brokerId: sameBrokerId,
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const request1 = createAuthenticatedRequest(app, firstUser.id);
      const response1 = await request1.post(
        "/api/graduation/verify-tx",
        graduationData1
      );
      expect(response1.status).toBe(200);

      const request2 = createAuthenticatedRequest(app, secondUser.id);
      const response2 = await request2.post(
        "/api/graduation/verify-tx",
        graduationData2
      );
      const body2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(body2).toHaveProperty("success", false);
      expect(body2.message).toContain("already taken");
    });

    it("should handle concurrent broker creation requests", async () => {
      const secondUser = await testDataFactory.createTestUser();

      const request1 = createAuthenticatedRequest(app, testUser.id);
      const request2 = createAuthenticatedRequest(app, secondUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Test DEX 1",
        repoUrl: "https://github.com/test/test-repo-1",
        brokerId: "demo",
      });

      await testDataFactory.createTestDex(secondUser.id, {
        brokerName: "Test DEX 2",
        repoUrl: "https://github.com/test/test-repo-2",
        brokerId: "demo",
      });

      const txHash1 = generateRandomTxHash();
      const txHash2 = generateRandomTxHash();

      const graduationData1 = {
        txHash: txHash1,
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const graduationData2 = {
        txHash: txHash2,
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const [response1, response2] = await Promise.all([
        request1.post("/api/graduation/verify-tx", graduationData1),
        request2.post("/api/graduation/verify-tx", graduationData2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it("should prevent reuse of the same transaction hash", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Test DEX for TX Hash Reuse",
        repoUrl: "https://github.com/test/test-repo",
        brokerId: "demo",
      });

      const txHash = generateRandomTxHash();

      const graduationData1 = {
        txHash,
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const response1 = await request.post(
        "/api/graduation/verify-tx",
        graduationData1
      );
      expect(response1.status).toBe(200);

      const secondUser = await testDataFactory.createTestUser();
      const request2 = createAuthenticatedRequest(app, secondUser.id);

      await testDataFactory.createTestDex(secondUser.id, {
        brokerName: "Second Test DEX",
        repoUrl: "https://github.com/test/test-repo-2",
        brokerId: "demo",
      });

      const graduationData2 = {
        txHash,
        chain: "ethereum",
        brokerId: createMockBrokerId(),
        makerFee: 10,
        takerFee: 30,
        paymentType: "order" as const,
      };

      const response2 = await request2.post(
        "/api/graduation/verify-tx",
        graduationData2
      );
      const body2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(body2).toHaveProperty("success", false);
      expect(body2.message).toContain("already been used for graduation");
    });

    it("should prevent already graduated users from graduating again", async () => {
      const request = createAuthenticatedRequest(app, testUser.id);

      await testDataFactory.createTestDex(testUser.id, {
        brokerName: "Already Graduated DEX",
        repoUrl: "https://github.com/test/test-repo",
        brokerId: "already-graduated-broker",
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

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body.message).toContain("already graduated");
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
        brokerId: "demo",
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
