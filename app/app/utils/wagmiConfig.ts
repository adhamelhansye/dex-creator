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

export const projectId =
  process.env.WALLET_CONNECT_PROJECT_ID || "67f3ccbaec6f6119a5c91a22793c89e3";

const metadata = {
  name: "Orderly One",
  description: "Create your own DEX on Orderly Network",
  url: "https://dex.orderly.network",
  icons: ["https://dex.orderly.network/favicon.webp"],
};

const networks = [
  mainnet,
  arbitrum,
  base,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia],
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
