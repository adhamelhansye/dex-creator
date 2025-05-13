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
} from "wagmi";
import { parseEther } from "viem";
import clsx from "clsx";

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

const SUPPORTED_CHAINS = [
  { id: "arbitrum", name: "Arbitrum", chainId: 42161 },
  { id: "ethereum", name: "Ethereum", chainId: 1 },
];

const REQUIRED_ORDER_AMOUNT = parseInt(
  import.meta.env.VITE_REQUIRED_ORDER_AMOUNT || "1000"
);

const MIN_MAKER_FEE = 0;
const MIN_TAKER_FEE = 3;
const MAX_FEE = 15;

const DEFAULT_ETH_ORDER_ADDRESS = "0xABD4C63d2616A5201454168269031355f4764337";
const DEFAULT_ARB_ORDER_ADDRESS = "0x4E200fE2f3eFb977d5fd9c430A41531FB04d97B8";

const ORDER_TOKEN_ADDRESSES: Record<string, string> = {
  ethereum: import.meta.env.VITE_ETH_ORDER_ADDRESS || DEFAULT_ETH_ORDER_ADDRESS,
  arbitrum: import.meta.env.VITE_ARB_ORDER_ADDRESS || DEFAULT_ARB_ORDER_ADDRESS,
};

const getSwapUrl = (chainId: string) => {
  const tokenAddress = ORDER_TOKEN_ADDRESSES[chainId];
  return `https://swap.defillama.com/?chain=${chainId}&from=0x0000000000000000000000000000000000000000&tab=swap&to=${tokenAddress}`;
};

const ORDER_RECEIVER_ADDRESSES: Record<string, string> = {
  ethereum:
    import.meta.env.VITE_ETH_RECEIVER_ADDRESS || "0xOrderlyReceiverAddress",
  arbitrum:
    import.meta.env.VITE_ARB_RECEIVER_ADDRESS || "0xOrderlyReceiverAddress",
};

interface VerifyTxResponse {
  success: boolean;
  message: string;
  amount?: string;
  preferredBrokerId?: string;
}

interface GraduationStatusResponse {
  success: boolean;
  preferredBrokerId: string | null;
  currentBrokerId: string;
  approved: boolean;
}

interface FeeConfigResponse {
  success: boolean;
  makerFee: number;
  takerFee: number;
  canUpdate: boolean;
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

interface DexData {
  id: string;
  brokerName: string;
  brokerId: string;
  preferredBrokerId?: string | null;
  themeCSS?: string | null;
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  favicon?: string | null;
  telegramLink?: string | null;
  discordLink?: string | null;
  xLink?: string | null;
  walletConnectProjectId?: string | null;
  privyAppId?: string | null;
  privyTermsOfUse?: string | null;
  enabledMenus?: string | null;
  repoUrl?: string | null;
  customDomain?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function GraduationForm() {
  const { token } = useAuth();
  const { address } = useAccount();
  const [txHash, setTxHash] = useState("");
  const [chain, setChain] = useState<string>("arbitrum");
  const [preferredBrokerId, setPreferredBrokerId] = useState("");
  const [brokerIdError, setBrokerIdError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyTxResponse | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [existingBrokerIds, setExistingBrokerIds] = useState<string[]>([]);
  const [status, setStatus] = useState<GraduationStatusResponse | null>(null);

  const [dexData, setDexData] = useState<DexData | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  const [showFeeConfig, setShowFeeConfig] = useState(false);
  const [makerFee, setMakerFee] = useState<number>(3);
  const [takerFee, setTakerFee] = useState<number>(6);
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [makerFeeError, setMakerFeeError] = useState<string | null>(null);
  const [takerFeeError, setTakerFeeError] = useState<string | null>(null);

  const currentReceiverAddress = ORDER_RECEIVER_ADDRESSES[chain];
  const currentTokenAddress = ORDER_TOKEN_ADDRESSES[chain];
  const currentChainId =
    SUPPORTED_CHAINS.find(c => c.id === chain)?.chainId || 1;

  useEffect(() => {
    if (!token) return;

    async function fetchDexData() {
      try {
        const response = await get<DexData>("api/dex", token);
        if (response) {
          setDexData(response);

          if (response.repoUrl) {
            const repoName = response.repoUrl.split("/").pop();
            setDeploymentUrl(`https://dex.orderly.network/${repoName}/`);
          } else {
            setDeploymentUrl(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch DEX data", error);
      }
    }

    fetchDexData();
  }, [token]);

  const validateFees = (type: "maker" | "taker", value: number) => {
    if (isNaN(value)) {
      if (type === "maker") {
        setMakerFeeError("Please enter a valid number");
      } else {
        setTakerFeeError("Please enter a valid number");
      }
      return false;
    }

    if (type === "maker") {
      if (value < MIN_MAKER_FEE) {
        setMakerFeeError(`Maker fee must be at least ${MIN_MAKER_FEE} bps`);
        return false;
      } else if (value > MAX_FEE) {
        setMakerFeeError(`Maker fee cannot exceed ${MAX_FEE} bps`);
        return false;
      } else {
        setMakerFeeError(null);
        return true;
      }
    } else {
      // taker
      if (value < MIN_TAKER_FEE) {
        setTakerFeeError(`Taker fee must be at least ${MIN_TAKER_FEE} bps`);
        return false;
      } else if (value > MAX_FEE) {
        setTakerFeeError(`Taker fee cannot exceed ${MAX_FEE} bps`);
        return false;
      } else {
        setTakerFeeError(null);
        return true;
      }
    }
  };

  const handleMakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);

    setMakerFee(value);

    validateFees("maker", value);
  };

  const handleTakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);

    setTakerFee(value);

    validateFees("taker", value);
  };

  const { data: tokenBalance } = useBalance({
    address,
    token: currentTokenAddress as `0x${string}`,
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
        const response = await fetch(
          "https://api.orderly.org/v1/public/broker/name"
        );
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
    if (!preferredBrokerId) {
      setBrokerIdError(null);
      return;
    }

    const isValidFormat = /^[a-z0-9_-]+$/.test(preferredBrokerId);
    if (!isValidFormat) {
      setBrokerIdError(
        "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores"
      );
      return;
    }

    if (existingBrokerIds.includes(preferredBrokerId)) {
      setBrokerIdError(
        "This broker ID is already taken. Please choose another one."
      );
      return;
    }

    setBrokerIdError(null);
  }, [preferredBrokerId, existingBrokerIds]);

  const loadFeeConfiguration = useCallback(async () => {
    try {
      const feeResponse = await get<FeeConfigResponse>(
        "api/graduation/fees",
        token
      );

      if (feeResponse.success) {
        setMakerFee(feeResponse.makerFee);
        setTakerFee(feeResponse.takerFee);
        console.log(
          "Loaded fees from server:",
          feeResponse.makerFee,
          feeResponse.takerFee
        );
      }
    } catch (error) {
      console.error("Error loading fee configuration:", error);
    }
  }, [token, setMakerFee, setTakerFee]);

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await get<GraduationStatusResponse>(
          "api/graduation/status",
          token
        );

        setStatus(response);

        if (response.preferredBrokerId || response.approved) {
          await loadFeeConfiguration();
        }
      } catch (error) {
        console.error("Error loading graduation status:", error);
      }
    }

    loadStatus();
  }, [token, hasSubmitted, loadFeeConfiguration]);

  const handleSaveFees = async (e: FormEvent) => {
    e.preventDefault();
    setFeeError(null);

    if (makerFeeError || takerFeeError) {
      setFeeError("Please correct the errors before saving");
      return;
    }

    const isMakerValid = validateFees("maker", makerFee);
    const isTakerValid = validateFees("taker", takerFee);

    if (!isMakerValid || !isTakerValid) {
      setFeeError("Fee values are outside of allowed range");
      return;
    }

    setIsSavingFees(true);

    try {
      const response = await post<FeeConfigResponse>(
        "api/graduation/fees",
        { makerFee, takerFee },
        token
      );

      if (response.success) {
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

    if (!preferredBrokerId) {
      toast.error("Please enter your preferred broker ID");
      return;
    }

    try {
      const amount = parseEther(REQUIRED_ORDER_AMOUNT.toString());

      writeContract({
        abi: ERC20_ABI,
        address: currentTokenAddress as `0x${string}`,
        functionName: "transfer",
        args: [currentReceiverAddress, amount],
        chainId: currentChainId,
      });
    } catch (error) {
      console.error("Error transferring ORDER tokens:", error);
      toast.error("Failed to initiate transfer");
    }
  };

  const verifyTransaction = async (transactionHash: string) => {
    setResult(null);
    setIsLoading(true);

    try {
      const response = await post<VerifyTxResponse>(
        "api/graduation/verify-tx",
        {
          txHash: transactionHash,
          chain,
          preferredBrokerId,
        },
        token,
        { showToastOnError: false }
      );

      setResult(response);
      setHasSubmitted(true);

      if (response.success) {
        toast.success("Transaction verified successfully!");
        loadFeeConfiguration();
      } else {
        toast.error(response.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);

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

  if (status?.approved) {
    return (
      <Card className="w-full max-w-lg mx-auto slide-fade-in">
        <div className="text-center">
          <div className="i-mdi:check-circle text-6xl text-success mx-auto mb-2"></div>
          <div className="bg-success/10 rounded-full text-success px-4 py-2 inline-block text-sm font-medium mb-4">
            Approved and Ready!
          </div>
          <h2 className="text-2xl font-bold">Congratulations!</h2>
          <p className="text-gray-300 mt-2 mb-6">
            Your DEX has successfully graduated to the revenue-sharing tier.
            Your custom broker ID{" "}
            <span className="font-mono bg-background-card px-2 py-1 rounded text-primary-light">
              {status.currentBrokerId}
            </span>{" "}
            has been approved.
          </p>

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
                <div className="bg-primary/20 p-1.5 rounded-full mt-0.5">
                  <div className="i-mdi:gift text-primary-light h-4 w-4"></div>
                </div>
                <div>
                  <span className="font-medium">Trader Rewards</span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Your traders are now eligible to receive ORDER token rewards
                    based on their trading volume.
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

          {/* New section for accessing fee share */}
          <div className="bg-primary/10 rounded-lg p-5 mb-6 text-left border border-primary/20">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <div className="i-mdi:wallet text-primary-light mr-2 h-5 w-5"></div>
              Accessing Your Fee Share
            </h3>

            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">
                  How to access your trading fee revenue:
                </span>
              </p>

              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="text-primary-light font-medium">
                    <a
                      href={
                        dexData?.customDomain
                          ? `https://${dexData.customDomain}`
                          : deploymentUrl || "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center inline-flex"
                    >
                      Log in to your DEX
                      <div className="i-mdi:open-in-new w-3.5 h-3.5 ml-1"></div>
                    </a>
                  </span>{" "}
                  using your admin wallet (the same wallet you used to set up
                  this DEX)
                </li>
                <li>
                  Navigate to the <span className="font-medium">Account</span>{" "}
                  section of your DEX
                </li>
                <li>
                  Your accumulated fee share will be displayed in your balance
                </li>
                <li>
                  You can withdraw your fee share to any supported chain through
                  the withdrawal interface
                </li>
              </ol>

              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-start gap-2">
                  <div className="i-mdi:information-outline text-primary-light h-4 w-4 mt-0.5 flex-shrink-0"></div>
                  <p className="text-xs text-gray-400">
                    <span className="text-primary-light font-medium">
                      Important:
                    </span>{" "}
                    Your fee share accrues automatically as users trade on your
                    DEX. Only your admin wallet can access and withdraw these
                    fees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Fee Settings - Read Only */}
          <div className="mt-6 pt-6 border-t border-light/10">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <div className="i-mdi:currency-usd text-warning mr-2 h-5 w-5"></div>
              Current Fee Settings
            </h3>

            <div className="bg-light/5 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-4">
                Your DEX has the following fee configuration. To request a
                change to these fees, please contact Orderly support.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Maker Fee</div>
                  <div className="text-xl font-semibold">
                    {makerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(makerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Fee</div>
                  <div className="text-xl font-semibold">
                    {takerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(takerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-info/10 rounded-lg p-3 flex items-start gap-2 text-sm">
                <div className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0 mt-0.5"></div>
                <p className="text-gray-300">
                  Fee changes require administrative approval and cannot be
                  modified directly at this time. If you need to change your
                  fees, please contact Orderly support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // If user has already submitted but not approved yet
  if (status?.preferredBrokerId) {
    return (
      <Card className="w-full max-w-lg mx-auto slide-fade-in">
        <div className="text-center">
          <div className="i-mdi:clock text-5xl text-warning mx-auto mb-2"></div>
          <div className="bg-warning/10 rounded-full text-warning px-4 py-2 inline-block text-sm font-medium mb-4">
            Awaiting Admin Approval
          </div>
          <h2 className="text-2xl font-bold">Almost There!</h2>
          <p className="text-gray-300 mt-2 mb-6">
            Your request for broker ID{" "}
            <span className="font-mono bg-background-card px-2 py-1 rounded text-primary-light">
              {status.preferredBrokerId}
            </span>{" "}
            is pending admin approval.
          </p>

          <div className="bg-light/5 rounded-lg p-5 mb-6 text-left">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <div className="i-mdi:clock text-warning mr-2 h-5 w-5"></div>
              What's Happening
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-warning/20 p-1.5 rounded-full mt-0.5">
                  <div className="i-mdi:check-decagram text-warning h-4 w-4"></div>
                </div>
                <div>
                  <span className="font-medium">Verification Complete</span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    You've successfully sent ORDER tokens and requested your
                    broker ID.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-1.5 rounded-full mt-0.5">
                  <div className="i-mdi:clock-outline text-primary-light h-4 w-4"></div>
                </div>
                <div>
                  <span className="font-medium">Admin Review in Progress</span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Our team is reviewing your information and will approve your
                    broker ID shortly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-success/20 p-1.5 rounded-full mt-0.5 opacity-50">
                  <div className="i-mdi:rocket-launch text-success h-4 w-4"></div>
                </div>
                <div className="opacity-60">
                  <span className="font-medium">
                    Coming Soon: Fee Sharing Benefits
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Once approved, you'll earn a percentage of all trading fees
                    and your traders will receive rewards. Your fee share will
                    be accessible by{" "}
                    <a
                      href={
                        dexData?.customDomain
                          ? `https://${dexData.customDomain}`
                          : deploymentUrl || "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-light hover:underline inline-flex items-center"
                    >
                      logging into your DEX
                      <div className="i-mdi:open-in-new w-3.5 h-3.5 ml-1"></div>
                    </a>{" "}
                    with your admin wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-info/10 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <div className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0 mt-0.5"></div>
              <p className="text-left">
                <span className="font-medium text-info">While you wait:</span>{" "}
                You can configure your DEX fees now. These settings will be
                applied once your broker ID is approved.
              </p>
            </div>
          </div>
        </div>

        {/* Fee Configuration Section */}
        <div className="mt-4 pt-4 border-t border-light/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fee Configuration</h3>
            <button
              type="button"
              onClick={() => setShowFeeConfig(!showFeeConfig)}
              className="text-primary-light hover:text-primary flex items-center gap-1 text-sm"
            >
              {showFeeConfig ? "Hide" : "Configure"}
              <div
                className={`i-mdi:chevron-right w-4 h-4 transition-transform ${showFeeConfig ? "rotate-90" : ""}`}
              ></div>
            </button>
          </div>

          {showFeeConfig ? (
            <form onSubmit={handleSaveFees} className="slide-fade-in">
              <div className="bg-light/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-4">
                  Configure the trading fees for your DEX. Maker fees apply to
                  limit orders that provide liquidity, while taker fees apply to
                  market orders that take liquidity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="makerFee"
                      className="block text-sm font-medium mb-1"
                    >
                      Maker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="makerFee"
                        min={MIN_MAKER_FEE}
                        max={MAX_FEE}
                        step="1"
                        value={makerFee}
                        onChange={handleMakerFeeChange}
                        className={`w-full px-3 py-2 bg-background-dark border ${makerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_MAKER_FEE} bps (0.00%), Maximum: {MAX_FEE}{" "}
                      bps ({(MAX_FEE * 0.01).toFixed(2)}%)
                    </p>
                    {makerFeeError && (
                      <p className="text-xs text-error mt-1">{makerFeeError}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="takerFee"
                      className="block text-sm font-medium mb-1"
                    >
                      Taker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="takerFee"
                        min={MIN_TAKER_FEE}
                        max={MAX_FEE}
                        step="1"
                        value={takerFee}
                        onChange={handleTakerFeeChange}
                        className={`w-full px-3 py-2 bg-background-dark border ${takerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_TAKER_FEE} bps (0.03%), Maximum: {MAX_FEE}{" "}
                      bps ({(MAX_FEE * 0.01).toFixed(2)}%)
                    </p>
                    {takerFeeError && (
                      <p className="text-xs text-error mt-1">{takerFeeError}</p>
                    )}
                  </div>
                </div>

                {feeError && (
                  <div className="bg-error/10 p-2 rounded-lg mb-4 text-sm text-error">
                    {feeError}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm bg-info/10 rounded p-3 mb-4">
                  <div className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0"></div>
                  <p>
                    Setting competitive fees can attract more traders to your
                    DEX. The fee split you receive will be based on the fees
                    your traders pay.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingFees}
                  loadingText="Saving..."
                  className="w-full"
                  disabled={!!makerFeeError || !!takerFeeError}
                >
                  Save Fee Configuration
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-light/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Current Fee Structure:</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Maker Fee</div>
                  <div className="text-xl font-semibold">
                    {makerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(makerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Fee</div>
                  <div className="text-xl font-semibold">
                    {takerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(takerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Default form UI for initial submission
  return (
    <Card className="w-full max-w-lg mx-auto slide-fade-in">
      <h2 className="text-xl font-bold mb-4">Upgrade Your DEX</h2>

      <p className="text-gray-300 mb-4">
        To graduate your DEX to the next tier, please send at least{" "}
        {REQUIRED_ORDER_AMOUNT.toLocaleString()} ORDER tokens to the address
        below and submit the transaction hash.
        <a
          href={getSwapUrl(chain)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-primary-light hover:underline inline-flex items-center"
        >
          Need ORDER tokens? Buy here
          <div className="i-mdi:open-in-new w-3.5 h-3.5 ml-1"></div>
        </a>
      </p>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <label htmlFor="chain" className="block text-sm font-medium mb-1">
            Blockchain
          </label>
          <select
            id="chain"
            value={chain}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setChain(e.target.value)
            }
            className="flex-1 px-3 py-2 bg-background-card border border-light/10 rounded-lg"
            required
          >
            {SUPPORTED_CHAINS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="preferredBrokerId"
          label="Preferred Broker ID"
          type="text"
          value={preferredBrokerId}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPreferredBrokerId(e.target.value)
          }
          placeholder="my-broker-id"
          required
          pattern="^[a-z0-9_-]+$"
          helpText="Your preferred unique broker ID (lowercase letters, numbers, hyphens, and underscores only)"
          validator={value => {
            if (!/^[a-z0-9_-]+$/.test(value)) {
              return "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores";
            }
            if (existingBrokerIds.includes(value)) {
              return "This broker ID is already taken. Please choose another one.";
            }
            return null;
          }}
          onError={error => setBrokerIdError(error)}
        />
        {!brokerIdError && preferredBrokerId && (
          <div className="mt-1 text-xs text-success flex items-center">
            <span className="i-mdi:check-circle mr-1"></span>
            Broker ID is available
          </div>
        )}

        <div className="space-y-4 mt-6">
          {/* Direct transfer button */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <div className="i-mdi:rocket-launch text-primary w-5 h-5 mr-2"></div>
              Option 1: One-Click Transfer
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Send ORDER tokens and verify in one step directly from your
              wallet.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400">Using token:</div>
                <div className="text-xs bg-info/20 text-info px-2 py-1 rounded-full flex items-center">
                  <div className="i-mdi:information-outline mr-1 w-3.5 h-3.5"></div>
                  <span>
                    {chain === "ethereum" ? "Ethereum" : "Arbitrum"} ORDER
                  </span>
                </div>
              </div>

              {tokenBalance && (
                <div className="text-xs mb-3 flex items-center">
                  <span className="text-info">Your balance:</span>{" "}
                  <span className="font-medium ml-1">
                    {parseFloat(tokenBalance?.formatted || "0").toFixed(2)}{" "}
                    ORDER
                  </span>
                  {parseFloat(tokenBalance?.formatted || "0") <
                    REQUIRED_ORDER_AMOUNT && (
                    <div className="ml-2 text-warning flex items-center">
                      (Insufficient for graduation)
                      <a
                        href={getSwapUrl(chain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-primary-light hover:underline inline-flex items-center"
                      >
                        Buy ORDER
                        <div className="i-mdi:open-in-new w-3 h-3 ml-0.5"></div>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm">Amount:</div>
              <div className="font-medium">
                {REQUIRED_ORDER_AMOUNT.toLocaleString()} ORDER
              </div>
            </div>

            <Button
              onClick={handleTransferOrder}
              isLoading={isPending || isConfirming}
              loadingText={isPending ? "Confirm in wallet..." : "Confirming..."}
              disabled={
                !!brokerIdError ||
                !preferredBrokerId ||
                (tokenBalance
                  ? parseFloat(tokenBalance?.formatted || "0") <
                    REQUIRED_ORDER_AMOUNT
                  : false)
              }
              variant="primary"
              className="w-full"
            >
              {isPending || isConfirming
                ? isPending
                  ? "Confirm in wallet..."
                  : "Confirming..."
                : "Transfer ORDER Tokens"}
            </Button>

            {isConfirmed && hash && (
              <div className="mt-3 bg-success/10 text-success text-sm p-2 rounded">
                Transfer successful! Verifying transaction...
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
                : "I already sent ORDER tokens"}
            </button>
          </div>

          {/* Manual hash form - only show when toggled */}
          {showManualInput && (
            <div className="bg-light/5 border border-light/10 rounded-xl p-4 slide-fade-in">
              <h3 className="text-md font-medium mb-2 flex items-center">
                <div className="i-mdi:file-document-outline text-gray-300 w-5 h-5 mr-2"></div>
                Option 2: Enter Transaction Hash
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                If you've already sent ORDER tokens, enter the transaction hash
                below.
              </p>

              <div className="bg-background-dark/50 rounded p-3 mb-4">
                {/* Receiver address section */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-400">
                      Send ORDER tokens to:
                    </p>
                    <button
                      type="button"
                      className="text-primary-light hover:text-primary text-xs flex items-center"
                      onClick={() => {
                        navigator.clipboard.writeText(currentReceiverAddress);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <div className="i-mdi:clipboard-outline w-3 h-3 mr-1"></div>
                      Copy
                    </button>
                  </div>
                  <div className="bg-background-dark/70 p-2 rounded overflow-hidden">
                    <code className="text-xs font-mono break-all w-full block">
                      {currentReceiverAddress}
                    </code>
                  </div>
                </div>

                {/* ORDER token address section */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-400">
                      ORDER Token Address:
                    </p>
                    <a
                      href={getSwapUrl(chain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-light hover:text-primary text-xs flex items-center"
                    >
                      <div className="i-mdi:cart w-3 h-3 mr-1"></div>
                      Buy ORDER
                    </a>
                  </div>
                  <div className="bg-background-dark/70 p-2 rounded overflow-hidden">
                    <code className="text-xs font-mono break-all w-full block">
                      {currentTokenAddress}
                    </code>
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
                  helpText="The transaction hash of your ORDER token transfer"
                />

                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  className="w-full"
                  disabled={!txHash || !!brokerIdError || !preferredBrokerId}
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
              Verified transfer of {result.amount} ORDER tokens
            </p>
          )}
        </div>
      )}

      {/* Fee Configuration after successful verification */}
      {result && result.success && (
        <div className="mt-8 pt-6 border-t border-light/10 slide-fade-in">
          <div className="bg-info/10 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0"></div>
              <p className="text-sm">
                <span className="font-medium">Important:</span> Configure your
                DEX fees now. These settings will determine your revenue share.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fee Configuration</h3>
            <button
              type="button"
              onClick={() => setShowFeeConfig(!showFeeConfig)}
              className="text-primary-light hover:text-primary flex items-center gap-1 text-sm"
            >
              {showFeeConfig ? "Hide" : "Configure"}
              <div
                className={`i-mdi:chevron-right w-4 h-4 transition-transform ${showFeeConfig ? "rotate-90" : ""}`}
              ></div>
            </button>
          </div>

          {showFeeConfig ? (
            <form onSubmit={handleSaveFees} className="slide-fade-in">
              <div className="bg-light/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-4">
                  Configure the trading fees for your DEX. Maker fees apply to
                  limit orders that provide liquidity, while taker fees apply to
                  market orders that take liquidity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="makerFee"
                      className="block text-sm font-medium mb-1"
                    >
                      Maker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="makerFee"
                        min={MIN_MAKER_FEE}
                        max={MAX_FEE}
                        step="1"
                        value={makerFee}
                        onChange={handleMakerFeeChange}
                        className={`w-full px-3 py-2 bg-background-dark border ${makerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_MAKER_FEE} bps (0.00%), Maximum: {MAX_FEE}{" "}
                      bps ({(MAX_FEE * 0.01).toFixed(2)}%)
                    </p>
                    {makerFeeError && (
                      <p className="text-xs text-error mt-1">{makerFeeError}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="takerFee"
                      className="block text-sm font-medium mb-1"
                    >
                      Taker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="takerFee"
                        min={MIN_TAKER_FEE}
                        max={MAX_FEE}
                        step="1"
                        value={takerFee}
                        onChange={handleTakerFeeChange}
                        className={`w-full px-3 py-2 bg-background-dark border ${takerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_TAKER_FEE} bps (0.03%), Maximum: {MAX_FEE}{" "}
                      bps ({(MAX_FEE * 0.01).toFixed(2)}%)
                    </p>
                    {takerFeeError && (
                      <p className="text-xs text-error mt-1">{takerFeeError}</p>
                    )}
                  </div>
                </div>

                {feeError && (
                  <div className="mb-4 text-error text-sm">{feeError}</div>
                )}

                <div className="flex items-center gap-2 text-sm bg-info/10 rounded p-3 mb-4">
                  <div className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0"></div>
                  <p>
                    Setting competitive fees can attract more traders to your
                    DEX. The fee split you receive will be based on the fees
                    your traders pay.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingFees}
                  loadingText="Saving..."
                  className="w-full"
                >
                  Save Fee Configuration
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-light/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Current Fee Structure:</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Maker Fee</div>
                  <div className="text-xl font-semibold">
                    {makerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(makerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Fee</div>
                  <div className="text-xl font-semibold">
                    {takerFee}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({(takerFee * 0.01).toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
