/**
 * Shared Configuration
 *
 * This file contains shared configuration that is used by both
 * frontend and backend applications.
 */

export type Environment = "mainnet" | "staging" | "qa" | "dev";

export type ChainNameTestnet =
  | "sepolia"
  | "arbitrum-sepolia"
  | "orderlyTestnet";
export type ChainNameMainnet = "ethereum" | "arbitrum" | "orderlyL2";

export type ChainName = ChainNameTestnet | ChainNameMainnet;

export type OrderTokenChainName =
  | "ethereum"
  | "arbitrum"
  | "sepolia"
  | "arbitrum-sepolia";

export interface ChainConfig {
  id: ChainName;
  name: string;
  chainId: number;
  isTestnet: boolean;
  rpcUrl: string;
  blockExplorerUrl: string;
}

export const ALL_CHAINS: Record<ChainName, ChainConfig> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    isTestnet: false,
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorerUrl: "https://etherscan.io",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    isTestnet: false,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io",
  },
  sepolia: {
    id: "sepolia",
    name: "Sepolia",
    chainId: 11155111,
    isTestnet: true,
    rpcUrl: "https://eth-sepolia.public.blastapi.io",
    blockExplorerUrl: "https://sepolia.etherscan.io",
  },
  "arbitrum-sepolia": {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    isTestnet: true,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorerUrl: "https://sepolia.arbiscan.io",
  },
  orderlyL2: {
    id: "orderlyL2",
    name: "Orderly L2",
    chainId: 291,
    isTestnet: false,
    rpcUrl: "https://rpc.orderly.org",
    blockExplorerUrl: "https://explorer.orderly.network",
  },
  orderlyTestnet: {
    id: "orderlyTestnet",
    name: "Orderly Testnet",
    chainId: 4460,
    isTestnet: true,
    rpcUrl: "https://testnet-rpc.orderly.org",
    blockExplorerUrl: "https://testnet-explorer.orderly.org",
  },
};

export const ORDER_ADDRESSES: Record<OrderTokenChainName, string> = {
  ethereum: "0xABD4C63d2616A5201454168269031355f4764337",
  arbitrum: "0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8",
  sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "arbitrum-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

export type ChainId = (typeof ALL_CHAINS)[ChainName]["chainId"];

export function getChainById(chainId: ChainId): ChainConfig | undefined {
  return Object.values(ALL_CHAINS).find(chain => chain.chainId === chainId);
}

export function getChainByName(chainName: ChainName): ChainConfig {
  return ALL_CHAINS[chainName];
}

export function getChainId(chainName: ChainName): ChainId {
  return ALL_CHAINS[chainName].chainId;
}

export function getBlockExplorerUrlByChainId(
  txHash: string,
  chainId: ChainId
): string | null {
  const chain = getChainById(chainId);
  if (!chain) {
    return null;
  }
  return `${chain.blockExplorerUrl}/tx/${txHash}`;
}

export interface EnvironmentChainConfig {
  vaultAddress?: string;
  vaultManagerAddress?: string;
  feeManagerAddress?: string;
}

export const ENVIRONMENT_CONFIGS: {
  mainnet: Record<ChainNameMainnet, EnvironmentChainConfig>;
  staging: Record<ChainNameTestnet, EnvironmentChainConfig>;
  qa: Record<ChainNameTestnet, EnvironmentChainConfig>;
  dev: Record<ChainNameTestnet, EnvironmentChainConfig>;
} = {
  mainnet: {
    ethereum: {
      vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    },
    arbitrum: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    orderlyL2: {
      vaultManagerAddress: "0x14a6342A8C1Ef9856898F510FcCE377e46668F33",
      feeManagerAddress: "0x343Ca787e960cB2cCA0ce8cfB2f38c3739E28a1E",
    },
  },
  staging: {
    sepolia: {
      vaultAddress: "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0x0D070F4Ac4de26d8e5Da3e4e7c45b0e93Bf6e84d",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x873c120b42C80D528389d85cEA9d4dC0197974aD",
      feeManagerAddress: "0x0B98ba78DDb29937d895c718ED167DD8f5B2972d",
    },
  },
  qa: {
    sepolia: {
      vaultAddress: "0xd5164A5a83c64E59F842bC091E06614b84D95fF5",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0xB15a3a4D451311e03e34d9331C695078Ad5Cf5F1",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x3B092aEe40Cb99174E8C73eF90935F9F35943B22",
      feeManagerAddress: "0x8A929891DE9a648B6A3D05d21362418f756cf728",
    },
  },
  dev: {
    sepolia: {
      vaultAddress: "0x1A26FBE7A6Dc6c12b8E10CD703b0c520Ee996B15",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0x3ac2ba11ca2f9f109d50fb1a46d4c23fcadbbef6",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x4922872C26Befa37AdcA287fF68106013C82FeeD",
      feeManagerAddress: "0x835E970110E4a46BCA21A7551FEaA5F532F72701",
    },
  },
};
