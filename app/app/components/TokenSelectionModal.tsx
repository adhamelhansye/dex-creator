import { useMemo, useState, useEffect } from "react";
import { useAccount, useBalance, useSwitchChain, useChainId } from "wagmi";
import {
  USDC_ADDRESSES,
  OrderTokenChainName,
  getChainIcon,
} from "../../../config";
import {
  getSupportedChains,
  getOrderTokenSupportedChains,
  getPreferredChain,
} from "../utils/config";
import { get } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { useTranslation } from "~/i18n";

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (chain: OrderTokenChainName) => void;
  currentChain: OrderTokenChainName;
}

interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  chain: OrderTokenChainName;
  balance?: string;
  value?: string;
  graduationFee?: string;
}

interface FeeOptionsResponse {
  amount: number;
  currency: string;
  receiverAddress: string;
}

export function TokenSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentChain,
}: TokenSelectionModalProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const connectedChainId = useChainId();
  const { token } = useAuth();
  const [feeOptions, setFeeOptions] = useState<FeeOptionsResponse | null>(null);

  const SUPPORTED_CHAINS = getSupportedChains();
  const ORDER_TOKEN_CHAINS = getOrderTokenSupportedChains();

  useEffect(() => {
    const fetchFeeOptions = async () => {
      if (!token || feeOptions) return;

      try {
        const response = await get<FeeOptionsResponse>(
          "api/graduation/fee-options",
          token
        );
        setFeeOptions(response);
      } catch (error) {
        console.error("Failed to fetch fee options:", error);
      }
    };

    fetchFeeOptions();
  }, [token, feeOptions]);

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
      chainId: number;
      tokenAddress: string;
    }> = [];

    ORDER_TOKEN_CHAINS.forEach(chain => {
      const preferredChain = getPreferredChain(chain.id as OrderTokenChainName);
      const chainId =
        SUPPORTED_CHAINS.find(c => c.id === preferredChain)?.chainId || 1;

      const usdcAddress = USDC_ADDRESSES[preferredChain as OrderTokenChainName];

      if (usdcAddress) {
        queries.push({
          chain: chain.id as OrderTokenChainName,
          chainId,
          tokenAddress: usdcAddress,
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

  const getBalance = (chain: OrderTokenChainName) => {
    const index = balanceQueries.findIndex(q => q.chain === chain);
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

      const usdcBalance = getBalance(chain.id as OrderTokenChainName);

      const usdcValue = usdcBalance ? parseFloat(usdcBalance.formatted) : 0;
      const usdcValueFormatted = `$${usdcValue.toFixed(2)}`;

      const usdcGraduationFee = feeOptions
        ? `${feeOptions.amount.toLocaleString()} USDC`
        : t("tokenSelectionModal.loading");

      options.push({
        id: `usdc-${chain.id}`,
        name: t("tokenSelectionModal.usdCoinOnChain", { chainName }),
        symbol: "USDC",
        icon: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
        chain: chain.id as OrderTokenChainName,
        balance: usdcBalance
          ? `${parseFloat(usdcBalance.formatted).toFixed(2)} USDC`
          : "0 USDC",
        value: usdcValueFormatted,
        graduationFee: usdcGraduationFee,
      });
    });

    return options;
  }, [ORDER_TOKEN_CHAINS, SUPPORTED_CHAINS, balances, feeOptions, t]);

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

    onSelect(token.chain);
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
          <h2 className="text-lg font-semibold text-white">
            {t("tokenSelectionModal.selectChain")}
          </h2>
          <div className="w-6"></div>
        </div>

        {/* Chain List */}
        <div className="max-h-96 overflow-y-auto progress-tracker-scrollbar">
          {tokenOptions.map(token => (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className={`w-full p-4 flex items-center justify-between hover:bg-light/5 transition-colors ${
                token.chain === currentChain
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
                    <span>{getChainName(token.chain)}</span>
                    <span>•</span>
                    <span>{token.balance}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{token.value}</div>
                <div className="text-sm text-gray-400">
                  {token.chain === currentChain && (
                    <span className="text-primary">
                      {t("tokenSelectionModal.selected")}
                    </span>
                  )}
                </div>
                {token.graduationFee && (
                  <div className="text-xs text-gray-500 mt-1">
                    {t("tokenSelectionModal.graduation")}: {token.graduationFee}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
