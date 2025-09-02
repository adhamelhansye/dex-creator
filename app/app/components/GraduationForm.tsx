import {
  FormEvent,
  useState,
  useEffect,
  ChangeEvent,
  useCallback,
} from "react";
import FormInput from "./FormInput";
import { Button } from "./Button";
import { toast } from "react-toastify";
import { post, get } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { Card } from "./Card";
import {
  useBalance,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
  useReadContract,
  useWalletClient,
} from "wagmi";
import { parseUnits } from "viem";
import { BrowserProvider } from "ethers";
import clsx from "clsx";
import { FeeConfigWithCalculator } from "./FeeConfigWithCalculator";
import { BaseFeeExplanation } from "./BaseFeeExplanation";
import {
  getBaseUrl,
  registerAccount,
  pollAccountRegistration,
  checkAccountRegistration,
} from "../utils/orderly";
import { getBlockExplorerUrlByChainId } from "../../../config";
import { generateDeploymentUrl } from "../utils/deploymentUrl";
import {
  getSupportedChains,
  getOrderTokenSupportedChains,
  getPreferredChain,
  getCurrentEnvironment,
} from "../utils/config";
import {
  ChainName,
  ORDER_ADDRESSES,
  USDC_ADDRESSES,
  OrderTokenChainName,
} from "../../../config";

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

const SUPPORTED_CHAINS = getSupportedChains();
const ORDER_TOKEN_CHAINS = getOrderTokenSupportedChains();

const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const getSwapUrl = (chainId: string) => {
  const tokenAddress = ORDER_ADDRESSES[chainId as OrderTokenChainName];
  if (!tokenAddress) {
    console.warn(`No ORDER token address configured for chain: ${chainId}`);
    return "#";
  }
  return `https://swap.defillama.com/?chain=${chainId}&from=0x0000000000000000000000000000000000000000&tab=swap&to=${tokenAddress}`;
};

interface VerifyTxResponse {
  success: boolean;
  message: string;
  amount?: string;
}

interface NewGraduationStatusResponse {
  success: boolean;
  isGraduated: boolean;
  brokerId: string;
}

interface FeeConfigResponse {
  success: boolean;
  makerFee: number;
  takerFee: number;
  message?: string;
}

interface BrokerIdResponse {
  success: boolean;
  data: {
    rows: {
      broker_id: string;
      broker_name: string;
    }[];
  };
  timestamp: number;
}

interface FeeOptionsResponse {
  usdc: {
    amount: number;
    currency: string;
    stable: boolean;
  };
  order: {
    amount: number;
    currentPrice: number;
    requiredPrice: number;
    minimumPrice: number;
    currency: string;
    stable: boolean;
  };
  receiverAddress: string;
}

interface GraduationFormProps {
  onNoDexSetup?: () => void;
  onGraduationSuccess?: () => void;
}

export function GraduationForm({
  onNoDexSetup,
  onGraduationSuccess,
}: GraduationFormProps) {
  const { token } = useAuth();
  const { address } = useAccount();
  const [txHash, setTxHash] = useState("");

  const defaultChain =
    getCurrentEnvironment() === "mainnet" ? "arbitrum" : "arbitrum-sepolia";
  const [chain, setChain] = useState<ChainName>(defaultChain);

  const [brokerId, setBrokerId] = useState("");
  const [brokerIdError, setBrokerIdError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyTxResponse | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [existingBrokerIds, setExistingBrokerIds] = useState<string[]>([]);

  const [makerFee, setMakerFee] = useState<number>(30); // 3 bps = 30 units
  const [takerFee, setTakerFee] = useState<number>(60); // 6 bps = 60 units
  const [isSavingFees, setIsSavingFees] = useState(false);

  const [graduationStatus, setGraduationStatus] =
    useState<NewGraduationStatusResponse | null>(null);
  const [isFinalizingAdminWallet, setIsFinalizingAdminWallet] = useState(false);
  const [dexData, setDexData] = useState<{ repoUrl?: string } | null>(null);
  const [feeOptions, setFeeOptions] = useState<FeeOptionsResponse | null>(null);
  const [paymentType, setPaymentType] = useState<"usdc" | "order">("order");
  const [isLoadingFeeOptions, setIsLoadingFeeOptions] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const preferredChain = getPreferredChain(chain);
  const currentTokenAddress =
    paymentType === "usdc"
      ? USDC_ADDRESSES[preferredChain as OrderTokenChainName]
      : ORDER_ADDRESSES[preferredChain as OrderTokenChainName];

  const currentChainId =
    SUPPORTED_CHAINS.find(c => c.id === preferredChain)?.chainId || 1;

  const connectedChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const isCorrectChain = connectedChainId === currentChainId;

  const { switchChain } = useSwitchChain();

  useEffect(() => {
    Object.entries(ORDER_ADDRESSES).forEach(([chain, address]) => {
      if (!address) {
        console.log(`Missing ORDER token address for ${chain}`);
      } else if (!validateAddress(address)) {
        console.log(`Invalid ORDER token address format for ${chain}`);
      }
    });
  }, []);

  const handleChainChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newChain = e.target.value as ChainName;
    setChain(newChain);

    const preferredChain = getPreferredChain(newChain);

    const chainId = SUPPORTED_CHAINS.find(
      c => c.id === preferredChain
    )?.chainId;

    if (chainId) {
      try {
        switchChain({ chainId });
      } catch (error) {
        console.error("Chain switch error:", error);
      }
    }
  };

  const { data: tokenBalance } = useBalance({
    address,
    token: currentTokenAddress as `0x${string}`,
    chainId: currentChainId,
  });

  const { data: tokenDecimals } = useReadContract({
    address: currentTokenAddress as `0x${string}`,
    abi: [
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
      },
    ],
    functionName: "decimals",
    chainId: currentChainId,
  });

  const { data: hash, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

  useEffect(() => {
    if (isConfirmed && hash) {
      setTxHash(hash);

      verifyTransaction(hash.toString());
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    async function fetchExistingBrokerIds() {
      try {
        const response = await fetch(`${getBaseUrl()}/v1/public/broker/name`);
        if (!response.ok) {
          throw new Error("Failed to fetch broker IDs");
        }

        const data: BrokerIdResponse = await response.json();

        if (data.success && data.data?.rows) {
          const brokerIds = data.data.rows.map(row => row.broker_id);
          setExistingBrokerIds(brokerIds);
        }
      } catch (error) {
        console.error("Error fetching broker IDs:", error);
      }
    }

    fetchExistingBrokerIds();
  }, []);

  useEffect(() => {
    if (!brokerId) {
      setBrokerIdError(null);
      return;
    }

    const isValidFormat = /^[a-z0-9_-]+$/.test(brokerId);
    if (!isValidFormat) {
      setBrokerIdError(
        "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
      );
      return;
    }

    if (existingBrokerIds.includes(brokerId)) {
      setBrokerIdError(
        "This broker ID is already taken. Please choose another one."
      );
      return;
    }

    setBrokerIdError(null);
  }, [brokerId, existingBrokerIds]);

  const loadFeeConfiguration = useCallback(async () => {
    try {
      const feeResponse = await get<FeeConfigResponse>(
        "api/graduation/fees",
        token
      );

      if (feeResponse.success) {
        setMakerFee(feeResponse.makerFee);
        setTakerFee(feeResponse.takerFee);
      }
    } catch (error) {
      console.error("Error loading fee configuration:", error);
    }
  }, [token, setMakerFee, setTakerFee]);

  const loadFeeOptions = useCallback(async () => {
    setIsLoadingFeeOptions(true);
    try {
      const response = await get<FeeOptionsResponse>(
        "api/graduation/fee-options",
        token
      );
      setFeeOptions(response);
    } catch (error) {
      console.error("Error loading fee options:", error);
      toast.error("Failed to load graduation fee options");
    } finally {
      setIsLoadingFeeOptions(false);
    }
  }, [token]);

  useEffect(() => {
    async function loadStatus() {
      try {
        await Promise.all([loadFeeConfiguration(), loadFeeOptions()]);
      } catch (error) {
        console.error("Error loading graduation status:", error);

        if (
          error instanceof Error &&
          error.message.includes("You must create a DEX first") &&
          onNoDexSetup
        ) {
          onNoDexSetup();
        }
      }
    }

    loadStatus();
  }, [token, hasSubmitted, loadFeeConfiguration, loadFeeOptions, onNoDexSetup]);

  useEffect(() => {
    async function loadGraduationStatus() {
      try {
        const response = await get<NewGraduationStatusResponse>(
          "api/graduation/graduation-status",
          token,
          { showToastOnError: false }
        );

        setGraduationStatus(response);
      } catch (error) {
        console.error("Error loading graduation status:", error);
        setGraduationStatus(null);
      }
    }

    async function loadDexData() {
      try {
        const response = await get<{ repoUrl?: string }>("api/dex", token, {
          showToastOnError: false,
        });
        setDexData(response);
      } catch (error) {
        console.error("Error loading DEX data:", error);
        setDexData(null);
      }
    }

    if (token) {
      loadGraduationStatus();
      loadDexData();
    }
  }, [token, hasSubmitted]);

  const handleFinalizeAdminWallet = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!graduationStatus?.brokerId) {
      toast.error(
        "No broker ID found. Please complete the previous steps first."
      );
      return;
    }

    if (!walletClient) {
      toast.error(
        "No wallet client available. Please ensure your wallet is connected."
      );
      return;
    }

    setIsFinalizingAdminWallet(true);
    try {
      const existingRegistration = await checkAccountRegistration(
        address,
        graduationStatus.brokerId
      );

      if (!existingRegistration.isRegistered) {
        const provider = new BrowserProvider(walletClient);
        const signer = await provider.getSigner();

        await registerAccount(
          signer,
          address,
          connectedChainId || 1,
          graduationStatus.brokerId
        );

        toast.success("Registration submitted! Waiting for confirmation...");

        await pollAccountRegistration(
          address,
          graduationStatus.brokerId,
          20,
          1000
        );

        toast.success("Account registered successfully!");
      }

      const response = await post<{
        success: boolean;
        message: string;
        isGraduated: boolean;
      }>("api/graduation/finalize-admin-wallet", {}, token, {
        showToastOnError: false,
      });

      if (response.success) {
        toast.success(
          "Admin wallet setup completed! Your DEX has graduated successfully."
        );
        const statusResponse = await get<NewGraduationStatusResponse>(
          "api/graduation/graduation-status",
          token
        );
        setGraduationStatus(statusResponse);

        if (onGraduationSuccess) {
          onGraduationSuccess();
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error finalizing admin wallet:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to finalize admin wallet setup"
      );
    } finally {
      setIsFinalizingAdminWallet(false);
    }
  };

  const handleSaveFees = async (
    e: FormEvent,
    newMakerFee: number,
    newTakerFee: number
  ) => {
    e.preventDefault();

    setIsSavingFees(true);

    try {
      const response = await post<FeeConfigResponse>(
        "api/graduation/fees",
        { makerFee: newMakerFee, takerFee: newTakerFee },
        token
      );

      if (response.success) {
        setMakerFee(newMakerFee);
        setTakerFee(newTakerFee);

        toast.success("Fee configuration updated successfully");
      } else {
        toast.error(response.message || "Failed to update fees");
      }
    } catch (error) {
      console.error("Error updating fees:", error);
      toast.error("Failed to update fee configuration");
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleTransferOrder = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (brokerIdError) {
      toast.error(brokerIdError);
      return;
    }

    if (!brokerId) {
      toast.error("Please enter your broker ID");
      return;
    }

    try {
      console.log(`Initiating ORDER token transfer on ${chain}`);

      if (!currentTokenAddress) {
        console.log(`Missing ORDER token address for ${chain}`);
        toast.error("Missing token address configuration");
        return;
      }

      if (!feeOptions?.receiverAddress) {
        console.log("Missing receiver address from fee options");
        toast.error("Missing receiver address configuration");
        return;
      }

      if (tokenDecimals === undefined) {
        toast.error("Loading token information, please try again in a moment");
        return;
      }

      if (!validateAddress(feeOptions.receiverAddress)) {
        console.log("Invalid receiver address format");
        toast.error("Invalid receiver address configuration");
        return;
      }

      try {
        await switchChain({ chainId: currentChainId });
      } catch (error) {
        console.error("Failed to switch chain:", error);
        toast.error(
          "Please make sure your wallet is on the correct network before continuing"
        );
        return;
      }

      if (!feeOptions) {
        toast.error("Fee options not loaded. Please try again.");
        return;
      }

      const selectedOption =
        paymentType === "usdc" ? feeOptions.usdc : feeOptions.order;

      const decimals = tokenDecimals ?? (paymentType === "usdc" ? 6 : 18);
      const amount = parseUnits(selectedOption.amount.toString(), decimals);

      console.log({
        chain: preferredChain,
        decimals,
        requiredAmount: selectedOption.amount,
        calculatedAmount: amount.toString(),
        address: currentTokenAddress as `0x${string}`,
        functionName: "transfer",
        args: [feeOptions.receiverAddress, amount],
        chainId: currentChainId,
      });
      writeContract({
        abi: ERC20_ABI,
        address: currentTokenAddress as `0x${string}`,
        functionName: "transfer",
        args: [feeOptions.receiverAddress, amount],
        chainId: currentChainId,
      });
    } catch (error) {
      console.log("ORDER token transfer error:", error);

      let errorMessage = "Failed to initiate transfer";
      if (error instanceof Error) {
        errorMessage = `Failed to initiate transfer: ${error.message}`;
      }

      toast.error(errorMessage);
    }
  };

  const verifyTransaction = async (transactionHash: string) => {
    setResult(null);
    setIsLoading(true);

    toast.info(
      "Verifying transaction... This may take up to 1-2 minutes. Please wait."
    );

    try {
      const response = await post<VerifyTxResponse>(
        "api/graduation/verify-tx",
        {
          txHash: transactionHash,
          chain: preferredChain,
          brokerId,
          makerFee,
          takerFee,
          paymentType,
        },
        token,
        { showToastOnError: false }
      );

      setResult(response);
      setHasSubmitted(true);

      if (response.success) {
        toast.success("Transaction verified successfully!");
        loadFeeConfiguration();
        setTxHash("");
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (onGraduationSuccess) {
          onGraduationSuccess();
        }
      } else {
        toast.error(response.message || "Verification failed");
      }
    } catch (error) {
      console.log("Transaction verification error:", error);

      let errorMessage = "Verification failed";

      if (error instanceof Error) {
        errorMessage = error.message;
        setResult({ success: false, message: error.message });
      } else {
        setResult({ success: false, message: "Unknown error occurred" });
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (brokerIdError) {
      toast.error(brokerIdError);
      return;
    }

    await verifyTransaction(txHash);
  };

  const getBlockExplorerUrl = (txHash: string, chainId: string) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (!chain) return null;

    return getBlockExplorerUrlByChainId(txHash, chain.chainId);
  };

  // Show finalize admin wallet step if broker ID is created but not graduated
  if (
    graduationStatus?.success &&
    graduationStatus.brokerId !== "demo" &&
    !graduationStatus.isGraduated
  ) {
    return (
      <Card className="w-full max-w-lg mx-auto slide-fade-in">
        <div className="text-center">
          <div className="i-mdi:account-check text-6xl text-primary-light mx-auto mb-2"></div>
          <div className="bg-primary/10 rounded-full text-primary-light px-4 py-2 inline-block text-sm font-medium mb-4">
            Broker ID Created!
          </div>
          <h2 className="text-2xl font-bold">Complete Your Graduation</h2>
          <p className="text-gray-300 mt-2 mb-6">
            Your broker ID{" "}
            <span className="font-mono bg-background-card px-2 py-1 rounded text-primary-light">
              {graduationStatus.brokerId}
            </span>{" "}
            has been created. Complete the final step to start earning fees.
          </p>

          <div className="bg-warning/10 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium flex items-center mb-2">
              <div className="i-mdi:alert-circle text-warning mr-2 h-5 w-5"></div>
              Final Step Required
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-warning">
                You are not earning fees yet.
              </strong>{" "}
              Complete the admin wallet setup to start earning revenue from your
              DEX.
            </p>
            <Button
              onClick={handleFinalizeAdminWallet}
              isLoading={isFinalizingAdminWallet}
              loadingText="Registering with Orderly..."
              variant="primary"
              className="mxa"
            >
              Register with Orderly & Start Earning
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-light/5 rounded-lg p-4 text-left">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <div className="i-mdi:information text-primary-light mr-2 h-4 w-4"></div>
              What This Does
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              This final step registers your EVM address with Orderly Network
              and activates your broker account. Once completed, you'll start
              earning fees from all trades on your DEX.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Registers your EVM address with Orderly Network</p>
              <p>• Creates your broker account for fee collection</p>
              <p>• Enables revenue sharing from your DEX</p>
            </div>
          </div>

          {/* Registration Instructions */}
          <div className="bg-light/5 rounded-lg p-4 text-left mt-4">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <div className="i-mdi:account-plus text-primary-light mr-2 h-4 w-4"></div>
              Registration Process
            </h3>
            <p className="text-sm text-gray-400">
              When you click "Finalize Setup", you'll be prompted to sign a
              message to register your EVM address with Orderly Network using
              broker ID{" "}
              <span className="font-mono text-primary-light">
                {graduationStatus.brokerId}
              </span>
              . This happens directly in your wallet - no need to visit external
              sites.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show fully graduated state
  if (graduationStatus?.isGraduated) {
    return (
      <Card className="w-full max-w-lg mx-auto slide-fade-in">
        <div className="text-center">
          <div className="i-mdi:check-circle text-6xl text-success mx-auto mb-2"></div>
          <div className="bg-success/10 rounded-full text-success px-4 py-2 inline-block text-sm font-medium mb-4">
            Graduated Successfully!
          </div>
          <h2 className="text-2xl font-bold">Congratulations!</h2>
          <p className="text-gray-300 mt-2 mb-6">
            Your DEX has successfully graduated to the revenue-sharing tier.
            Your custom broker ID{" "}
            <span className="font-mono bg-background-card px-2 py-1 rounded text-primary-light">
              {graduationStatus.brokerId}
            </span>{" "}
            is now active and your DEX is fully ready for users!
          </p>

          {/* DEX is Ready Section */}
          {dexData?.repoUrl && (
            <div className="bg-success/10 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium flex items-center mb-2">
                <div className="i-mdi:check-circle text-success mr-2 h-5 w-5"></div>
                Your DEX is Ready!
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Your DEX has been deployed with your broker ID and is now fully
                operational. Users can start trading and you'll earn fees from
                all transactions.
              </p>
              <a
                href={generateDeploymentUrl(dexData.repoUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success hover:underline font-medium"
              >
                View Your Live DEX →
              </a>
            </div>
          )}

          <div className="bg-light/5 rounded-lg p-5 mb-6 text-left">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <div className="i-mdi:star text-warning mr-2 h-5 w-5"></div>
              Your DEX Benefits
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-success/20 p-1.5 rounded-full mt-0.5">
                  <div className="i-mdi:cash-multiple text-success h-4 w-4"></div>
                </div>
                <div>
                  <span className="font-medium">Fee Revenue Sharing</span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    You now earn a percentage of all trading fees generated
                    through your DEX.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="bg-warning/20 p-1.5 rounded-full mt-0.5">
                  <div className="i-mdi:cog text-warning h-4 w-4"></div>
                </div>
                <div>
                  <span className="font-medium">Custom Fee Configuration</span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    You can now customize your maker and taker fees to optimize
                    for your trading community.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Base Fee Explanation */}
          <BaseFeeExplanation />

          {/* Current Fee Settings - Read Only */}
          <FeeConfigWithCalculator
            makerFee={makerFee}
            takerFee={takerFee}
            readOnly={true}
            defaultOpenCalculator={true}
            showSaveButton={false}
          />
        </div>
      </Card>
    );
  }

  // Default form UI for initial submission
  return (
    <Card className="w-full max-w-lg mx-auto slide-fade-in">
      <h2 className="text-xl font-bold mb-4">Upgrade Your DEX</h2>

      <div className="bg-light/5 rounded-lg p-4 mb-6">
        <h3 className="text-md font-medium mb-3">What is DEX Graduation?</h3>
        <p className="text-gray-300 text-sm mb-3">
          Graduating your DEX enables revenue sharing and additional features:
        </p>
        <ul className="text-sm space-y-2 mb-3">
          <li className="flex items-start gap-2">
            <div className="i-mdi:cash-multiple text-success w-4 h-4 mt-0.5 flex-shrink-0"></div>
            <span>
              You'll earn a percentage of all trading fees generated through
              your DEX
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="i-mdi:gift text-primary-light w-4 h-4 mt-0.5 flex-shrink-0"></div>
            <span>
              Your traders will receive ORDER token rewards based on trading
              volume
            </span>
          </li>
          <li className="flex items-start gap-2">
            <div className="i-mdi:cog text-warning w-4 h-4 mt-0.5 flex-shrink-0"></div>
            <span>
              You can customize trading fees to optimize for your community
            </span>
          </li>
        </ul>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">Why send tokens for graduation?</span>{" "}
          This requirement ensures DEX creators are committed to the Orderly
          ecosystem and helps maintain quality standards.
        </p>
      </div>

      {isLoadingFeeOptions ? (
        <div className="flex items-center justify-center py-4">
          <div className="i-svg-spinners:three-dots text-2xl text-primary"></div>
        </div>
      ) : feeOptions ? (
        <p className="text-gray-300 mb-4">Loading graduation options...</p>
      ) : (
        <p className="text-gray-300 mb-4">Loading graduation options...</p>
      )}

      {/* Base Fee Explanation - Add here */}
      <BaseFeeExplanation />

      {/* Fee Configuration Section */}
      <div className="mb-6">
        <div className="bg-light/5 rounded-xl p-4 mb-4">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <div className="i-mdi:cog text-gray-400 w-5 h-5 mr-2"></div>
            Trading Fee Configuration
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Configure your trading fees to determine your revenue split. Default
            values are shown below.
          </p>

          <FeeConfigWithCalculator
            makerFee={makerFee}
            takerFee={takerFee}
            readOnly={false}
            isSavingFees={isSavingFees}
            onSaveFees={handleSaveFees}
            onFeesChange={(newMakerFee, newTakerFee) => {
              setMakerFee(newMakerFee);
              setTakerFee(newTakerFee);
            }}
            defaultOpenCalculator={false}
            alwaysShowConfig={true}
            showSaveButton={false}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4">
          <label htmlFor="chain" className="block text-sm font-medium mb-1">
            Blockchain
          </label>
          <div className="text-xs text-gray-400 mb-2">
            Select which blockchain you'll use to send ORDER tokens. This
            doesn't affect where your DEX will operate, as Orderly is an
            omnichain infrastructure. The ORDER token requirement is simply a
            commitment fee.
          </div>
          <select
            id="chain"
            value={chain}
            onChange={handleChainChange}
            className="w-full px-3 py-2 bg-background-card border border-light/10 rounded-lg"
            required
          >
            {ORDER_TOKEN_CHAINS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="brokerId"
          label="Broker ID"
          type="text"
          value={brokerId}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setBrokerId(e.target.value)
          }
          placeholder="my-broker-id"
          required
          helpText={
            <>
              <span className="text-gray-400 mb-1 block">
                Your preferred unique broker ID (lowercase letters, numbers,
                hyphens, and underscores only)
              </span>
              <span className="text-gray-400 mt-1 block">
                This ID uniquely identifies your DEX in the Orderly ecosystem
                and will be used for revenue tracking and user rewards.
              </span>
            </>
          }
          validator={value => {
            if (!new RegExp("^[a-z0-9_-]+$").test(value)) {
              return "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores";
            }
            if (existingBrokerIds.includes(value)) {
              return "This broker ID is already taken. Please choose another one.";
            }
            return null;
          }}
          onError={error => setBrokerIdError(error)}
        />
        {!brokerIdError && brokerId && (
          <div className="mt-1 text-xs text-success flex items-center">
            <span className="i-mdi:check-circle mr-1"></span>
            Broker ID is available
          </div>
        )}

        {feeOptions && (
          <div className="mb-6 mt-8">
            <p className="text-gray-300 mb-4">
              Choose your graduation payment method:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* USDC Option */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  paymentType === "usdc"
                    ? "border-primary bg-primary/10"
                    : "border-light/10 bg-background-card hover:border-light/20"
                }`}
                onClick={() => setPaymentType("usdc")}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">USDC</h3>
                  <div className="bg-success/20 text-success px-2 py-1 rounded-full text-xs">
                    Stable
                  </div>
                </div>
                <p className="text-2xl font-bold text-success">
                  ${feeOptions.usdc.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Fixed USD amount</p>
              </div>

              {/* ORDER Option */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  paymentType === "order"
                    ? "border-primary bg-primary/10"
                    : "border-light/10 bg-background-card hover:border-light/20"
                }`}
                onClick={() => setPaymentType("order")}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <h3 className="font-medium">ORDER</h3>
                  <div className="bg-warning/20 text-warning px-2 py-1 rounded-full text-xs">
                    25% Off
                  </div>
                </div>
                <p className="text-2xl font-bold text-warning">
                  {feeOptions.order.amount.toLocaleString()} ORDER
                </p>
                <p className="text-sm text-gray-400">
                  ~$
                  {(
                    feeOptions.order.amount * feeOptions.order.currentPrice
                  ).toFixed(2)}{" "}
                  <span className="text-warning font-medium">
                    (25% off USD)
                  </span>
                </p>
              </div>
            </div>

            <p className="text-gray-300 text-sm">
              Send the selected amount to the address below and submit the
              transaction hash.
              {paymentType === "order" && (
                <a
                  href={getSwapUrl(preferredChain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary-light hover:underline inline-flex items-center"
                >
                  Need ORDER tokens? Buy here
                  <span className="i-mdi:open-in-new w-3.5 h-3.5 ml-1"></span>
                </a>
              )}
            </p>
          </div>
        )}

        <div className="space-y-4 mt-6">
          {/* Direct transfer button */}
          <div className="border rounded-xl p-4 bg-primary/10 border-primary/20">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <div className="w-5 h-5 mr-2 i-mdi:rocket-launch text-primary"></div>
              Send {paymentType === "usdc" ? "USDC" : "ORDER"} Tokens
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Send {paymentType === "usdc" ? "USDC" : "ORDER"} tokens and verify
              in one step directly from your wallet.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400">Using token:</div>
                <div className="text-xs bg-info/20 text-info px-2 py-1 rounded-full flex items-center">
                  <div className="i-mdi:information-outline mr-1 w-3.5 h-3.5"></div>
                  <span>
                    {SUPPORTED_CHAINS.find(c => c.id === preferredChain)
                      ?.name || preferredChain}{" "}
                    {paymentType === "usdc" ? "USDC" : "ORDER"}
                  </span>
                </div>
              </div>

              {tokenBalance && (
                <div className="text-xs mb-3 flex items-center">
                  <span className="text-info">Your balance:</span>{" "}
                  <span className="font-medium ml-1">
                    {parseFloat(tokenBalance?.formatted || "0").toFixed(2)}{" "}
                    {paymentType === "usdc" ? "USDC" : "ORDER"}
                  </span>
                  {feeOptions &&
                    parseFloat(tokenBalance?.formatted || "0") <
                      (paymentType === "usdc"
                        ? feeOptions.usdc.amount
                        : feeOptions.order.amount) && (
                      <div className="ml-2 text-warning flex items-center">
                        (Insufficient for graduation)
                        {paymentType === "order" && (
                          <a
                            href={getSwapUrl(preferredChain)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-primary-light hover:underline inline-flex items-center"
                          >
                            Buy ORDER
                            <span className="i-mdi:open-in-new w-3 h-3 ml-0.5"></span>
                          </a>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm">Amount:</div>
              <div className="font-medium">
                {feeOptions
                  ? paymentType === "usdc"
                    ? `${feeOptions.usdc.amount.toLocaleString()} USDC`
                    : `${feeOptions.order.amount.toLocaleString()} ORDER`
                  : "Loading..."}
              </div>
            </div>

            <Button
              onClick={handleTransferOrder}
              isLoading={isPending || isConfirming || isLoading}
              loadingText={
                isPending
                  ? "Confirm in wallet..."
                  : isConfirming
                    ? "Confirming..."
                    : "Verifying transaction... This may take 1-2 minutes"
              }
              disabled={
                !!brokerIdError ||
                !brokerId ||
                !feeOptions ||
                isLoading ||
                (tokenBalance
                  ? parseFloat(tokenBalance?.formatted || "0") <
                    (paymentType === "usdc"
                      ? feeOptions.usdc.amount
                      : feeOptions.order.amount)
                  : false)
              }
              variant="primary"
              className="w-full justify-center"
            >
              {isCorrectChain
                ? `Transfer ${paymentType === "usdc" ? "USDC" : "ORDER"} Tokens`
                : "Switch Chain"}
            </Button>

            {isConfirmed && hash && !result && (
              <div className="mt-3 bg-success/10 text-success text-sm p-2 rounded">
                <div className="flex items-center justify-between">
                  <span>Transfer successful! Verifying transaction...</span>
                  {getBlockExplorerUrl(hash, preferredChain) && (
                    <a
                      href={getBlockExplorerUrl(hash, preferredChain)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-light hover:text-primary text-xs flex items-center ml-2"
                    >
                      View on Explorer
                      <span className="i-mdi:open-in-new w-3 h-3 ml-1"></span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle for manual hash input */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm text-primary-light hover:text-primary flex items-center gap-1 mx-auto"
            >
              <div
                className={clsx(
                  "transition-transform",
                  showManualInput ? "rotate-90" : ""
                )}
              >
                <div className="i-mdi:chevron-right w-4 h-4"></div>
              </div>
              {showManualInput
                ? "Hide manual option"
                : `I already sent ${paymentType === "usdc" ? "USDC" : "ORDER"} tokens`}
            </button>
          </div>

          {/* Manual hash form - only show when toggled */}
          {showManualInput && (
            <div className="border rounded-xl p-4 bg-background-card">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 i-mdi:file-document text-gray-400"></div>
                Manual Transaction Verification
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                If you've already sent{" "}
                {paymentType === "usdc" ? "USDC" : "ORDER"} tokens, enter the
                transaction hash to verify and complete your graduation.
              </p>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-400">Recipient Address:</p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        feeOptions?.receiverAddress || "",
                        "Recipient Address"
                      )
                    }
                    className="text-primary-light hover:text-primary text-xs flex items-center"
                  >
                    <div className="i-mdi:content-copy w-3 h-3 mr-1"></div>
                    Copy
                  </button>
                </div>
                <div className="bg-background-dark/70 p-2 rounded overflow-hidden">
                  <code className="text-xs font-mono break-all w-full block">
                    {feeOptions?.receiverAddress || "Loading..."}
                  </code>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-400">
                    {paymentType === "usdc" ? "USDC" : "ORDER"} Token Address:
                  </p>
                  <a
                    href={getSwapUrl(preferredChain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:text-primary text-xs flex items-center"
                  >
                    <div className="i-mdi:cart w-3 h-3 mr-1"></div>
                    Buy {paymentType === "usdc" ? "USDC" : "ORDER"}
                  </a>
                </div>
                <div className="bg-background-dark/70 p-2 rounded overflow-hidden">
                  <code className="text-xs font-mono break-all w-full block">
                    {currentTokenAddress}
                  </code>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="i-mdi:information-outline text-blue-400 mt-0.5 h-5 w-5 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">
                      Transaction Verification
                    </h4>
                    <p className="text-xs text-gray-300">
                      Verification involves checking the blockchain transaction
                      and may take 1-2 minutes to complete. Please be patient
                      and do not refresh the page during this process.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  id="txHash"
                  label="Transaction Hash"
                  type="text"
                  value={txHash}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setTxHash(e.target.value)
                  }
                  placeholder="0x..."
                  required
                  helpText={`The transaction hash of your ${paymentType === "usdc" ? "USDC" : "ORDER"} token transfer`}
                />

                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isLoading}
                  loadingText="Verifying transaction... This may take 1-2 minutes"
                  className="w-full justify-center"
                  disabled={!txHash || !!brokerIdError || !brokerId}
                >
                  Verify Transaction
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${result.success ? "bg-success/10" : "bg-error/10"}`}
        >
          <p className={result.success ? "text-success" : "text-error"}>
            {result.message}
          </p>
          {result.success && result.amount && (
            <p className="text-gray-300 text-sm mt-2">
              Verified transfer of {result.amount}{" "}
              {paymentType === "usdc" ? "USDC" : "ORDER"} tokens
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
