import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestApp,
  createTestRequest,
  resetMocks,
} from "../utils/test-app";
import { TestDataFactory, createMockWallet } from "../utils/test-helpers";
import { Hono } from "hono";

describe("Auth Routes", () => {
  let app: Hono;
  let request: ReturnType<typeof createTestRequest>;
  let testDataFactory: TestDataFactory;

  beforeEach(async () => {
    app = await createTestApp();
    request = createTestRequest(app);
    testDataFactory = new TestDataFactory();
    resetMocks();
  });

  afterEach(async () => {
    await testDataFactory.cleanup();
  });

  describe("POST /api/auth/nonce", () => {
    it("should return a nonce for a new user", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      const response = await request.post("/api/auth/nonce", { address });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("nonce");
      expect(body.message).toContain(
        "Sign this message to authenticate with Orderly One"
      );
      expect(body.nonce).toBeTruthy();
    });

    it("should return a nonce for an existing user", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      await testDataFactory.createTestUser({ address });

      const response = await request.post("/api/auth/nonce", { address });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("message");
      expect(body).toHaveProperty("nonce");
      expect(body.message).toContain(
        "Sign this message to authenticate with Orderly One"
      );
      expect(body.nonce).toBeTruthy();
    });

    it("should return 400 for invalid address", async () => {
      const response = await request.post("/api/auth/nonce", {
        address: "invalid-address",
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for address without 0x prefix", async () => {
      const response = await request.post("/api/auth/nonce", {
        address: "1234567890123456789012345678901234567890",
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for address with wrong length", async () => {
      const response = await request.post("/api/auth/nonce", {
        address: "0x123456789012345678901234567890123456789",
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for missing address", async () => {
      const response = await request.post("/api/auth/nonce", {});
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/verify", () => {
    it("should verify signature and return user with token", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      const nonceResponse = await request.post("/api/auth/nonce", { address });
      const nonceBody = await nonceResponse.json();

      const message = nonceBody.message;
      const signature = wallet.signMessageSync(message);

      const response = await request.post("/api/auth/verify", {
        address,
        signature,
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("token");
      expect(body.user.address).toBe(address.toLowerCase());
      expect(body.token).toBeTruthy();
    });

    it("should return 401 for invalid signature", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      await testDataFactory.createTestUser({ address });

      const invalidSignature = "0xinvalid_signature";

      const response = await request.post("/api/auth/verify", {
        address,
        signature: invalidSignature,
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for missing parameters", async () => {
      const response = await request.post("/api/auth/verify", {
        address: "0x123",
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/validate", () => {
    it("should validate a valid token", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      const user = await testDataFactory.createTestUser({ address });
      const token = await testDataFactory.createTestToken(user.id);

      const response = await request.post("/api/auth/validate", {
        address,
        token: token.token,
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("valid", true);
      expect(body).toHaveProperty("user");
      expect(body.user.address).toBe(address.toLowerCase());
    });

    it("should return 401 for invalid token", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      await testDataFactory.createTestUser({ address });

      const response = await request.post("/api/auth/validate", {
        address,
        token: "invalid-token",
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("valid", false);
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for expired token", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      const user = await testDataFactory.createTestUser({ address });
      const token = await testDataFactory.createTestToken(user.id, -1);

      const response = await request.post("/api/auth/validate", {
        address,
        token: token.token,
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("valid", false);
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for missing parameters", async () => {
      const response = await request.post("/api/auth/validate", {
        address: "0x123",
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/cleanup-tokens", () => {
    it("should clean up expired tokens", async () => {
      const wallet = createMockWallet();
      const address = wallet.address;

      const user = await testDataFactory.createTestUser({ address });
      await testDataFactory.createTestToken(user.id, -1);

      const response = await request.post("/api/auth/cleanup-tokens", {});
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("message");
      expect(body.message).toContain("Cleaned up");
    });
  });
});
