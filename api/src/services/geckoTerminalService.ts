interface GeckoTerminalNetwork {
  id: string;
  type: string;
  attributes: {
    name: string;
    coingecko_asset_platform_id: string;
  };
}

interface GeckoTerminalNetworksResponse {
  data: GeckoTerminalNetwork[];
  links: {
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  };
}

interface NetworkInfo {
  id: string;
  name: string;
}

class GeckoTerminalService {
  private networks: NetworkInfo[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000;
  private fetchPromise: Promise<void> | null = null;

  public async getNetworks(): Promise<NetworkInfo[]> {
    const now = new Date();

    if (
      this.lastFetch &&
      now.getTime() - this.lastFetch.getTime() < this.CACHE_DURATION
    ) {
      return this.networks;
    }

    if (this.fetchPromise) {
      await this.fetchPromise;
      return this.networks;
    }

    this.fetchPromise = this.fetchAllNetworks();

    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }

    return this.networks;
  }

  public async getNetworkIds(): Promise<string[]> {
    const networks = await this.getNetworks();
    return networks.map(network => network.id);
  }

  public async isValidNetwork(networkId: string): Promise<boolean> {
    const networkIds = await this.getNetworkIds();
    return networkIds.includes(networkId);
  }

  private async fetchAllNetworks(): Promise<void> {
    try {
      const allNetworks: NetworkInfo[] = [];
      let nextUrl: string | null =
        "https://api.geckoterminal.com/api/v2/networks";
      let pageCount = 0;

      while (nextUrl) {
        pageCount++;
        console.log(`Fetching networks page ${pageCount}...`);

        const response = await fetch(nextUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GeckoTerminalNetworksResponse = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error("Invalid response format from GeckoTerminal API");
        }

        const pageNetworks = data.data.map(network => ({
          id: network.id,
          name: network.attributes.name,
        }));

        allNetworks.push(...pageNetworks);

        nextUrl = data.links.next;

        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.networks = allNetworks;
      this.lastFetch = new Date();

      console.log(
        `Fetched ${this.networks.length} networks from GeckoTerminal API across ${pageCount} pages`
      );
    } catch (error) {
      console.error("Error fetching GeckoTerminal networks:", error);

      if (this.networks.length > 0) {
        console.log("Using expired cache due to fetch error");
        return;
      }

      throw new Error("Failed to fetch networks and no cached data available");
    }
  }

  public getCacheStatus() {
    return {
      networksCount: this.networks.length,
      lastFetch: this.lastFetch,
      isExpired: this.lastFetch
        ? new Date().getTime() - this.lastFetch.getTime() >= this.CACHE_DURATION
        : true,
    };
  }
}

export const geckoTerminalService = new GeckoTerminalService();
