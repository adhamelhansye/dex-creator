import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestApp,
  createAdminRequest,
  createAuthenticatedRequest,
  resetMocks,
} from "../utils/test-app";
import { TestDataFactory, TestUser } from "../utils/test-helpers";
import { Hono } from "hono";

describe("Admin Routes", () => {
  let app: Hono;
  let testDataFactory: TestDataFactory;
  let adminUser: TestUser;
  let regularUser: TestUser;

  beforeEach(async () => {
    app = await createTestApp();
    testDataFactory = new TestDataFactory();
    resetMocks();

    adminUser = await testDataFactory.createTestAdmin();

    regularUser = await testDataFactory.createTestUser();
  });

  afterEach(async () => {
    await testDataFactory.cleanup();
  });

  describe("GET /api/admin/check", () => {
    it("should return true for admin user", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const response = await request.get("/api/admin/check");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("isAdmin", true);
    });

    it("should return false for regular user", async () => {
      const request = createAuthenticatedRequest(app, regularUser.id);

      const response = await request.get("/api/admin/check");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("isAdmin", false);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should return all admin users for admin", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const anotherAdmin = await testDataFactory.createTestAdmin();

      const response = await request.get("/api/admin/users");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("admins");
      expect(Array.isArray(body.admins)).toBe(true);
      expect(body.admins.length).toBeGreaterThanOrEqual(2);

      const adminIds = body.admins.map((admin: TestUser) => admin.id);
      expect(adminIds).toContain(adminUser.id);
      expect(adminIds).toContain(anotherAdmin.id);
    });

    it("should return 403 for regular user", async () => {
      const request = createAuthenticatedRequest(app, regularUser.id);

      const response = await request.get("/api/admin/users");
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/admin/dex/:id", () => {
    it("should delete DEX by ID for admin", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const dex = await testDataFactory.createTestDex(regularUser.id, {
        brokerName: "DEX to Delete",
      });

      const response = await request.delete(`/api/admin/dex/${dex.id}`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message");
    });

    it("should return 404 if no DEX found for ID", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const response = await request.delete("/api/admin/dex/non-existent-id");
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toHaveProperty("error");
    });

    it("should return 403 for regular user", async () => {
      const request = createAuthenticatedRequest(app, regularUser.id);

      const dex = await testDataFactory.createTestDex(regularUser.id, {
        brokerName: "DEX to Delete",
      });

      const response = await request.delete(`/api/admin/dex/${dex.id}`);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /api/admin/dex/:id/broker-id", () => {
    it("should update broker ID for admin", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const dex = await testDataFactory.createTestDex(regularUser.id, {
        brokerName: "DEX for Broker ID Update",
      });

      const brokerIdData = {
        brokerId: "valid-broker-123",
      };

      const response = await request.post(
        `/api/admin/dex/${dex.id}/broker-id`,
        brokerIdData
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("brokerId", "valid-broker-123");
      expect(body).toHaveProperty("id", dex.id);
    });

    it("should return 400 for invalid broker ID format", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const dex = await testDataFactory.createTestDex(regularUser.id, {
        brokerName: "DEX for Broker ID Update",
      });

      const brokerIdData = {
        brokerId: "INVALID_BROKER_ID!",
      };

      const response = await request.post(
        `/api/admin/dex/${dex.id}/broker-id`,
        brokerIdData
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 404 if DEX not found", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const brokerIdData = {
        brokerId: "valid-broker-123",
      };

      const response = await request.post(
        "/api/admin/dex/non-existent-id/broker-id",
        brokerIdData
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toHaveProperty("message", "DEX not found");
    });

    it("should return 403 for regular user", async () => {
      const request = createAuthenticatedRequest(app, regularUser.id);

      const dex = await testDataFactory.createTestDex(regularUser.id, {
        brokerName: "DEX for Broker ID Update",
      });

      const brokerIdData = {
        brokerId: "valid-broker-123",
      };

      const response = await request.post(
        `/api/admin/dex/${dex.id}/broker-id`,
        brokerIdData
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /api/admin/dex/:dexId/create-broker", () => {
    it("should create broker ID for user when admin", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const testUser = await testDataFactory.createTestUser();
      const testDex = await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/testuser/testdex",
        brokerId: "demo",
      });

      const requestBody = {
        brokerId: "testbroker123",
        makerFee: 30,
        takerFee: 60,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("brokerCreationData");
      expect(body).toHaveProperty("dex");
      expect(body.dex).toHaveProperty("brokerId", "testbroker123");
      expect(body.dex).toHaveProperty("isGraduated", false);
    });

    it("should return 400 when user already has broker ID", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const testUser = await testDataFactory.createTestUser();
      const testDex = await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/testuser/testdex",
        brokerId: "existingbroker",
      });

      const requestBody = {
        brokerId: "newbroker123",
        makerFee: 30,
        takerFee: 60,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body.message).toContain("already has a broker ID");
    });

    it("should return 400 when broker ID is already taken", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const testUser1 = await testDataFactory.createTestUser();
      const testDex1 = await testDataFactory.createTestDex(testUser1.id, {
        repoUrl: "https://github.com/testuser1/testdex1",
      });

      const testUser2 = await testDataFactory.createTestUser();
      await testDataFactory.createTestDex(testUser2.id, {
        repoUrl: "https://github.com/testuser2/testdex2",
        brokerId: "takenbroker123",
      });

      const requestBody = {
        brokerId: "takenbroker123",
        makerFee: 30,
        takerFee: 60,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex1.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
      expect(body.message).toContain("already taken");
    });

    it("should return 403 for regular user", async () => {
      const request = createAuthenticatedRequest(app, regularUser.id);

      const testUser = await testDataFactory.createTestUser();
      const testDex = await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/testuser/testdex",
      });

      const requestBody = {
        brokerId: "testbroker123",
        makerFee: 30,
        takerFee: 60,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
    });

    it("should validate broker ID format", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const testUser = await testDataFactory.createTestUser();
      const testDex = await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/testuser/testdex",
      });

      const requestBody = {
        brokerId: "INVALID_BROKER_ID",
        makerFee: 30,
        takerFee: 60,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
    });

    it("should validate fee ranges", async () => {
      const request = createAdminRequest(app, adminUser.id);

      const testUser = await testDataFactory.createTestUser();
      const testDex = await testDataFactory.createTestDex(testUser.id, {
        repoUrl: "https://github.com/testuser/testdex",
      });

      const requestBody = {
        brokerId: "testbroker123",
        makerFee: -10,
        takerFee: 200,
        txHash: "0x1234567890abcdef1234567890abcdef12345678",
      };

      const response = await request.post(
        `/api/admin/dex/${testDex.id}/create-broker`,
        requestBody
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("success", false);
    });
  });
});
