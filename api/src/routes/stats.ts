import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getPrisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getSwapFeeConfigs } from "../models/stats";

const stats = new Hono();

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

const statsQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "30d", "90d"]).default("30d"),
});

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

stats.get("/", zValidator("query", statsQuerySchema), async c => {
  try {
    const { period } = c.req.valid("query");
    const cacheKey = generateCacheKey(period);
    const cached = statsCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    const prismaClient = await getPrisma();
    const dateFilter = getDateFilter(period);

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
            not: "demo",
          },
          createdAt: {
            gte: dateFilter,
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

stats.get("/swap-fee-config", async c => {
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
    console.error("Error getting graduated DEXes:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export { stats };
