import { useState, useEffect } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { toast } from "react-toastify";
import { Button } from "./Button";
import {
  getBaseUrl,
  getOffChainDomain,
  getOnChainDomain,
  getAccountId,
  saveOrderlyKey,
  loadOrderlyKey,
} from "../utils/orderly";
import { getPublicKeyAsync, signAsync, utils } from "@noble/ed25519";
import { encodeBase58 } from "ethers";

const CHAIN_PREFIXES = [
  "eth:",
  "base:",
  "arb:",
  "sepolia:",
  "sep:",
  "base-sep:",
  "basesep:",
  "arb-sep:",
  "arbsep:",
];

const cleanMultisigAddress = (address: string): string => {
  let cleanAddress = address;

  for (const prefix of CHAIN_PREFIXES) {
    if (cleanAddress.toLowerCase().startsWith(prefix)) {
      cleanAddress = cleanAddress.substring(prefix.length);
      break;
    }
  }

  return cleanAddress;
};

interface FeeWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerId: string;
  multisigAddress: string;
}

const MESSAGE_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  DelegateAddOrderlyKey: [
    { name: "delegateContract", type: "address" },
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "orderlyKey", type: "string" },
    { name: "scope", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "expiration", type: "uint64" },
  ],
  DelegateWithdraw: [
    { name: "delegateContract", type: "address" },
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "receiver", type: "address" },
    { name: "token", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "withdrawNonce", type: "uint64" },
    { name: "timestamp", type: "uint64" },
  ],
};

async function signAndSendRequest(
  accountId: string,
  orderlyKey: Uint8Array,
  input: URL | string,
  init?: RequestInit | undefined
): Promise<Response> {
  const timestamp = Date.now();
  const encoder = new TextEncoder();

  const url = new URL(input);
  let message = `${String(timestamp)}${init?.method ?? "GET"}${url.pathname}`;
  if (init?.body) {
    message += init.body;
  }
  const orderlySignature = await signAsync(encoder.encode(message), orderlyKey);

  return fetch(input, {
    headers: {
      "Content-Type":
        init?.method !== "GET" && init?.method !== "DELETE"
          ? "application/json"
          : "application/x-www-form-urlencoded",
      "orderly-timestamp": String(timestamp),
      "orderly-account-id": accountId,
      "orderly-key": `ed25519:${encodeBase58(await getPublicKeyAsync(orderlyKey))}`,
      "orderly-signature": base64EncodeURL(orderlySignature),
      ...(init?.headers ?? {}),
    },
    ...(init ?? {}),
  });
}

function base64EncodeURL(byteArray: Uint8Array) {
  return btoa(
    Array.from(new Uint8Array(byteArray))
      .map(val => {
        return String.fromCharCode(val);
      })
      .join("")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function getVerifyingAddress(): string {
  const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV;

  switch (deploymentEnv) {
    case "mainnet":
      return "0x6F7a338F2aA472838dEFD3283eB360d4Dff5D203";
    case "staging":
      return "0x1826B75e2ef249173FC735149AE4B8e9ea10abff";
    case "qa":
      return "0x50F59504D3623Ad99302835da367676d1f7E3D44";
    case "dev":
    default:
      return "0x8794E7260517B1766fc7b55cAfcd56e6bf08600e";
  }
}

export function FeeWithdrawalModal({
  isOpen,
  onClose,
  brokerId,
  multisigAddress,
}: FeeWithdrawalModalProps) {
  const { address } = useAccount();
  const connectedChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const cleanAddress = cleanMultisigAddress(multisigAddress);
  const accountId = getAccountId(cleanAddress, brokerId);
  const [orderlyKey, setOrderlyKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = loadOrderlyKey(accountId);
      setOrderlyKey(savedKey || null);
    }
  }, [isOpen, accountId]);

  useEffect(() => {
    if (orderlyKey && accountId) {
      fetchUsdcBalance();
    }
  }, [orderlyKey, accountId]);

  const fetchUsdcBalance = async () => {
    if (!orderlyKey || !accountId) return;

    setIsLoadingBalance(true);
    try {
      const response = await signAndSendRequest(
        accountId,
        orderlyKey,
        `${getBaseUrl()}/v1/client/holding`
      );

      const data = await response.json();
      if (data.success && data.data?.holding) {
        const usdcHolding = data.data.holding.find(
          (h: { token: string; holding: number }) => h.token === "USDC"
        );
        setUsdcBalance(usdcHolding?.holding || 0);
      }
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

  const handleCreateOrderlyKey = async () => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected");
      return;
    }

    setIsCreatingKey(true);
    try {
      const privateKey = utils.randomPrivateKey();
      const orderlyKey = `ed25519:${encodeBase58(await getPublicKeyAsync(privateKey))}`;
      const timestamp = Date.now();
      const addKeyMessage = {
        delegateContract: cleanAddress,
        brokerId,
        chainId: Number(connectedChainId),
        orderlyKey,
        scope: "read,trading",
        timestamp,
        expiration: timestamp + 1_000 * 60 * 60 * 24 * 365,
      };

      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const signature = await signer.signTypedData(
        getOffChainDomain(connectedChainId),
        { DelegateAddOrderlyKey: MESSAGE_TYPES.DelegateAddOrderlyKey },
        addKeyMessage
      );

      const keyRes = await fetch(`${getBaseUrl()}/v1/delegate_orderly_key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: addKeyMessage,
          signature,
          userAddress: address,
        }),
      });
      const keyJson = await keyRes.json();
      if (!keyJson.success) {
        throw new Error(keyJson.message);
      }

      saveOrderlyKey(accountId, privateKey);
      setOrderlyKey(privateKey);
      toast.success("Orderly key created successfully!");
    } catch (error) {
      console.error("Error creating orderly key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create orderly key"
      );
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !accountId || !orderlyKey) {
      toast.error("Missing required data for withdrawal");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Please enter valid amount");
      return;
    }

    try {
      const nonceRes = await signAndSendRequest(
        accountId,
        orderlyKey,
        `${getBaseUrl()}/v1/withdraw_nonce`
      );
      const nonceJson = await nonceRes.json();
      const withdrawNonce = nonceJson.data.withdraw_nonce as string;

      const delegateWithdrawMessage = {
        delegateContract: cleanAddress,
        brokerId,
        chainId: Number(connectedChainId),
        receiver: cleanAddress,
        token: "USDC",
        amount: Number(amount),
        timestamp: Date.now(),
        withdrawNonce,
      };

      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const signature = await signer.signTypedData(
        getOnChainDomain(connectedChainId),
        { DelegateWithdraw: MESSAGE_TYPES.DelegateWithdraw },
        delegateWithdrawMessage
      );

      const delegateWithdrawRes = await signAndSendRequest(
        accountId,
        orderlyKey,
        `${getBaseUrl()}/v1/delegate_withdraw_request`,
        {
          method: "POST",
          body: JSON.stringify({
            message: delegateWithdrawMessage,
            signature,
            userAddress: address,
            verifyingContract: getVerifyingAddress(),
          }),
        }
      );
      const withdrawJson = await delegateWithdrawRes.json();
      if (!withdrawJson.success) {
        throw new Error(withdrawJson.message);
      }

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
          {!orderlyKey ? (
            <>
              <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
                <div className="flex items-start gap-2">
                  <div className="i-mdi:key text-warning w-5 h-5 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-warning font-medium mb-1">
                      Orderly Key Required
                    </p>
                    <p className="text-xs text-gray-400">
                      To withdraw fees from your multisig wallet, you need to
                      create an Orderly key first. This key enables secure API
                      access for fee withdrawals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-background-card rounded-lg p-3 border border-light/10">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Multisig Account ID
                </label>
                <div className="font-mono text-xs text-gray-300 break-all">
                  {accountId}
                </div>
              </div>

              <Button
                onClick={handleCreateOrderlyKey}
                variant="primary"
                className="w-full"
                isLoading={isCreatingKey}
                loadingText="Creating key..."
                disabled={!address}
              >
                <span className="flex items-center justify-center gap-2">
                  <div className="i-mdi:key-plus h-4 w-4"></div>
                  Create Orderly Key
                </span>
              </Button>

              {!address && (
                <p className="text-xs text-warning text-center">
                  Please connect your wallet first
                </p>
              )}
            </>
          ) : (
            <>
              <div className="bg-info/10 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="i-mdi:information-outline text-info w-4 h-4 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-info font-medium mb-1">
                      Multisig Withdrawal Process
                    </p>
                    <p className="text-xs text-gray-400">
                      This will withdraw fees to your multisig wallet. The
                      operation requires a signature from your connected EOA
                      wallet.
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
                disabled={!amount.trim()}
              >
                Withdraw Fees
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
