/**
 * Shared Configuration
 *
 * This file contains shared configuration that is used by both
 * frontend and backend applications.
 */

export type Environment = "mainnet" | "staging" | "qa" | "dev";

const BROKER_COUNT_BY_ENVIRONMENT: Record<Environment, number> = {
  mainnet: 2_000,
  staging: 100,
  qa: 20,
  dev: 0,
};

export const MAX_BROKER_COUNT =
  BROKER_COUNT_BY_ENVIRONMENT[
    (process.env.DEPLOYMENT_ENV as Environment) || "staging"
  ];

export type ChainNameTestnet =
  | "sepolia"
  | "arbitrum-sepolia"
  | "bnbTestnet"
  | "optimism-sepolia"
  | "base-sepolia"
  | "monadTestnet"
  | "abstractTestnet"
  | "orderlyTestnet"
  | "solana-devnet";

export type ChainNameMainnet =
  | "ethereum"
  | "arbitrum"
  | "bnb"
  | "optimism"
  | "base"
  // | "polygon"
  | "mantle"
  | "avalanche"
  | "sei"
  | "morph"
  | "sonic"
  | "berachain"
  | "story"
  | "mode"
  | "plume"
  | "abstract"
  | "orderlyL2"
  | "solana-mainnet-beta";

export type ChainName = ChainNameTestnet | ChainNameMainnet;

export type OrderTokenChainName =
  | "ethereum"
  | "arbitrum"
  | "base"
  | "sepolia"
  | "arbitrum-sepolia"
  | "base-sepolia"
  | "solana-mainnet-beta"
  | "solana-devnet";

export type ChainType = "EVM" | "SOL";

export interface ChainConfig {
  id: ChainName;
  name: string;
  chainId: number;
  isTestnet: boolean;
  chainType: ChainType;
  rpcUrl: string;
  fallbackRpcUrls?: string[];
  blockExplorerUrl: string;
}

export const ALLOWED_MAINNET_CHAIN_IDS = [
  42161, // Arbitrum One
  10, // Optimism
  8453, // Base
  5000, // Mantle
  1, // Ethereum
  56, // BNB Chain
  1329, // Sei
  43114, // Avalanche
  900900900, // Solana
  2818, // Morph
  146, // Sonic
  80094, // Berachain
  1514, // Story
  34443, // Mode
  98866, // Plume
  2741, // Abstract
];

export const ALLOWED_TESTNET_CHAIN_IDS = [
  421614, // Arbitrum Sepolia
  97, // BSC Testnet
  10143, // Monad Testnet
  11124, // Abstract Sepolia
  901901901, // Solana Devnet
];

export const ALL_CHAINS: Record<ChainName, ChainConfig> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://eth.llamarpc.com",
    fallbackRpcUrls: [
      "https://1rpc.io/eth",
      "https://ethereum-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://etherscan.io",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    fallbackRpcUrls: [
      "https://1rpc.io/arb",
      "https://arbitrum-one-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://arbiscan.io",
  },
  bnb: {
    id: "bnb",
    name: "BNB Smart Chain",
    chainId: 56,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://bsc-dataseed.bnbchain.org",
    // rpcUrl: "https://binance.llamarpc.com",
    // fallbackRpcUrls: ["https://1rpc.io/bnb", "https://bsc-rpc.publicnode.com"],
    blockExplorerUrl: "https://bscscan.com",
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://mainnet.optimism.io",
    fallbackRpcUrls: [
      "https://1rpc.io/op",
      "https://optimism-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://optimistic.etherscan.io",
  },
  base: {
    id: "base",
    name: "Base",
    chainId: 8453,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://base.llamarpc.com",
    fallbackRpcUrls: [
      "https://1rpc.io/base",
      "https://base-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://basescan.org",
  },
  // polygon: {
  //   id: "polygon",
  //   name: "Polygon",
  //   chainId: 137,
  //   isTestnet: false,
  //   chainType: "EVM",
  //   rpcUrl: "https://polygon-public.nodies.app",
  //   fallbackRpcUrls: [
  //     "https://1rpc.io/matic",
  //     "https://polygon-bor-rpc.publicnode.com",
  //   ],
  //   blockExplorerUrl: "https://polygonscan.com",
  // },
  mantle: {
    id: "mantle",
    name: "Mantle",
    chainId: 5000,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.mantle.xyz",
    fallbackRpcUrls: [
      "https://1rpc.io/mantle",
      "https://mantle-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://mantlescan.xyz",
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://avalanche-c-chain-rpc.publicnode.com",
    fallbackRpcUrls: ["https://1rpc.io/avax/c"],
    blockExplorerUrl: "https://avascan.info",
  },
  sei: {
    id: "sei",
    name: "Sei",
    chainId: 1329,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://sei.drpc.org",
    fallbackRpcUrls: ["https://sei-public.nodies.app"],
    blockExplorerUrl: "https://seiscan.io",
  },
  morph: {
    id: "morph",
    name: "Morph",
    chainId: 2818,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.morphl2.io",
    fallbackRpcUrls: ["https://rpc-quicknode.morphl2.io"],
    blockExplorerUrl: "https://morphscan.io",
  },
  sonic: {
    id: "sonic",
    name: "Sonic",
    chainId: 146,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.soniclabs.com",
    fallbackRpcUrls: ["https://sonic-rpc.publicnode.com"],
    blockExplorerUrl: "https://sonicscan.org",
  },
  berachain: {
    id: "berachain",
    name: "Berachain",
    chainId: 80094,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.berachain.com",
    fallbackRpcUrls: ["https://berachain-rpc.publicnode.com"],
    blockExplorerUrl: "https://berascan.com",
  },
  story: {
    id: "story",
    name: "Story",
    chainId: 1514,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://mainnet.storyrpc.io",
    fallbackRpcUrls: ["https://rpc.ankr.com/story_mainnet"],
    blockExplorerUrl: "https://explorer.story.foundation",
  },
  mode: {
    id: "mode",
    name: "Mode",
    chainId: 34443,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://mode.drpc.org",
    fallbackRpcUrls: ["https://mainnet.mode.network"],
    blockExplorerUrl: "https://modescan.io",
  },
  plume: {
    id: "plume",
    name: "Plume",
    chainId: 98866,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.plume.org",
    blockExplorerUrl: "https://explorer.plume.org",
  },
  abstract: {
    id: "abstract",
    name: "Abstract",
    chainId: 2741,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://api.mainnet.abs.xyz",
    fallbackRpcUrls: ["https://abstract.drpc.org"],
    blockExplorerUrl: "https://explorer.mainnet.abs.xyz",
  },
  sepolia: {
    id: "sepolia",
    name: "Sepolia",
    chainId: 11155111,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://eth-sepolia.public.blastapi.io",
    fallbackRpcUrls: [
      "https://1rpc.io/sepolia",
      "https://ethereum-sepolia-rpc.publicnode.com",
    ],
    blockExplorerUrl: "https://sepolia.etherscan.io",
  },
  "arbitrum-sepolia": {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorerUrl: "https://sepolia.arbiscan.io",
  },
  bnbTestnet: {
    id: "bnbTestnet",
    name: "BNB Smart Chain Testnet",
    chainId: 97,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://bsc-testnet.public.blastapi.io",
    blockExplorerUrl: "https://testnet.bscscan.com/",
  },
  "optimism-sepolia": {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    chainId: 11155420,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://sepolia.optimism.io",
    blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
  },
  "base-sepolia": {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    blockExplorerUrl: "https://sepolia.basescan.org",
  },
  monadTestnet: {
    id: "monadTestnet",
    name: "Monad Testnet",
    chainId: 10143,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://testnet-rpc.monad.xyz",
    blockExplorerUrl: "https://testnet.monadexplorer.com",
  },
  abstractTestnet: {
    id: "abstractTestnet",
    name: "Abstract Testnet",
    chainId: 11124,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://api.testnet.abs.xyz",
    blockExplorerUrl: "https://sepolia.abscan.org/",
  },
  orderlyL2: {
    id: "orderlyL2",
    name: "Orderly L2",
    chainId: 291,
    isTestnet: false,
    chainType: "EVM",
    rpcUrl: "https://rpc.orderly.network",
    blockExplorerUrl: "https://explorer.orderly.network",
  },
  orderlyTestnet: {
    id: "orderlyTestnet",
    name: "Orderly Testnet",
    chainId: 4460,
    isTestnet: true,
    chainType: "EVM",
    rpcUrl: "https://testnet-rpc.orderly.org",
    blockExplorerUrl: "https://testnet-explorer.orderly.org",
  },
  "solana-mainnet-beta": {
    id: "solana-mainnet-beta",
    name: "Solana",
    chainId: 900_900_900,
    isTestnet: false,
    chainType: "SOL",
    rpcUrl:
      process.env.SOLANA_MAINNET_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    blockExplorerUrl: "https://solscan.io",
  },
  "solana-devnet": {
    id: "solana-devnet",
    name: "Solana Devnet",
    chainId: 901_901_901,
    isTestnet: true,
    chainType: "SOL",
    rpcUrl:
      process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com",
    blockExplorerUrl: "https://solscan.io",
  },
};

export const ORDER_ADDRESSES: Record<OrderTokenChainName, string> = {
  ethereum: "0xABD4C63d2616A5201454168269031355f4764337",
  arbitrum: "0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8",
  base: "0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8",
  sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  "arbitrum-sepolia": "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
  "base-sepolia": "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
  "solana-mainnet-beta": "ABt79MkRXUsoHuV2CVQT32YMXQhTparKFjmidQxgiQ6E",
  "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

export const USDC_ADDRESSES: Record<OrderTokenChainName, string> = {
  ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "arbitrum-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  "base-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  "solana-mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
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

  if (chain.chainType === "SOL" && chain.isTestnet) {
    return `${chain.blockExplorerUrl}/tx/${txHash}?cluster=devnet`;
  }

  return `${chain.blockExplorerUrl}/tx/${txHash}`;
}

export function getChainIcon(chain: string): string {
  const chainMap: Record<string, string> = {
    ethereum:
      "https://assets.coingecko.com/asset_platforms/images/279/small/ethereum.png",
    sepolia:
      "https://assets.coingecko.com/asset_platforms/images/279/small/ethereum.png",
    base: "https://assets.coingecko.com/asset_platforms/images/131/small/base-network.png",
    "base-sepolia":
      "https://assets.coingecko.com/asset_platforms/images/131/small/base-network.png",
    arbitrum:
      "https://assets.coingecko.com/asset_platforms/images/33/small/AO_logomark.png?1706606717",
    "arbitrum-sepolia":
      "https://assets.coingecko.com/asset_platforms/images/33/small/AO_logomark.png?1706606717",
  };
  return (
    chainMap[chain] ||
    "https://assets.coingecko.com/asset_platforms/images/279/small/ethereum.png"
  );
}

export interface EnvironmentChainConfig {
  vaultAddress?: string;
  vaultManagerAddress?: string;
  feeManagerAddress?: string;
  solConnectorAddress?: string;
  ledgerAddress?: string;
}

export const ENVIRONMENT_CONFIGS: {
  mainnet: Record<ChainNameMainnet, EnvironmentChainConfig>;
  staging: Partial<Record<ChainNameTestnet, EnvironmentChainConfig>>;
  qa: Partial<Record<ChainNameTestnet, EnvironmentChainConfig>>;
  dev: Partial<Record<ChainNameTestnet, EnvironmentChainConfig>>;
} = {
  mainnet: {
    ethereum: {
      vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    },
    arbitrum: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    bnb: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    optimism: {
      vaultAddress: "0x816f722424b49cf1275cc86da9840fbd5a6167e9",
    },
    base: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    // polygon: {
    //   vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    // },
    mantle: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    avalanche: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    sei: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    morph: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    sonic: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    berachain: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    story: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    mode: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    plume: {
      vaultAddress: "0x816f722424B49Cf1275cc86DA9840Fbd5a6167e9",
    },
    abstract: {
      vaultAddress: "0xE80F2396A266e898FBbD251b89CFE65B3e41fD18",
    },
    "solana-mainnet-beta": {
      vaultAddress: "ErBmAD61mGFKvrFNaTJuxoPwqrS8GgtwtqJTJVjFWx9Q",
    },
    orderlyL2: {
      vaultManagerAddress: "0x14a6342A8C1Ef9856898F510FcCE377e46668F33",
      feeManagerAddress: "0x343Ca787e960cB2cCA0ce8cfB2f38c3739E28a1E",
      solConnectorAddress: "0xCecAe061aa078e13b5e70D5F9eCee90a3F2B6AeA",
      ledgerAddress: "0x6F7a338F2aA472838dEFD3283eB360d4Dff5D203",
    },
  },
  staging: {
    sepolia: {
      vaultAddress: "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f",
    },
    bnbTestnet: {
      vaultAddress: "0xaf2036D5143219fa00dDd90e7A2dbF3E36dba050",
    },
    "optimism-sepolia": {
      vaultAddress: "0xEfF2896077B6ff95379EfA89Ff903598190805EC",
    },
    "base-sepolia": {
      vaultAddress: "0xdc7348975aE9334DbdcB944DDa9163Ba8406a0ec",
    },
    monadTestnet: {
      vaultAddress: "0x9442e24203e999db4aE87E35Dc0c8F3C610c29A0",
    },
    "solana-devnet": {
      vaultAddress: "9shwxWDUNhtwkHocsUAmrNAQfBH2DHh4njdAEdHZZkF2",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x873c120b42C80D528389d85cEA9d4dC0197974aD",
      feeManagerAddress: "0x0B98ba78DDb29937d895c718ED167DD8f5B2972d",
      solConnectorAddress: "0x5Bf771A65d057e778C5f0Ed52A0003316f94322D",
      ledgerAddress: "0x1826B75e2ef249173FC735149AE4B8e9ea10abff",
    },
  },
  qa: {
    sepolia: {
      vaultAddress: "0xd5164A5a83c64E59F842bC091E06614b84D95fF5",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0xB15a3a4D451311e03e34d9331C695078Ad5Cf5F1",
    },
    "base-sepolia": {
      vaultAddress: "0xEcb4abe96113c9caA3204e96C63C5377D02cb636",
    },
    "solana-devnet": {
      vaultAddress: "5zBjLor7vEraAt4zp2H82sy9MSqFoDnNa1Lx6EYKTYRZ",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x3B092aEe40Cb99174E8C73eF90935F9F35943B22",
      feeManagerAddress: "0x8A929891DE9a648B6A3D05d21362418f756cf728",
      solConnectorAddress: "0x45b6C6266A7A2170617d8A27A50C642fd68b91c4",
      ledgerAddress: "0x50F59504D3623Ad99302835da367676d1f7E3D44",
    },
  },
  dev: {
    sepolia: {
      vaultAddress: "0x1A26FBE7A6Dc6c12b8E10CD703b0c520Ee996B15",
    },
    "arbitrum-sepolia": {
      vaultAddress: "0x3ac2ba11ca2f9f109d50fb1a46d4c23fcadbbef6",
    },
    "solana-devnet": {
      vaultAddress: "EYJq9eU4GMRUriUJBgGoZ8YLQBXcWaciXuSsEXE7ieQS",
    },
    orderlyTestnet: {
      vaultManagerAddress: "0x4922872C26Befa37AdcA287fF68106013C82FeeD",
      feeManagerAddress: "0x835E970110E4a46BCA21A7551FEaA5F532F72701",
      solConnectorAddress: "0x9Dc724b24146BeDD2dA28b8C4B74126169B8f312",
      ledgerAddress: "0x8794E7260517B1766fc7b55cAfcd56e6bf08600e",
    },
  },
};
