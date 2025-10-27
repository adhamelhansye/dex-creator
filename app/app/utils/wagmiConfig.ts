import { createAppKit } from "@reown/appkit/react";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  sepolia,
} from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  GRADUATION_SUPPORTED_CHAINS,
  GraduationSupportedChainName,
} from "../../../config";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId =
  process.env.WALLET_CONNECT_PROJECT_ID || "67f3ccbaec6f6119a5c91a22793c89e3";

const metadata = {
  name: "Orderly One",
  description: "Create your own DEX on Orderly Network",
  url: "https://dex.orderly.network",
  icons: ["https://dex.orderly.network/favicon.webp"],
};

const networkMap: Record<GraduationSupportedChainName, AppKitNetwork> = {
  ethereum: mainnet,
  arbitrum,
  base,
  sepolia,
  "arbitrum-sepolia": arbitrumSepolia,
  "base-sepolia": baseSepolia,
};

export const mainnetNetworks = GRADUATION_SUPPORTED_CHAINS.mainnet.map(
  chain => networkMap[chain]
);

export const testnetNetworks = GRADUATION_SUPPORTED_CHAINS.testnet.map(
  chain => networkMap[chain]
);

export const networks = [...mainnetNetworks, ...testnetNetworks];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
  defaultNetwork: mainnet,
  projectId,
  metadata,
  defaultAccountTypes: { eip155: "eoa" },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeVariables: {
    "--w3m-border-radius-master": "12px",
    "--w3m-accent": "#7C3AED",
  },
});

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export const hasInjectedProvider = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
};
