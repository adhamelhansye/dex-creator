import { useMemo } from "react";
import { useAccount, useBalance, useSwitchChain, useChainId } from "wagmi";
import {
  ORDER_ADDRESSES,
  USDC_ADDRESSES,
  OrderTokenChainName,
  getChainIcon,
} from "../../../config";
import {
  getSupportedChains,
  getOrderTokenSupportedChains,
  getPreferredChain,
} from "../utils/config";

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (chain: OrderTokenChainName, paymentType: "usdc" | "order") => void;
  currentChain: OrderTokenChainName;
  currentPaymentType: "usdc" | "order";
}

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  chain: OrderTokenChainName;
  paymentType: "usdc" | "order";
  balance?: string;
  value?: string;
}

export function TokenSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentChain,
  currentPaymentType,
}: TokenSelectionModalProps) {
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const connectedChainId = useChainId();

  const SUPPORTED_CHAINS = getSupportedChains();
  const ORDER_TOKEN_CHAINS = getOrderTokenSupportedChains();

  const getChainName = (chain: OrderTokenChainName) => {
    const preferredChain = getPreferredChain(chain);
    return (
      SUPPORTED_CHAINS.find(c => c.id === preferredChain)?.name ||
      preferredChain
    );
  };

  const balanceQueries = useMemo(() => {
    const queries: Array<{
      chain: OrderTokenChainName;
      paymentType: "usdc" | "order";
      chainId: number;
      tokenAddress: string;
    }> = [];

    ORDER_TOKEN_CHAINS.forEach(chain => {
      const preferredChain = getPreferredChain(chain.id as OrderTokenChainName);
      const chainId =
        SUPPORTED_CHAINS.find(c => c.id === preferredChain)?.chainId || 1;

      const usdcAddress = USDC_ADDRESSES[preferredChain as OrderTokenChainName];
      const orderAddress =
        ORDER_ADDRESSES[preferredChain as OrderTokenChainName];

      if (usdcAddress) {
        queries.push({
          chain: chain.id as OrderTokenChainName,
          paymentType: "usdc",
          chainId,
          tokenAddress: usdcAddress,
        });
      }

      if (orderAddress) {
        queries.push({
          chain: chain.id as OrderTokenChainName,
          paymentType: "order",
          chainId,
          tokenAddress: orderAddress,
        });
      }
    });

    return queries;
  }, [ORDER_TOKEN_CHAINS, SUPPORTED_CHAINS]);

  const balances = balanceQueries.map(query =>
    useBalance({
      address,
      token: query.tokenAddress as `0x${string}`,
      chainId: query.chainId,
      query: {
        enabled: !!address && !!query.tokenAddress,
        retry: 3,
        staleTime: 60_000,
      },
    })
  );

  const getBalance = (
    chain: OrderTokenChainName,
    paymentType: "usdc" | "order"
  ) => {
    const index = balanceQueries.findIndex(
      q => q.chain === chain && q.paymentType === paymentType
    );
    if (index === -1) return null;
    return balances[index]?.data;
  };

  const tokenOptions: TokenOption[] = useMemo(() => {
    const options: TokenOption[] = [];

    ORDER_TOKEN_CHAINS.forEach(chain => {
      const preferredChain = getPreferredChain(chain.id as OrderTokenChainName);
      const chainName =
        SUPPORTED_CHAINS.find(c => c.id === preferredChain)?.name ||
        preferredChain;

      const usdcBalance = getBalance(chain.id as OrderTokenChainName, "usdc");
      const orderBalance = getBalance(chain.id as OrderTokenChainName, "order");

      options.push({
        id: `usdc-${chain.id}`,
        name: `USD Coin on ${chainName}`,
        symbol: "USDC",
        icon: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
        chain: chain.id as OrderTokenChainName,
        paymentType: "usdc",
        balance: usdcBalance
          ? `${parseFloat(usdcBalance.formatted).toFixed(2)} USDC`
          : "0 USDC",
        value: "$0.00",
      });

      options.push({
        id: `order-${chain.id}`,
        name: `Order Token on ${chainName}`,
        symbol: "ORDER",
        icon: "https://assets.coingecko.com/coins/images/38501/standard/Orderly_Network_Coingecko_200*200.png",
        chain: chain.id as OrderTokenChainName,
        paymentType: "order",
        balance: orderBalance
          ? `${parseFloat(orderBalance.formatted).toFixed(2)} ORDER`
          : "0 ORDER",
        value: "$0.00",
      });
    });

    return options;
  }, [ORDER_TOKEN_CHAINS, SUPPORTED_CHAINS, balances]);

  const handleTokenSelect = async (token: TokenOption) => {
    const preferredChain = getPreferredChain(token.chain);
    const targetChainId = SUPPORTED_CHAINS.find(
      c => c.id === preferredChain
    )?.chainId;

    if (targetChainId && targetChainId !== connectedChainId) {
      try {
        await switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error("Failed to switch chain:", error);
      }
    }

    onSelect(token.chain, token.paymentType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-background-light rounded-xl border border-light/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-light/10">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <div className="i-mdi:arrow-left w-6 h-6"></div>
          </button>
          <h2 className="text-lg font-semibold text-white">Select a token</h2>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Token List */}
        <div className="max-h-96 overflow-y-auto">
          {tokenOptions.map(token => (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className={`w-full p-4 flex items-center justify-between hover:bg-light/5 transition-colors ${
                token.chain === currentChain &&
                token.paymentType === currentPaymentType
                  ? "bg-primary/5 border-l-2 border-primary"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background-card flex items-center justify-center overflow-hidden">
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <img
                      src={getChainIcon(token.chain)}
                      alt={getChainName(token.chain)}
                      className="w-3 h-3 rounded-full"
                    />
                    <div className="w-2 h-2 rounded-full bg-primary hidden"></div>
                    <span>{getChainName(token.chain)}</span>
                    <span>•</span>
                    <span>{token.balance}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{token.value}</div>
                <div className="text-sm text-gray-400">
                  {token.chain === currentChain &&
                    token.paymentType === currentPaymentType && (
                      <span className="text-primary">Selected</span>
                    )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
