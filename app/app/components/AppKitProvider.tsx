import { ReactNode, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from '../utils/wagmiConfig';

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

interface AppKitProviderProps {
  children: ReactNode;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  // Set up interval for background token revalidation
  useEffect(() => {
    // Refresh all queries every 15 minutes to revalidate tokens
    const intervalId = setInterval(
      () => {
        queryClient.invalidateQueries();
      },
      15 * 60 * 1000
    ); // 15 minutes

    return () => clearInterval(intervalId);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
