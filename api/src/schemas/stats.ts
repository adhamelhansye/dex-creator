import { z } from "@hono/zod-openapi";

export const StatsErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "Internal Server Error",
    }),
  })
  .openapi("StatsErrorResponse");

export const StatsQuerySchema = z.object({
  period: z
    .enum(["daily", "weekly", "30d", "90d"])
    .default("30d")
    .openapi({
      param: {
        name: "period",
        in: "query",
      },
      description: "Time period for statistics",
      example: "30d",
    }),
});

export const DexStatsSchema = z
  .object({
    total: z.object({
      allTime: z.number().int().openapi({
        description: "Total DEXes created all time",
        example: 150,
      }),
      new: z.number().int().openapi({
        description: "New DEXes created in the period",
        example: 10,
      }),
    }),
    graduated: z.object({
      allTime: z.number().int().openapi({
        description: "Total graduated DEXes all time",
        example: 50,
      }),
      new: z.number().int().openapi({
        description: "New graduated DEXes in the period",
        example: 5,
      }),
    }),
    demo: z.object({
      allTime: z.number().int().openapi({
        description: "Total demo DEXes all time",
        example: 100,
      }),
      new: z.number().int().openapi({
        description: "New demo DEXes in the period",
        example: 5,
      }),
    }),
    period: z.string().openapi({
      description: "Time period for these statistics",
      example: "30d",
    }),
  })
  .openapi("DexStats");

export const SwapFeeConfigSchema = z
  .record(
    z.object({
      fee_rate: z.number().openapi({
        description: "Swap fee rate in basis points",
        example: 30,
      }),
    })
  )
  .openapi("SwapFeeConfig");
