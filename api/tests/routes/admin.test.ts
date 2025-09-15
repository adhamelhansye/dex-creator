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
});
