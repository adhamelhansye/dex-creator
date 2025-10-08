import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { apiClient } from "../utils/apiClient";
import DexCard from "../components/DexCard";
import Pagination from "../components/Pagination";

interface BrokerStats {
  id: string;
  brokerId: string;
  brokerName: string;
  primaryLogo: string | null;
  dexUrl: string | null;
  totalVolume: number;
  totalPnl: number;
  totalBrokerFee: number;
  lastUpdated: string;
  description?: string;
  banner?: string;
  logo?: string;
  tokenAddress?: string;
  tokenChain?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenPrice?: number;
  tokenMarketCap?: number;
  tokenImageUrl?: string;
  telegramLink?: string;
  discordLink?: string;
  xLink?: string;
  websiteUrl?: string;
}

interface LeaderboardResponse {
  data: BrokerStats[];
  meta: {
    sortBy: string;
    period: string;
    limit: number;
    offset: number;
    total: number;
  };
}

interface DexStats {
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
}

type SortOption = "volume" | "pnl" | "brokerFee";
type TimePeriod = "daily" | "weekly" | "30d";

export default function BoardRoute() {
  const [leaderboard, setLeaderboard] = useState<BrokerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("volume");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [dexStats, setDexStats] = useState<DexStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLeaderboard = async (
    sort: SortOption = "volume",
    period: TimePeriod = "30d",
    page: number = 1
  ) => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * pageSize;
      const data = await apiClient<LeaderboardResponse>({
        endpoint: `/api/leaderboard?sort=${sort}&period=${period}&limit=${pageSize}&offset=${offset}`,
        method: "GET",
        showToastOnError: false,
      });

      setLeaderboard(data.data);
      setTotalItems(data.meta.total);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch board data"
      );
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDexStats = async (period: TimePeriod = "30d") => {
    try {
      setStatsLoading(true);
      const stats = await apiClient<DexStats>({
        endpoint: `/api/stats?period=${period}`,
        method: "GET",
        showToastOnError: false,
      });
      setDexStats(stats);
    } catch (err) {
      console.error("Error fetching DEX stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(sortBy, timePeriod, 1);
    fetchDexStats(timePeriod);
  }, [sortBy, timePeriod]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    setTimePeriod(newPeriod);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchLeaderboard(sortBy, timePeriod, page);
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "volume":
        return "Volume";
      case "pnl":
        return "PnL";
      case "brokerFee":
        return "Fees";
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 slide-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DEX Board
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-6">
            Discover the top performing DEXes on Orderly One
          </p>
        </div>

        {/* DEX Stats */}
        {dexStats && (
          <div className="mb-6 slide-fade-in-delayed">
            <div className="flex justify-center gap-6">
              <div className="bg-background-card rounded-lg border border-light/10 px-4 py-3 text-center">
                <div className="text-lg font-bold text-primary-light mb-1">
                  {statsLoading ? (
                    <Icon
                      icon="svg-spinners:pulse-rings-multiple"
                      width={16}
                      className="mx-auto"
                    />
                  ) : (
                    dexStats.total.allTime.toLocaleString()
                  )}
                </div>
                <div className="text-xs text-gray-300 mb-1">Total DEXes</div>
                <div className="text-xs text-primary-light">
                  +{dexStats.total.new.toLocaleString()} new ({dexStats.period})
                </div>
              </div>
              <div className="bg-background-card rounded-lg border border-light/10 px-4 py-3 text-center">
                <div className="text-lg font-bold text-green-400 mb-1">
                  {statsLoading ? (
                    <Icon
                      icon="svg-spinners:pulse-rings-multiple"
                      width={16}
                      className="mx-auto"
                    />
                  ) : (
                    dexStats.graduated.allTime.toLocaleString()
                  )}
                </div>
                <div className="text-xs text-gray-300 mb-1">Graduated</div>
                <div className="text-xs text-green-400/70">
                  +{dexStats.graduated.new.toLocaleString()} new (
                  {dexStats.period})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 slide-fade-in-delayed">
          <div className="flex flex-wrap gap-2">
            {(["volume", "brokerFee", "pnl"] as SortOption[]).map(sort => (
              <button
                key={sort}
                onClick={() => handleSortChange(sort)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortBy === sort
                    ? "bg-primary text-white"
                    : "bg-background-card text-gray-300 hover:bg-primary/20 hover:text-white"
                }`}
              >
                {getSortLabel(sort)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Time Period Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Period:</span>
              <select
                value={timePeriod}
                onChange={e =>
                  handleTimePeriodChange(e.target.value as TimePeriod)
                }
                className="px-3 py-2 bg-background-card border border-light/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary transition-colors duration-200"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            <button
              onClick={() => fetchLeaderboard(sortBy, timePeriod)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-background-card hover:bg-primary/20 text-gray-300 hover:text-white rounded-full transition-all duration-200 disabled:opacity-50"
            >
              <Icon
                icon={
                  isLoading
                    ? "svg-spinners:pulse-rings-multiple"
                    : "heroicons:arrow-path"
                }
                width={16}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8 slide-fade-in">
            <div className="bg-error/10 border border-error/20 rounded-lg p-6 max-w-md mx-auto">
              <Icon
                icon="heroicons:exclamation-triangle"
                width={24}
                className="text-error mx-auto mb-3"
              />
              <p className="text-error font-medium mb-2">
                Failed to load board
              </p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && leaderboard.length === 0 && (
          <div className="text-center py-12 slide-fade-in">
            <Icon
              icon="svg-spinners:pulse-rings-multiple"
              width={48}
              className="text-primary mx-auto mb-4"
            />
            <p className="text-gray-300">Loading board...</p>
          </div>
        )}

        {!isLoading && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 slide-fade-in items-stretch">
            {leaderboard.map((broker, index) => {
              const globalRank = (currentPage - 1) * pageSize + index;
              return (
                <Link
                  key={broker.brokerId}
                  to={`/board/${broker.brokerId}`}
                  className="staggered-item block h-full"
                  style={{
                    animation: `slideFadeIn 0.25s ease ${index * 0.05}s forwards`,
                  }}
                >
                  <DexCard
                    broker={broker}
                    rank={globalRank}
                    timePeriod={timePeriod}
                  />
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && leaderboard.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            itemName="DEXes"
            showPageSizeSelector={false}
          />
        )}

        {/* Empty State */}
        {!isLoading && leaderboard.length === 0 && !error && (
          <div className="text-center py-12 slide-fade-in">
            <Icon
              icon="heroicons:chart-bar"
              width={48}
              className="text-gray-500 mx-auto mb-4"
            />
            <p className="text-gray-300 text-lg mb-2">No data available</p>
            <p className="text-gray-400">
              The board will populate as DEXes generate trading activity.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-background-card rounded-lg border border-light/10 p-6 slide-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            About the Board
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2 underline">
                How it works
              </h4>
              <p>
                The board aggregates trading data from DEXes launched via
                Orderly One over the last 30 days.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2 underline">
                Metrics explained
              </h4>
              <ul className="space-y-1">
                <li>
                  <strong>Volume:</strong> Sum of all perpetual trading volume
                </li>
                <li>
                  <strong>Fees:</strong> Total broker fees collected from
                  trading. This does only include the fee earned by the DEX.
                  There are additional fees charged by Orderly
                </li>
                <li>
                  <strong>PnL:</strong> Realized profit and loss across all
                  traders
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
