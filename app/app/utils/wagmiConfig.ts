import { createAppKit } from '@reown/appkit/react';
import { mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 1. Get projectId from environment variable or use a default for development
// You should replace this with your actual projectId from Reown Cloud
// Get one at: https://cloud.reown.com/
export const projectId =
  process.env.WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Create a metadata object
const metadata = {
  name: 'DEX Creator',
  description: 'Create your own DEX on Orderly Network',
  url: 'https://dex.orderly.network',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// 3. Set the networks
const networks = [mainnet, sepolia];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

// 5. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  projectId,
  metadata,
  features: {
    analytics: true,
  },
  themeVariables: {
    '--w3m-border-radius-master': '12px',
    '--w3m-accent': '#7C3AED',
  },
});

// API Base URL for backend calls
export const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Check if window.ethereum exists - useful for detecting if a wallet is installed
export const hasInjectedProvider = (): boolean => {
  return (
    typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  );
};
