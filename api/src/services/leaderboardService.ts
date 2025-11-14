import { getPrisma } from "../lib/prisma.js";
import { getOrderlyApiBaseUrl } from "../utils/orderly.js";

export interface BrokerStats {
  brokerId: string;
  brokerName: string;
  date: string;
  perp_volume: number;
  perp_taker_volume: number;
  perp_maker_volume: number;
  realized_pnl: number;
  broker_fee: number;
  total_fee: number;
}

export interface AggregatedBrokerStats {
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
}

interface OrderlyApiResponse {
  success: boolean;
  data: {
    rows: Array<{
      date: string;
      perp_volume: number;
      perp_taker_volume: number;
      perp_maker_volume: number;
      realized_pnl: number;
      broker_fee: number;
      total_fee: number;
    }>;
    meta: {
      total: number;
      records_per_page: number;
      current_page: number;
    };
  };
  timestamp: number;
}

class LeaderboardService {
  private cache = new Map<string, BrokerStats[]>();
  private aggregatedCache = new Map<string, AggregatedBrokerStats>();
  private tokenCache = new Map<
    string,
    {
      brokerId: string;
      tokenAddress: string;
      tokenChain: string;
      tokenSymbol: string;
      tokenName: string;
      tokenPrice: number;
      tokenMarketCap: number;
      tokenImageUrl: string;
      lastUpdated: Date;
    }
  >();
  private pollingInterval: NodeJS.Timeout | null = null;
  private brokerRefreshInterval: NodeJS.Timeout | null = null;
  private currentBrokerIndex = 0;
  private brokerIds: string[] = [];
  private readonly POLL_INTERVAL = 10_000;
  private readonly BROKER_REFRESH_INTERVAL = 5 * 60 * 1000;

  public async initialize() {
    await this.loadBrokerIds();
    this.startPolling();
    this.startBrokerRefresh();
  }

  private async loadBrokerIds() {
    try {
      const prisma = await getPrisma();
      const dexes = await prisma.dex.findMany({
        where: {
          brokerId: {
            not: "demo",
          },
        },
        select: {
          brokerId: true,
          brokerName: true,
        },
        distinct: ["brokerId"],
      });

      const newBrokerIds = dexes.map(dex => dex.brokerId).sort();

      const hasChanged =
        this.brokerIds.length !== newBrokerIds.length ||
        !this.brokerIds.every((id, index) => id === newBrokerIds[index]);

      if (hasChanged) {
        const currentBrokerId = this.brokerIds[this.currentBrokerIndex];
        this.brokerIds = newBrokerIds;
        if (currentBrokerId && this.brokerIds.includes(currentBrokerId)) {
          this.currentBrokerIndex = this.brokerIds.indexOf(currentBrokerId);
        } else {
          this.currentBrokerIndex = 0;
        }

        console.log(
          `Updated broker IDs list (${this.brokerIds.length} brokers):`,
          this.brokerIds
        );
      }
    } catch (error) {
      console.error("Failed to load broker IDs:", error);
    }
  }

  private async fetchTokenInfo(
    brokerId: string,
    tokenAddress: string,
    tokenChain: string
  ) {
    try {
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/${tokenChain}/tokens/${tokenAddress}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.data || !data.data.attributes) {
        return null;
      }

      return {
        brokerId,
        tokenAddress,
        tokenChain,
        tokenSymbol: data.data.attributes.symbol,
        tokenName: data.data.attributes.name,
        tokenPrice: parseFloat(data.data.attributes.price_usd || "0"),
        tokenMarketCap: parseFloat(data.data.attributes.market_cap_usd || "0"),
        tokenImageUrl: data.data.attributes.image_url,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  private async loadTokenInfoForBroker(brokerId: string) {
    try {
      const prisma = await getPrisma();
      const dex = await prisma.dex.findFirst({
        where: { brokerId },
        select: {
          tokenAddress: true,
          tokenChain: true,
        },
      });

      if (!dex?.tokenAddress || !dex?.tokenChain) {
        return;
      }

      const cacheKey = `${dex.tokenChain}:${dex.tokenAddress}`;
      const tokenInfo = await this.fetchTokenInfo(
        brokerId,
        dex.tokenAddress,
        dex.tokenChain
      );
      if (tokenInfo) {
        this.tokenCache.set(cacheKey, tokenInfo);
        console.log(
          `Updated token cache for ${brokerId}: ${tokenInfo.tokenSymbol}`
        );
      }
    } catch (error) {
      console.error(`Failed to load token info for broker ${brokerId}:`, error);
    }
  }

  private getTokenInfoForBroker(brokerId: string) {
    try {
      for (const tokenInfo of this.tokenCache.values()) {
        if (tokenInfo.brokerId === brokerId) {
          return {
            tokenAddress: tokenInfo.tokenAddress,
            tokenChain: tokenInfo.tokenChain,
            tokenSymbol: tokenInfo.tokenSymbol,
            tokenName: tokenInfo.tokenName,
            tokenPrice: tokenInfo.tokenPrice,
            tokenMarketCap: tokenInfo.tokenMarketCap,
            tokenImageUrl: tokenInfo.tokenImageUrl,
          };
        }
      }
    } catch (error) {
      console.error(`Failed to get token info for broker ${brokerId}:`, error);
    }
    return {};
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      await this.pollNextBroker();
    }, this.POLL_INTERVAL);

    console.log("Started leaderboard polling service");
  }

  private startBrokerRefresh() {
    if (this.brokerRefreshInterval) {
      clearInterval(this.brokerRefreshInterval);
    }

    this.brokerRefreshInterval = setInterval(async () => {
      await this.loadBrokerIds();
    }, this.BROKER_REFRESH_INTERVAL);

    console.log("Started broker list refresh service");
  }

  private async pollNextBroker() {
    if (this.brokerIds.length === 0) {
      await this.loadBrokerIds();
      return;
    }

    const brokerId = this.brokerIds[this.currentBrokerIndex];
    if (!brokerId) {
      this.currentBrokerIndex = 0;
      return;
    }

    try {
      await this.fetchBrokerData(brokerId);
      console.log(`Polled data for broker: ${brokerId}`);

      await this.loadTokenInfoForBroker(brokerId);
    } catch (error) {
      console.error(`Failed to poll data for broker ${brokerId}:`, error);
    }

    this.currentBrokerIndex =
      (this.currentBrokerIndex + 1) % this.brokerIds.length;
  }

  private async fetchBrokerData(brokerId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const url = `${getOrderlyApiBaseUrl()}/v1/broker/leaderboard/daily?start_date=${startDateStr}&end_date=${endDateStr}&broker_id=${brokerId}&sort=descending_perp_volume&aggregateBy=date`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OrderlyApiResponse = await response.json();

      if (!data.success || !data.data.rows) {
        throw new Error("Invalid response format from Orderly API");
      }

      const prisma = await getPrisma();
      const dex = await prisma.dex.findFirst({
        where: { brokerId },
        select: { brokerName: true },
      });

      const brokerName = dex?.brokerName || brokerId;

      const brokerStats: BrokerStats[] = data.data.rows.map(row => ({
        brokerId,
        brokerName,
        date: row.date,
        perp_volume: row.perp_volume,
        perp_taker_volume: row.perp_taker_volume,
        perp_maker_volume: row.perp_maker_volume,
        realized_pnl: row.realized_pnl,
        broker_fee: row.broker_fee,
        total_fee: row.total_fee,
      }));

      this.cache.set(brokerId, brokerStats);
      this.updateAggregatedStats(brokerId, brokerStats, brokerName);
    } catch {
      console.error(`Error fetching data for broker ${brokerId}:`);
    }
  }

  private updateAggregatedStats(
    brokerId: string,
    stats: BrokerStats[],
    brokerName: string
  ) {
    if (stats.length === 0) return;

    const totalVolume = stats.reduce((sum, stat) => sum + stat.perp_volume, 0);
    const totalPnl = stats.reduce((sum, stat) => sum + stat.realized_pnl, 0);
    const totalBrokerFee = stats.reduce(
      (sum, stat) => sum + stat.broker_fee,
      0
    );
    const totalFee = stats.reduce((sum, stat) => sum + stat.total_fee, 0);

    const aggregated: AggregatedBrokerStats = {
      brokerId,
      brokerName,
      totalVolume,
      totalPnl,
      totalBrokerFee,
      totalFee,
      lastUpdated: new Date(),
    };

    this.aggregatedCache.set(brokerId, aggregated);
  }

  public getBrokerStats(brokerId: string): BrokerStats[] | null {
    return this.cache.get(brokerId) || null;
  }

  public getAggregatedBrokerStats(
    brokerId: string,
    period: "daily" | "weekly" | "30d" | "90d" = "30d"
  ): AggregatedBrokerStats | null {
    const dailyStats = this.cache.get(brokerId);
    if (!dailyStats || dailyStats.length === 0) return null;

    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "daily":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "weekly":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 29);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 89);
        break;
    }

    const periodStats = dailyStats.filter(stat => {
      const statDate = new Date(stat.date);
      return statDate >= startDate && statDate <= endDate;
    });

    if (periodStats.length === 0) return null;

    const brokerName = periodStats[0].brokerName;

    const totalVolume = periodStats.reduce(
      (sum, stat) => sum + stat.perp_volume,
      0
    );
    const totalPnl = periodStats.reduce(
      (sum, stat) => sum + stat.realized_pnl,
      0
    );
    const totalBrokerFee = periodStats.reduce(
      (sum, stat) => sum + stat.broker_fee,
      0
    );
    const totalFee = periodStats.reduce((sum, stat) => sum + stat.total_fee, 0);

    const tokenInfo = this.getTokenInfoForBroker(brokerId);

    return {
      brokerId,
      brokerName,
      totalVolume,
      totalPnl,
      totalBrokerFee,
      totalFee,
      lastUpdated: new Date(),
      ...tokenInfo,
    };
  }

  public getDailyStatsForBroker(
    brokerId: string,
    period: "daily" | "weekly" | "30d" | "90d" = "30d"
  ): BrokerStats[] | null {
    const dailyStats = this.cache.get(brokerId);
    if (!dailyStats || dailyStats.length === 0) return null;

    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "daily":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "weekly":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 29);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 89);
        break;
    }

    const periodStats = dailyStats.filter(stat => {
      const statDate = new Date(stat.date);
      return statDate >= startDate && statDate <= endDate;
    });

    return periodStats.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getCacheStatus() {
    return {
      totalBrokers: this.brokerIds.length,
      cachedBrokers: this.cache.size,
      currentBrokerIndex: this.currentBrokerIndex,
      lastUpdate: new Date(),
    };
  }

  public async refreshBrokerIds() {
    await this.loadBrokerIds();
  }

  public invalidateTokenCacheForBroker(brokerId: string) {
    for (const [cacheKey, tokenInfo] of this.tokenCache.entries()) {
      if (tokenInfo.brokerId === brokerId) {
        this.tokenCache.delete(cacheKey);
        console.log(`Invalidated token cache for broker ${brokerId}`);
        break;
      }
    }
  }

  public stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log("Stopped leaderboard polling service");
    }

    if (this.brokerRefreshInterval) {
      clearInterval(this.brokerRefreshInterval);
      this.brokerRefreshInterval = null;
      console.log("Stopped broker list refresh service");
    }
  }
}

export const leaderboardService = new LeaderboardService();
