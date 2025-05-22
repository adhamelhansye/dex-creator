import { createAppKit } from "@reown/appkit/react";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  sepolia,
} from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 1. Get projectId from environment variable or use a default for development
// You should replace this with your actual projectId from Reown Cloud
// Get one at: https://cloud.reown.com/
export const projectId =
  process.env.WALLET_CONNECT_PROJECT_ID || "67f3ccbaec6f6119a5c91a22793c89e3";

// 2. Create a metadata object
const metadata = {
  name: "Orderly DEX Creator",
  description: "Create your own DEX on Orderly Network",
  url: "https://dex.orderly.network",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// 3. Set the networks
const networks = [
  mainnet,
  base,
  arbitrum,
  optimism,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

// 5. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [
    mainnet,
    base,
    arbitrum,
    optimism,
    sepolia,
    baseSepolia,
    arbitrumSepolia,
  ],
  projectId,
  metadata,
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

// API Base URL for backend calls
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

// Check if window.ethereum exists - useful for detecting if a wallet is installed
export const hasInjectedProvider = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
};
