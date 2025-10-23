import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { toast } from "react-toastify";
import { Button } from "./Button";
import {
  getAccountId,
  loadOrderlyKey,
  delegateWithdraw,
  getClientHolding,
} from "../utils/orderly";
import { cleanMultisigAddress } from "../utils/multisig";

interface FeeWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerId: string;
  multisigAddress: string;
  multisigChainId: number;
}

export function FeeWithdrawalModal({
  isOpen,
  onClose,
  brokerId,
  multisigAddress,
  multisigChainId,
}: FeeWithdrawalModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const cleanAddress = cleanMultisigAddress(multisigAddress);
  const accountId = getAccountId(cleanAddress, brokerId);
  const [orderlyKey, setOrderlyKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = loadOrderlyKey(accountId);
      if (savedKey) {
        setOrderlyKey(savedKey);
      } else {
        toast.error("No Orderly key found. Please create one first.");
        onClose();
      }
    }
  }, [isOpen, accountId, onClose]);

  useEffect(() => {
    if (orderlyKey && accountId) {
      fetchUsdcBalance();
    }
  }, [orderlyKey, accountId]);

  const fetchUsdcBalance = async () => {
    if (!orderlyKey || !accountId) return;

    setIsLoadingBalance(true);
    try {
      const holdings = await getClientHolding(accountId, orderlyKey);
      const usdcHolding = holdings.find(h => h.token === "USDC");
      setUsdcBalance(usdcHolding?.holding || 0);
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleSetMaxAmount = () => {
    if (usdcBalance !== null) {
      setAmount(usdcBalance.toString());
    }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !accountId || !orderlyKey || !address) {
      toast.error("Missing required data for withdrawal");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Please enter valid amount");
      return;
    }

    try {
      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      await delegateWithdraw(
        signer,
        address,
        cleanAddress,
        multisigChainId,
        brokerId,
        cleanAddress,
        "USDC",
        Number(amount),
        accountId,
        orderlyKey
      );

      toast.success("Withdrawal request submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to withdraw"
      );
    }
  };

  const handleFullWithdrawal = async () => {
    if (!amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Please enter valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      await handleWithdraw();
    } catch (error) {
      console.error("Error in full withdrawal:", error);
    } finally {
      setIsProcessing(false);
    }
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
        <div className="flex items-center justify-between p-4 border-b border-light/10">
          <h2 className="text-lg font-semibold text-white">Withdraw Fees</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <div className="i-mdi:close w-6 h-6"></div>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-info/10 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="i-mdi:information-outline text-info w-4 h-4 mt-0.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs text-info font-medium mb-1">
                  Multisig Withdrawal Process
                </p>
                <p className="text-xs text-gray-400">
                  This will withdraw fees to your multisig wallet. The operation
                  requires a signature from your connected EOA wallet.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-background-card rounded-lg p-3 border border-light/10">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Withdrawal Address (Multisig)
            </label>
            <div className="font-mono text-sm text-gray-300 break-all">
              {multisigAddress}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Amount (USDC)
              </label>
              <div className="flex items-center gap-2">
                {isLoadingBalance ? (
                  <span className="text-xs text-gray-400">
                    Loading balance...
                  </span>
                ) : usdcBalance !== null ? (
                  <>
                    <span className="text-xs text-gray-400">
                      Available: {usdcBalance.toFixed(2)} USDC
                    </span>
                    <button
                      onClick={handleSetMaxAmount}
                      className="text-xs text-primary-light hover:text-primary font-medium"
                    >
                      MAX
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-background-dark border border-light/10 rounded-lg text-white placeholder-gray-400 focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="bg-warning/10 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="i-mdi:shield-check text-warning w-4 h-4 mt-0.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs text-warning font-medium mb-1">
                  Multisig Approval Required
                </p>
                <p className="text-xs text-gray-400">
                  This transaction will be submitted to your Safe wallet and
                  requires approval from the required number of signers.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleFullWithdrawal}
            variant="primary"
            className="w-full"
            isLoading={isProcessing}
            loadingText="Processing..."
            disabled={!amount.trim() || !orderlyKey}
          >
            Withdraw Fees
          </Button>
        </div>
      </div>
    </div>
  );
}
