import { z } from "@hono/zod-openapi";

export const AdminCheckResponseSchema = z
  .object({
    isAdmin: z.boolean().openapi({
      description: "Whether the current user is an admin",
      example: true,
    }),
  })
  .openapi("AdminCheckResponse");
