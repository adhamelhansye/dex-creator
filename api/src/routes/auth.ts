import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { userStore } from "../models/user";
import {
  AuthRequestSchema,
  AuthVerifySchema,
  TokenValidationSchema,
  NonceResponseSchema,
  AuthSuccessResponseSchema,
  TokenValidationResponseSchema,
  AuthErrorResponseSchema,
} from "../schemas/auth.js";

const app = new OpenAPIHono();

const nonceRoute = createRoute({
  method: "post",
  path: "/nonce",
  tags: ["Authentication"],
  summary: "Generate authentication nonce",
  description: "Generate a nonce that the user must sign to authenticate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Nonce generated successfully",
      content: {
        "application/json": {
          schema: NonceResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
  },
});

app.openapi(nonceRoute, async c => {
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

const verifyRoute = createRoute({
  method: "post",
  path: "/verify",
  tags: ["Authentication"],
  summary: "Verify signature and authenticate",
  description: "Verify the signed message and return an authentication token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthVerifySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Authentication successful",
      content: {
        "application/json": {
          schema: AuthSuccessResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid signature",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
  },
});

app.openapi(verifyRoute, async c => {
  const { address, signature } = c.req.valid("json");

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const message = `Sign this message to authenticate with Orderly One: ${user.nonce}`;

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return c.json({ error: "Invalid signature" }, 401);
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    await userStore.generateNonce(address);

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

const validateRoute = createRoute({
  method: "post",
  path: "/validate",
  tags: ["Authentication"],
  summary: "Validate authentication token",
  description: "Validate if an authentication token is still valid",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TokenValidationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token is valid",
      content: {
        "application/json": {
          schema: TokenValidationResponseSchema,
        },
      },
    },
    401: {
      description: "Token invalid or expired",
      content: {
        "application/json": {
          schema: TokenValidationResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: TokenValidationResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: TokenValidationResponseSchema,
        },
      },
    },
  },
});

app.openapi(validateRoute, async c => {
  const { address, token } = c.req.valid("json");

  try {
    const user = await userStore.findByAddress(address);
    if (!user) {
      return c.json({ valid: false, error: "User not found" }, 404);
    }

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
