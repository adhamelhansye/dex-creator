import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { leaderboardService } from "../services/leaderboardService.js";
import { getPrisma } from "../lib/prisma.js";
import dayjs from "dayjs";

const leaderboard = new Hono();

const leaderboardQuerySchema = z.object({
  sort: z.enum(["volume", "pnl", "fee"]).default("volume"),
  period: z.enum(["daily", "weekly", "30d"]).default("weekly"),
  limit: z.coerce.number().int().positive().max(20).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

interface LeaderboardItem {
  id: string;
  brokerId: string;
  brokerName: string;
  primaryLogo: string | null;
  dexUrl: string | null;
  totalVolume: number;
  totalPnl: number;
  totalBrokerFee: number;
  totalFee: number;
  lastUpdated: Date;
  description: string | null;
  banner: string | null;
  logo: string | null;
  tokenAddress: string | null;
  tokenChain: string | null;
  tokenSymbol?: string;
  tokenName?: string;
  tokenPrice?: number;
  tokenMarketCap?: number;
  tokenImageUrl?: string;
  telegramLink: string | null;
  discordLink: string | null;
  xLink: string | null;
  websiteUrl: string | null;
}

interface CacheEntry {
  data: {
    data: LeaderboardItem[];
    meta: {
      sortBy: string;
      period: string;
      limit: number;
      offset: number;
      total: number;
    };
  };
  expires: number;
}
const leaderboardCache = new Map<string, CacheEntry>();

interface BrokerCacheEntry {
  data: {
    dex: {
      id: string;
      brokerId: string;
      brokerName: string;
      primaryLogo: string | null;
      dexUrl: string | null;
      description: string | null;
      banner: string | null;
      logo: string | null;
      tokenAddress: string | null;
      tokenChain: string | null;
      telegramLink: string | null;
      discordLink: string | null;
      xLink: string | null;
      websiteUrl: string | null;
    };
    aggregated: {
      brokerId: string;
      brokerName: string;
      totalVolume: number;
      totalPnl: number;
      totalBrokerFee: number;
      totalFee: number;
      lastUpdated: Date;
      tokenAddress?: string;
      tokenChain?: string;
      tokenSymbol?: string;
      tokenName?: string;
      tokenPrice?: number;
      tokenMarketCap?: number;
      tokenImageUrl?: string;
    };
    daily: Array<{
      brokerId: string;
      brokerName: string;
      date: string;
      perp_volume: number;
      perp_taker_volume: number;
      perp_maker_volume: number;
      realized_pnl: number;
      broker_fee: number;
      total_fee: number;
    }>;
  };
  expires: number;
}
const brokerCache = new Map<string, BrokerCacheEntry>();

function generateCacheKey(
  sort: string,
  period: string,
  limit: number,
  offset: number
): string {
  return `${sort}-${period}-${limit}-${offset}`;
}

function generateBrokerCacheKey(brokerId: string, period: string): string {
  return `broker-${brokerId}-${period}`;
}

leaderboard.get("/", zValidator("query", leaderboardQuerySchema), async c => {
  try {
    const { sort, period, limit, offset } = c.req.valid("query");

    const cacheKey = generateCacheKey(sort, period, limit, offset);
    const cached = leaderboardCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    const prisma = await getPrisma();
    const dexes = await prisma.dex.findMany({
      where: {
        brokerId: {
          not: "demo",
        },
      },
      select: {
        id: true,
        brokerId: true,
        brokerName: true,
        primaryLogo: true,
        repoUrl: true,
        customDomain: true,
        customDomainOverride: true,
        description: true,
        banner: true,
        logo: true,
        tokenAddress: true,
        tokenChain: true,
        telegramLink: true,
        discordLink: true,
        xLink: true,
        websiteUrl: true,
      },
    });

    const leaderboardData = dexes
      .map(dex => {
        const cachedStats = leaderboardService.getAggregatedBrokerStats(
          dex.brokerId,
          period
        );
        if (!cachedStats) return null;

        let dexUrl = null;
        if (dex.customDomainOverride) {
          dexUrl = `https://${dex.customDomainOverride}`;
        } else if (dex.customDomain) {
          dexUrl = `https://${dex.customDomain}`;
        } else if (dex.repoUrl) {
          const match = dex.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (match) {
            const [, owner, repo] = match;
            dexUrl = `https://${owner}.github.io/${repo}`;
          }
        }

        return {
          id: dex.id,
          brokerId: dex.brokerId,
          brokerName: dex.brokerName,
          primaryLogo: dex.primaryLogo,
          dexUrl,
          totalVolume: cachedStats.totalVolume,
          totalPnl: cachedStats.totalPnl,
          totalBrokerFee: cachedStats.totalBrokerFee,
          totalFee: cachedStats.totalFee,
          lastUpdated: cachedStats.lastUpdated,
          description: dex.description,
          banner: dex.banner,
          logo: dex.logo,
          tokenAddress: dex.tokenAddress,
          tokenChain: dex.tokenChain,
          tokenSymbol: cachedStats.tokenSymbol,
          tokenName: cachedStats.tokenName,
          tokenPrice: cachedStats.tokenPrice,
          tokenMarketCap: cachedStats.tokenMarketCap,
          tokenImageUrl: cachedStats.tokenImageUrl,
          telegramLink: dex.telegramLink,
          discordLink: dex.discordLink,
          xLink: dex.xLink,
          websiteUrl: dex.websiteUrl,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        switch (sort) {
          case "pnl":
            return b!.totalPnl - a!.totalPnl;
          case "fee":
            return b!.totalFee - a!.totalFee;
          case "volume":
          default:
            return b!.totalVolume - a!.totalVolume;
        }
      });

    const totalCount = leaderboardData.length;
    const paginatedData = leaderboardData.slice(offset, offset + limit);

    const responseData = {
      data: paginatedData as LeaderboardItem[],
      meta: {
        sortBy: sort,
        period,
        limit,
        offset,
        total: totalCount,
      },
    };

    const nextMinute = dayjs().endOf("minute").valueOf();
    leaderboardCache.set(cacheKey, {
      data: responseData,
      expires: nextMinute,
    });

    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return c.json({ error: "Failed to fetch leaderboard data" }, 500);
  }
});

const brokerParamSchema = z.object({
  brokerId: z.string().min(1, "Broker ID is required"),
});

const brokerQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "30d"]).default("weekly"),
});

/**
 * Get detailed stats for a specific broker
 */
leaderboard.get(
  "/broker/:brokerId",
  zValidator("param", brokerParamSchema),
  zValidator("query", brokerQuerySchema),
  async c => {
    try {
      const { brokerId } = c.req.valid("param");
      const { period } = c.req.valid("query");

      const cacheKey = generateBrokerCacheKey(brokerId, period);
      const cached = brokerCache.get(cacheKey);

      if (cached && cached.expires > Date.now()) {
        return c.json({ data: cached.data });
      }

      const prisma = await getPrisma();
      const dex = await prisma.dex.findFirst({
        where: { brokerId },
        select: {
          id: true,
          brokerId: true,
          brokerName: true,
          primaryLogo: true,
          repoUrl: true,
          customDomain: true,
          customDomainOverride: true,
          description: true,
          banner: true,
          logo: true,
          tokenAddress: true,
          tokenChain: true,
          telegramLink: true,
          discordLink: true,
          xLink: true,
          websiteUrl: true,
        },
      });

      if (!dex) {
        return c.json({ error: "DEX not found" }, 404);
      }

      const dailyStats = leaderboardService.getDailyStatsForBroker(
        brokerId,
        period
      );
      const aggregatedStats = leaderboardService.getAggregatedBrokerStats(
        brokerId,
        period
      );

      if (!dailyStats || !aggregatedStats) {
        let dexUrl = null;
        if (dex.customDomainOverride) {
          dexUrl = `https://${dex.customDomainOverride}`;
        } else if (dex.customDomain) {
          dexUrl = `https://${dex.customDomain}`;
        } else if (dex.repoUrl) {
          const match = dex.repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
          if (match) {
            dexUrl = `https://dex.orderly.network/${match[1]}`;
          }
        }

        const fallbackData = {
          dex: {
            id: dex.id,
            brokerId: dex.brokerId,
            brokerName: dex.brokerName,
            primaryLogo: dex.primaryLogo,
            dexUrl,
            description: dex.description,
            banner: dex.banner,
            logo: dex.logo,
            tokenAddress: dex.tokenAddress,
            tokenChain: dex.tokenChain,
            telegramLink: dex.telegramLink,
            discordLink: dex.discordLink,
            xLink: dex.xLink,
            websiteUrl: dex.websiteUrl,
          },
          aggregated: {
            brokerId: dex.brokerId,
            brokerName: dex.brokerName,
            totalVolume: 0,
            totalPnl: 0,
            totalBrokerFee: 0,
            totalFee: 0,
            lastUpdated: new Date(),
            tokenAddress: dex.tokenAddress || undefined,
            tokenChain: dex.tokenChain || undefined,
          },
          daily: [],
        };

        const nextMinute = dayjs().endOf("minute").valueOf();
        brokerCache.set(cacheKey, {
          data: fallbackData,
          expires: nextMinute,
        });

        return c.json({ data: fallbackData });
      }

      let dexUrl = null;
      if (dex.customDomainOverride) {
        dexUrl = `https://${dex.customDomainOverride}`;
      } else if (dex.customDomain) {
        dexUrl = `https://${dex.customDomain}`;
      } else if (dex.repoUrl) {
        const match = dex.repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
        if (match) {
          dexUrl = `https://dex.orderly.network/${match[1]}`;
        }
      }

      const responseData = {
        dex: {
          id: dex.id,
          brokerId: dex.brokerId,
          brokerName: dex.brokerName,
          primaryLogo: dex.primaryLogo,
          dexUrl,
          description: dex.description,
          banner: dex.banner,
          logo: dex.logo,
          tokenAddress: dex.tokenAddress,
          tokenChain: dex.tokenChain,
          telegramLink: dex.telegramLink,
          discordLink: dex.discordLink,
          xLink: dex.xLink,
          websiteUrl: dex.websiteUrl,
        },
        aggregated: aggregatedStats,
        daily: dailyStats,
      };

      const nextMinute = dayjs().endOf("minute").valueOf();
      brokerCache.set(cacheKey, {
        data: responseData,
        expires: nextMinute,
      });

      return c.json({ data: responseData });
    } catch (error) {
      console.error("Error fetching broker stats:", error);
      return c.json({ error: "Failed to fetch broker statistics" }, 500);
    }
  }
);

export { leaderboard };
