import { useState, useEffect } from "react";
import { Button } from "./Button";
import { useAccount, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { BrowserProvider } from "ethers";
import {
  addOrderlyKey,
  addDelegateOrderlyKey,
  getAccountId,
} from "../utils/orderly";
import { toast } from "react-toastify";
import { mainnetNetworks, testnetNetworks } from "../utils/wagmiConfig";
import { getCurrentEnvironment } from "../utils/config";
import { get } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { cleanMultisigAddress } from "../utils/multisig";
import { getChainById } from "../../../config";

interface OrderlyKeyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderlyKey: Uint8Array) => void;
  onCancel: () => void;
  brokerId: string;
  accountId?: string;
}

export default function OrderlyKeyLoginModal({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
  brokerId,
  accountId,
}: OrderlyKeyLoginModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { token } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [multisigAddress, setMultisigAddress] = useState<string | undefined>();
  const [multisigChainId, setMultisigChainId] = useState<number | undefined>();
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const isMainnet = getCurrentEnvironment() === "mainnet";
  const supportedNetworks = isMainnet ? mainnetNetworks : testnetNetworks;
  const supportedChainIds = supportedNetworks.map(network => network.id);
  const isSupportedChain = supportedChainIds.includes(
    chainId as (typeof supportedChainIds)[number]
  );

  const defaultChainId = (
    isMainnet ? 1 : 11155111
  ) as (typeof supportedChainIds)[number];

  useEffect(() => {
    if (!isOpen || !brokerId || !token) return;

    const fetchGraduationStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const data = await get<{
          isMultisig?: boolean;
          multisigAddress?: string;
          multisigChainId?: number | null;
        }>("/api/graduation/graduation-status", token, {
          showToastOnError: false,
        });
        if (data.isMultisig && data.multisigAddress) {
          setMultisigAddress(data.multisigAddress);
          setMultisigChainId(data.multisigChainId || undefined);
        } else {
          setMultisigAddress(undefined);
          setMultisigChainId(undefined);
        }
      } catch (error) {
        console.error("Failed to fetch graduation status:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchGraduationStatus();
  }, [isOpen, brokerId, token]);

  const isMultisig = !!multisigAddress;
  const cleanAddress = multisigAddress
    ? cleanMultisigAddress(multisigAddress)
    : address;
  const finalAccountId =
    accountId ||
    (cleanAddress && brokerId ? getAccountId(cleanAddress, brokerId) : "");

  const requiredChainId =
    isMultisig && multisigChainId ? multisigChainId : null;
  const isOnCorrectChain = requiredChainId
    ? chainId === requiredChainId
    : isSupportedChain;
  const requiredChain = requiredChainId ? getChainById(requiredChainId) : null;

  const handleSwitchChain = async () => {
    try {
      const targetChainId = requiredChainId || defaultChainId;
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error("Failed to switch chain:", error);
      toast.error("Please switch to the required network in your wallet");
    }
  };

  const handleCreateKey = async () => {
    if (!walletClient || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isOnCorrectChain) {
      toast.error(
        isMultisig
          ? "Please switch to the network where your multisig delegate signer link was established"
          : "Please switch to a supported network"
      );
      return;
    }

    if (!cleanAddress || !finalAccountId) {
      toast.error("Missing required account information");
      return;
    }

    setIsCreating(true);

    try {
      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      let orderlyKey: Uint8Array;

      if (isMultisig) {
        orderlyKey = await addDelegateOrderlyKey(
          signer,
          address,
          cleanAddress,
          chainId,
          brokerId,
          "read,trading",
          finalAccountId
        );
      } else {
        orderlyKey = await addOrderlyKey(
          signer,
          address,
          chainId,
          brokerId,
          "read,trading",
          finalAccountId
        );
      }

      toast.success("Orderly key created successfully!");
      onSuccess(orderlyKey);
      onClose();
    } catch (error) {
      console.error("Failed to create orderly key:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create orderly key. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen md:p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={isCreating ? undefined : onClose}
      ></div>

      <div className="relative z-[1002] w-full h-full md:h-auto md:max-w-md md:max-h-[90vh] overflow-y-auto p-6 md:rounded-xl bg-background-light border-0 md:border md:border-primary-light/20 shadow-2xl slide-fade-in">
        {isLoadingStatus ? (
          <div className="text-center py-8">
            <div className="bg-warning/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="i-mdi:loading text-warning w-8 h-8 animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold mb-2 gradient-text">
              Checking Admin Wallet
            </h2>
            <p className="text-gray-400">
              Verifying your admin wallet configuration...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="bg-warning/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="i-mdi:key text-warning w-8 h-8"></div>
              </div>
              <h2 className="text-xl font-bold mb-2 gradient-text">
                Create Orderly Key
              </h2>
              <p className="text-gray-300">
                To interact with the Orderly Network API, you'll need to create
                an Orderly API key by signing a message with your wallet.
              </p>
              {isMultisig && (
                <div className="mt-3 bg-info/10 rounded-lg p-3 border border-info/20">
                  <div className="flex items-start gap-2">
                    <div className="i-mdi:information-outline text-info w-4 h-4 mt-0.5 flex-shrink-0"></div>
                    <div className="text-xs text-gray-400 text-left">
                      <p className="mb-1">
                        Creating delegate key for multisig wallet:{" "}
                        <span className="font-mono text-primary-light">
                          {multisigAddress}
                        </span>
                      </p>
                      {requiredChain && (
                        <p className="text-info">
                          Required network:{" "}
                          <span className="font-semibold">
                            {requiredChain.name}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-background-dark/50 p-4 rounded-lg border border-secondary-light/10 mb-6">
              <h3 className="font-semibold mb-3 text-sm text-secondary-light">
                What happens next:
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="i-mdi:numeric-1-circle text-primary w-4 h-4 flex-shrink-0 mt-0.5"></div>
                  <span>Your wallet will prompt you to sign a message</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="i-mdi:numeric-2-circle text-primary w-4 h-4 flex-shrink-0 mt-0.5"></div>
                  <span>An Orderly API key will be generated securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="i-mdi:numeric-3-circle text-primary w-4 h-4 flex-shrink-0 mt-0.5"></div>
                  <span>
                    The key will be stored locally for API interactions
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-background-dark/50 p-4 rounded-lg border border-secondary-light/10 mb-6">
              <h4 className="font-semibold mb-2 text-secondary-light">
                Security Note
              </h4>
              <p className="text-gray-400 text-sm">
                This key allows secure API access to manage your DEX settings
                and interact with the Orderly Network. It will be stored locally
                in your browser and is unique to your DEX broker account. No gas
                fees or blockchain transactions are required.
              </p>
            </div>

            {!isOnCorrectChain && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="i-mdi:alert text-warning w-5 h-5 mt-0.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-warning text-sm">
                      {isMultisig && requiredChain
                        ? `Please switch to ${requiredChain.name} where your multisig delegate signer link was established.`
                        : isMultisig && requiredChainId
                          ? `Please switch to the network where your multisig delegate signer link was established (Chain ID: ${requiredChainId}).`
                          : "Please switch to a supported network to create your Orderly key."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isCreating}
              >
                Cancel
              </Button>
              {isOnCorrectChain ? (
                <Button
                  variant="primary"
                  onClick={handleCreateKey}
                  isLoading={isCreating}
                  loadingText="Creating Key"
                >
                  Create Key
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSwitchChain}>
                  <div className="flex items-center gap-2">
                    <div className="i-mdi:swap-horizontal w-4 h-4"></div>
                    Switch Network
                  </div>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
