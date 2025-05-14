import { ReactNode, useEffect, useRef } from "react";
import { WagmiProvider, useChainId } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter } from "../utils/wagmiConfig";
import { toast } from "react-toastify";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure global query settings
      refetchOnWindowFocus: true,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Helper function to get a human-readable chain name
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    42161: "Arbitrum",
    10: "Optimism",
    56: "BNB Chain",
    137: "Polygon",
    8453: "Base",
    43114: "Avalanche",
    11155111: "Sepolia",
    421613: "Arbitrum Sepolia",
    84531: "Base Sepolia",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

interface AppKitProviderProps {
  children: ReactNode;
}

// Inner component that can use Wagmi hooks
function ChainWatcher({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  const prevChainIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      chainId &&
      prevChainIdRef.current !== undefined &&
      chainId !== prevChainIdRef.current
    ) {
      const chainName = getChainName(chainId);
      toast.info(`Switched to ${chainName}`, {
        autoClose: 2000,
      });
    }

    prevChainIdRef.current = chainId;
  }, [chainId]);

  return <>{children}</>;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        queryClient.invalidateQueries();
      },
      15 * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ChainWatcher>{children}</ChainWatcher>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
