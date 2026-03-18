import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getPrisma } from "../lib/prisma";
import { getOrderlyPrismaClient } from "../lib/orderlyDb";
import dayjs from "dayjs";
import { getSwapFeeConfigs } from "../models/stats";
import {
  StatsErrorResponseSchema,
  StatsQuerySchema,
  DexStatsSchema,
  SwapFeeConfigSchema,
} from "../schemas/stats.js";

const app = new OpenAPIHono();

interface StatsCacheEntry {
  data: {
    total: {
      allTime: number;
      new: number;
    };
    graduated: {
      allTime: number;
      new: number;
    };
    demo: {
      allTime: number;
      new: number;
    };
    period: string;
  };
  expires: number;
}

const statsCache = new Map<string, StatsCacheEntry>();

function generateCacheKey(period: string): string {
  return `dex-stats-${period}`;
}

function getDateFilter(period: string) {
  const now = dayjs();
  switch (period) {
    case "daily":
      return now.subtract(1, "day").toDate();
    case "weekly":
      return now.subtract(7, "day").toDate();
    case "30d":
      return now.subtract(30, "day").toDate();
    case "90d":
      return now.subtract(90, "day").toDate();
    default:
      return now.subtract(30, "day").toDate();
  }
}

function getPeriodStartDate(
  period: "daily" | "weekly" | "30d" | "90d"
): dayjs.Dayjs {
  const now = dayjs();
  switch (period) {
    case "daily":
      return now.subtract(1, "day");
    case "weekly":
      return now.subtract(7, "day");
    case "30d":
      return now.subtract(30, "day");
    case "90d":
      return now.subtract(90, "day");
  }
}

const getStatsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Stats"],
  summary: "Get DEX statistics",
  description:
    "Get aggregate statistics about DEX creation and graduation over a specified time period",
  request: {
    query: StatsQuerySchema,
  },
  responses: {
    200: {
      description: "Statistics retrieved successfully",
      content: {
        "application/json": {
          schema: DexStatsSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: StatsErrorResponseSchema,
        },
      },
    },
  },
});

app.openapi(getStatsRoute, async c => {
  try {
    const { period } = c.req.valid("query");
    const cacheKey = generateCacheKey(period);
    const cached = statsCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    const prismaClient = await getPrisma();
    const dateFilter = getDateFilter(period);

    const graduatedBrokerIds = await prismaClient.dex.findMany({
      where: {
        brokerId: {
          not: "demo",
        },
      },
      select: {
        brokerId: true,
      },
    });

    const brokerIds = graduatedBrokerIds
      .map(d => d.brokerId)
      .filter(Boolean) as string[];

    const orderlyPrisma = await getOrderlyPrismaClient();
    let newlyGraduatedBrokerIds: Set<string> = new Set();

    if (brokerIds.length > 0) {
      try {
        const periodStartDate = getPeriodStartDate(period);

        const orderlyBrokers = await orderlyPrisma.orderlyBroker.findMany({
          where: {
            brokerId: {
              in: brokerIds,
            },
            createdTime: {
              gte: periodStartDate.toDate(),
            },
          },
          select: {
            brokerId: true,
          },
        });

        newlyGraduatedBrokerIds = new Set(orderlyBrokers.map(b => b.brokerId));
      } catch (error) {
        console.error("Error querying OrderlyBroker table:", error);
        newlyGraduatedBrokerIds = new Set();
      } finally {
        await orderlyPrisma.$disconnect();
      }
    }

    const stats = await prismaClient.$transaction(async tx => {
      const totalDexesAllTime = await tx.dex.count();
      const graduatedDexesAllTime = await tx.dex.count({
        where: {
          brokerId: {
            not: "demo",
          },
        },
      });
      const demoDexesAllTime = await tx.dex.count({
        where: {
          brokerId: "demo",
        },
      });

      const totalDexesNew = await tx.dex.count({
        where: {
          createdAt: {
            gte: dateFilter,
          },
        },
      });

      const graduatedDexesNew = await tx.dex.count({
        where: {
          brokerId: {
            in: Array.from(newlyGraduatedBrokerIds),
          },
        },
      });
      const demoDexesNew = await tx.dex.count({
        where: {
          brokerId: "demo",
          createdAt: {
            gte: dateFilter,
          },
        },
      });

      return {
        total: {
          allTime: totalDexesAllTime,
          new: totalDexesNew,
        },
        graduated: {
          allTime: graduatedDexesAllTime,
          new: graduatedDexesNew,
        },
        demo: {
          allTime: demoDexesAllTime,
          new: demoDexesNew,
        },
        period,
      };
    });

    const nextMinute = dayjs().endOf("minute").valueOf();
    statsCache.set(cacheKey, {
      data: stats,
      expires: nextMinute,
    });

    return c.json(stats);
  } catch (error) {
    console.error("Error getting DEX statistics:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

interface GraduatedDexesCacheEntry {
  data: Record<string, { fee_rate: number }>;
  expires: number;
}

let graduatedDexesCache: GraduatedDexesCacheEntry | null = null;

const getSwapFeeConfigRoute = createRoute({
  method: "get",
  path: "/swap-fee-config",
  tags: ["Stats"],
  summary: "Get swap fee configurations",
  description:
    "Get the swap fee configuration for all graduated DEXes (cached for 5 minutes)",
  responses: {
    200: {
      description: "Swap fee configurations retrieved successfully",
      content: {
        "application/json": {
          schema: SwapFeeConfigSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: StatsErrorResponseSchema,
        },
      },
    },
  },
});

app.openapi(getSwapFeeConfigRoute, async c => {
  try {
    if (graduatedDexesCache && graduatedDexesCache.expires > Date.now()) {
      return c.json(graduatedDexesCache.data);
    }

    const graduatedDexes = await getSwapFeeConfigs();

    const fiveMinutesFromNow = dayjs().add(5, "minute").valueOf();
    graduatedDexesCache = {
      data: graduatedDexes,
      expires: fiveMinutesFromNow,
    };

    return c.json(graduatedDexes);
  } catch (error) {
    console.error("Error getting graduated DEXs:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
