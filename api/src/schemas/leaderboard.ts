import { z } from "@hono/zod-openapi";

export const LeaderboardErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "Failed to fetch leaderboard data",
    }),
  })
  .openapi("LeaderboardErrorResponse");

export const LeaderboardQuerySchema = z.object({
  sort: z
    .enum(["volume", "pnl", "fee"])
    .default("volume")
    .openapi({
      param: {
        name: "sort",
        in: "query",
      },
      description: "Sort field for leaderboard",
      example: "volume",
    }),
  period: z
    .enum(["daily", "weekly", "30d", "90d"])
    .default("weekly")
    .openapi({
      param: {
        name: "period",
        in: "query",
      },
      description: "Time period for statistics",
      example: "weekly",
    }),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(20)
    .default(20)
    .openapi({
      param: {
        name: "limit",
        in: "query",
      },
      description: "Number of results to return",
      example: 20,
    }),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .openapi({
      param: {
        name: "offset",
        in: "query",
      },
      description: "Number of results to skip",
      example: 0,
    }),
});

export const LeaderboardItemSchema = z.object({
  id: z.string().openapi({
    description: "DEX ID",
    example: "abc123def456",
  }),
  brokerId: z.string().openapi({
    description: "Broker ID",
    example: "my-dex",
  }),
  brokerName: z.string().openapi({
    description: "DEX display name",
    example: "My DEX",
  }),
  primaryLogo: z.string().nullable().openapi({
    description: "Primary logo URL",
    example: "https://example.com/logo.png",
  }),
  dexUrl: z.string().nullable().openapi({
    description: "DEX website URL",
    example: "https://my-dex.github.io/my-dex",
  }),
  totalVolume: z.number().openapi({
    description: "Total trading volume",
    example: 1000000,
  }),
  totalPnl: z.number().openapi({
    description: "Total profit/loss",
    example: 50000,
  }),
  totalBrokerFee: z.number().openapi({
    description: "Total broker fees earned",
    example: 10000,
  }),
  totalFee: z.number().openapi({
    description: "Total fees",
    example: 20000,
  }),
  lastUpdated: z.string().datetime().openapi({
    description: "Last statistics update",
    example: "2024-01-01T00:00:00.000Z",
  }),
  description: z.string().nullable().openapi({
    description: "DEX description",
    example: "A decentralized exchange",
  }),
  banner: z.string().nullable().openapi({
    description: "Banner image URL",
    example: "https://example.com/banner.png",
  }),
  logo: z.string().nullable().openapi({
    description: "Logo image URL",
    example: "https://example.com/logo.png",
  }),
  tokenAddress: z.string().nullable().openapi({
    description: "Token contract address",
    example: "0x1234567890123456789012345678901234567890",
  }),
  tokenChain: z.string().nullable().openapi({
    description: "Token blockchain network",
    example: "ethereum",
  }),
  tokenSymbol: z.string().optional().openapi({
    description: "Token symbol",
    example: "ABC",
  }),
  tokenName: z.string().optional().openapi({
    description: "Token name",
    example: "ABC Token",
  }),
  tokenPrice: z.number().optional().openapi({
    description: "Token price in USD",
    example: 1.5,
  }),
  tokenMarketCap: z.number().optional().openapi({
    description: "Token market cap",
    example: 1000000,
  }),
  tokenImageUrl: z.string().optional().openapi({
    description: "Token image URL",
    example: "https://example.com/token.png",
  }),
  telegramLink: z.string().nullable().openapi({
    description: "Telegram group link",
    example: "https://t.me/mygroup",
  }),
  discordLink: z.string().nullable().openapi({
    description: "Discord invite link",
    example: "https://discord.gg/invite",
  }),
  xLink: z.string().nullable().openapi({
    description: "X (Twitter) profile link",
    example: "https://x.com/mydex",
  }),
  websiteUrl: z.string().nullable().openapi({
    description: "Official website URL",
    example: "https://mydex.com",
  }),
});

export const LeaderboardResponseSchema = z
  .object({
    data: z.array(LeaderboardItemSchema),
    meta: z.object({
      sortBy: z.string().openapi({
        description: "Current sort field",
        example: "volume",
      }),
      period: z.string().openapi({
        description: "Current time period",
        example: "weekly",
      }),
      limit: z.number().int().openapi({
        description: "Results per page",
        example: 20,
      }),
      offset: z.number().int().openapi({
        description: "Current offset",
        example: 0,
      }),
      total: z.number().int().openapi({
        description: "Total number of DEXes",
        example: 100,
      }),
    }),
  })
  .openapi("LeaderboardResponse");

export const BrokerParamSchema = z.object({
  brokerId: z
    .string()
    .min(1)
    .openapi({
      param: {
        name: "brokerId",
        in: "path",
      },
      description: "Broker ID",
      example: "my-dex",
    }),
});

export const BrokerQuerySchema = z.object({
  period: z
    .enum(["daily", "weekly", "30d", "90d"])
    .default("weekly")
    .openapi({
      param: {
        name: "period",
        in: "query",
      },
      description: "Time period for statistics",
      example: "weekly",
    }),
});

export const DailyStatsSchema = z.object({
  brokerId: z.string().openapi({
    description: "Broker ID",
    example: "my-dex",
  }),
  brokerName: z.string().openapi({
    description: "DEX name",
    example: "My DEX",
  }),
  date: z.string().openapi({
    description: "Date of statistics",
    example: "2024-01-01",
  }),
  perp_volume: z.number().openapi({
    description: "Perpetual trading volume",
    example: 100000,
  }),
  perp_taker_volume: z.number().openapi({
    description: "Taker volume",
    example: 60000,
  }),
  perp_maker_volume: z.number().openapi({
    description: "Maker volume",
    example: 40000,
  }),
  realized_pnl: z.number().openapi({
    description: "Realized profit/loss",
    example: 5000,
  }),
  broker_fee: z.number().openapi({
    description: "Broker fee earned",
    example: 1000,
  }),
  total_fee: z.number().openapi({
    description: "Total fees",
    example: 2000,
  }),
});

export const BrokerStatsResponseSchema = z
  .object({
    data: z.object({
      dex: z.object({
        id: z.string().openapi({
          description: "DEX ID",
          example: "abc123def456",
        }),
        brokerId: z.string().openapi({
          description: "Broker ID",
          example: "my-dex",
        }),
        brokerName: z.string().openapi({
          description: "DEX name",
          example: "My DEX",
        }),
        primaryLogo: z.string().nullable().openapi({
          description: "Primary logo URL",
          example: "https://example.com/logo.png",
        }),
        dexUrl: z.string().nullable().openapi({
          description: "DEX website URL",
          example: "https://dex.orderly.network/my-dex",
        }),
        description: z.string().nullable().openapi({
          description: "DEX description",
          example: "A decentralized exchange",
        }),
        banner: z.string().nullable().openapi({
          description: "Banner image URL",
          example: "https://example.com/banner.png",
        }),
        logo: z.string().nullable().openapi({
          description: "Logo image URL",
          example: "https://example.com/logo.png",
        }),
        tokenAddress: z.string().nullable().openapi({
          description: "Token contract address",
          example: "0x1234567890123456789012345678901234567890",
        }),
        tokenChain: z.string().nullable().openapi({
          description: "Token blockchain network",
          example: "ethereum",
        }),
        telegramLink: z.string().nullable().openapi({
          description: "Telegram group link",
          example: "https://t.me/mygroup",
        }),
        discordLink: z.string().nullable().openapi({
          description: "Discord invite link",
          example: "https://discord.gg/invite",
        }),
        xLink: z.string().nullable().openapi({
          description: "X (Twitter) profile link",
          example: "https://x.com/mydex",
        }),
        websiteUrl: z.string().nullable().openapi({
          description: "Official website URL",
          example: "https://mydex.com",
        }),
      }),
      aggregated: z.object({
        brokerId: z.string().openapi({
          description: "Broker ID",
          example: "my-dex",
        }),
        brokerName: z.string().openapi({
          description: "DEX name",
          example: "My DEX",
        }),
        totalVolume: z.number().openapi({
          description: "Total trading volume",
          example: 1000000,
        }),
        totalPnl: z.number().openapi({
          description: "Total profit/loss",
          example: 50000,
        }),
        totalBrokerFee: z.number().openapi({
          description: "Total broker fees earned",
          example: 10000,
        }),
        totalFee: z.number().openapi({
          description: "Total fees",
          example: 20000,
        }),
        lastUpdated: z.string().datetime().openapi({
          description: "Last statistics update",
          example: "2024-01-01T00:00:00.000Z",
        }),
        tokenAddress: z.string().optional().openapi({
          description: "Token contract address",
          example: "0x1234567890123456789012345678901234567890",
        }),
        tokenChain: z.string().optional().openapi({
          description: "Token blockchain network",
          example: "ethereum",
        }),
        tokenSymbol: z.string().optional().openapi({
          description: "Token symbol",
          example: "ABC",
        }),
        tokenName: z.string().optional().openapi({
          description: "Token name",
          example: "ABC Token",
        }),
        tokenPrice: z.number().optional().openapi({
          description: "Token price in USD",
          example: 1.5,
        }),
        tokenMarketCap: z.number().optional().openapi({
          description: "Token market cap",
          example: 1000000,
        }),
        tokenImageUrl: z.string().optional().openapi({
          description: "Token image URL",
          example: "https://example.com/token.png",
        }),
      }),
      daily: z.array(DailyStatsSchema),
    }),
  })
  .openapi("BrokerStatsResponse");
