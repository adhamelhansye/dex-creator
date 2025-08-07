import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ethers } from "ethers";
import {
  userStore,
  authRequestSchema,
  authVerifySchema,
  tokenValidationSchema,
} from "../models/user";

const app = new Hono();

app.post("/nonce", zValidator("json", authRequestSchema), async c => {
  const { address } = c.req.valid("json");

  try {
    const nonce = await userStore.generateNonce(address);
    const message = `Sign this message to authenticate with Orderly One: ${nonce}`;

    return c.json({
      message,
      nonce,
    });
  } catch (error) {
    console.error("Error generating nonce:", error);
    return c.json({ error: "Failed to generate authentication nonce" }, 500);
  }
});

app.post("/verify", zValidator("json", authVerifySchema), async c => {
  const { address, signature } = c.req.valid("json");

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const message = `Sign this message to authenticate with Orderly One: ${user.nonce}`;

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Generate a new nonce for security
    await userStore.generateNonce(address);

    // Create a token with expiration
    const token = await userStore.createToken(user.id);

    return c.json({
      user: {
        address: user.address,
        id: user.id,
      },
      token,
    });
  } catch (error) {
    console.error("Error verifying signature:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

app.post("/validate", zValidator("json", tokenValidationSchema), async c => {
  const { address, token } = c.req.valid("json");

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ valid: false, error: "User not found" }, 404);
    }

    // Validate the token
    const isValid = await userStore.validateToken(token, user.id);

    if (!isValid) {
      return c.json(
        {
          valid: false,
          error: "Token invalid or expired",
        },
        401
      );
    }

    return c.json({
      valid: true,
      user: {
        address: user.address,
        id: user.id,
      },
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return c.json({ valid: false, error: "Token validation failed" }, 500);
  }
});

app.post("/cleanup-tokens", async c => {
  try {
    const count = await userStore.cleanupExpiredTokens();
    return c.json({
      success: true,
      message: `Cleaned up ${count} expired tokens`,
    });
  } catch (error) {
    console.error("Error cleaning up tokens:", error);
    return c.json({ error: "Failed to clean up tokens" }, 500);
  }
});

export default app;
