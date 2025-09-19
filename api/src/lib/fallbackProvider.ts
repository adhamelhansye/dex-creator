import { ethers } from "ethers";
import { type ChainName, ALL_CHAINS } from "../../../config.js";

export interface FallbackRpcConfig {
  url: string;
  priority?: number; // Lower number = higher priority (default: 1)
  weight?: number; // Higher number = more likely to be used (default: 1)
  stallTimeout?: number; // Timeout before trying next provider (ms, default: 2000)
}

function createFallbackRpcConfigs(chainName: ChainName): FallbackRpcConfig[] {
  const chainInfo = ALL_CHAINS[chainName];
  if (!chainInfo) {
    return [];
  }

  const configs: FallbackRpcConfig[] = [];

  configs.push({
    url: chainInfo.rpcUrl,
    priority: 1,
    weight: 2,
    stallTimeout: 2000,
  });

  if (chainInfo.fallbackRpcUrls) {
    chainInfo.fallbackRpcUrls.forEach((url, index) => {
      configs.push({
        url,
        priority: index + 2,
        weight: 1,
        stallTimeout: 2000,
      });
    });
  }

  return configs;
}

const providerCache = new Map<string, ethers.FallbackProvider>();

export function createFallbackProvider(
  chainName: ChainName,
  customConfigs?: FallbackRpcConfig[]
): ethers.FallbackProvider {
  const cacheKey = `${chainName}-${
    customConfigs ? JSON.stringify(customConfigs) : "default"
  }`;

  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!;
  }

  const chainInfo = ALL_CHAINS[chainName];
  if (!chainInfo) {
    throw new Error(`Chain ${chainName} not found in configuration`);
  }

  const rpcConfigs = customConfigs || createFallbackRpcConfigs(chainName);

  if (rpcConfigs.length === 0) {
    throw new Error(`No RPC configuration found for chain: ${chainName}`);
  }

  const network = ethers.Network.from({
    chainId: chainInfo.chainId,
    name: chainInfo.name,
  });

  const providerConfigs = rpcConfigs.map(config => {
    const provider = new ethers.JsonRpcProvider(config.url, network, {
      staticNetwork: network,
    });

    return {
      provider,
      priority: config.priority ?? 1,
      weight: config.weight ?? 1,
      stallTimeout: config.stallTimeout ?? 2000,
    };
  });

  const fallbackProvider = new ethers.FallbackProvider(providerConfigs);

  providerCache.set(cacheKey, fallbackProvider);

  console.log(
    `✅ Created fallback provider for ${chainName} with ${providerConfigs.length} RPC endpoints`
  );

  return fallbackProvider;
}

export function createSingleProvider(
  chainName: ChainName
): ethers.JsonRpcProvider {
  const chainInfo = ALL_CHAINS[chainName];
  if (!chainInfo) {
    throw new Error(`Chain ${chainName} not found in configuration`);
  }

  const network = ethers.Network.from({
    chainId: chainInfo.chainId,
    name: chainInfo.name,
  });

  return new ethers.JsonRpcProvider(chainInfo.rpcUrl, network, {
    staticNetwork: network,
  });
}

export function createProvider(
  chainName: ChainName,
  preferFallback: boolean = true
): ethers.FallbackProvider | ethers.JsonRpcProvider {
  const chainInfo = ALL_CHAINS[chainName];
  const hasFallbackRpcs =
    chainInfo?.fallbackRpcUrls && chainInfo.fallbackRpcUrls.length > 0;

  if (preferFallback && hasFallbackRpcs) {
    return createFallbackProvider(chainName);
  }
  return createSingleProvider(chainName);
}
