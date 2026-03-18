import { z } from "@hono/zod-openapi";

export const AuthRequestSchema = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .openapi({
        description: "Ethereum wallet address",
        example: "0x1234567890123456789012345678901234567890",
      }),
  })
  .openapi("AuthRequest");

export const AuthVerifySchema = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .openapi({
        description: "Ethereum wallet address",
        example: "0x1234567890123456789012345678901234567890",
      }),
    signature: z.string().openapi({
      description: "Signature of the authentication message",
      example:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b",
    }),
  })
  .openapi("AuthVerify");

export const TokenValidationSchema = z
  .object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .openapi({
        description: "Ethereum wallet address",
        example: "0x1234567890123456789012345678901234567890",
      }),
    token: z.string().openapi({
      description: "Authentication token",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("TokenValidation");

export const NonceResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Message to sign",
      example: "Sign this message to authenticate with Orderly One: 123456",
    }),
    nonce: z.string().openapi({
      description: "Authentication nonce",
      example: "123456",
    }),
  })
  .openapi("NonceResponse");

export const AuthSuccessResponseSchema = z
  .object({
    user: z.object({
      id: z.string().openapi({
        description: "User ID",
        example: "abc123def456",
      }),
      address: z.string().openapi({
        description: "Ethereum address",
        example: "0x1234567890123456789012345678901234567890",
      }),
    }),
    token: z.string().openapi({
      description: "JWT authentication token",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("AuthSuccessResponse");

export const TokenValidationResponseSchema = z
  .object({
    valid: z.boolean().openapi({
      description: "Whether the token is valid",
      example: true,
    }),
    user: z
      .object({
        id: z.string(),
        address: z.string(),
      })
      .optional(),
    error: z.string().optional().openapi({
      description: "Error message if validation failed",
      example: "Token invalid or expired",
    }),
  })
  .openapi("TokenValidationResponse");

export const AuthErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: "Error message",
    }),
  })
  .openapi("AuthErrorResponse");
