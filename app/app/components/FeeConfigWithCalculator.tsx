import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { Button } from "./Button";
import { toast } from "react-toastify";
import { useOrderlyKey } from "../context/OrderlyKeyContext";
import { updateBrokerFees } from "../utils/orderly";
import { useModal } from "../context/ModalContext";
import { post } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const MIN_MAKER_FEE = 0;
const MIN_TAKER_FEE = 30;
const MAX_FEE = 150;
const MIN_RWA_MAKER_FEE = 0;
const MIN_RWA_TAKER_FEE = 0;
const MAX_RWA_FEE = 150;

interface FeeConfigWithCalculatorProps {
  makerFee: number;
  takerFee: number;
  rwaMakerFee?: number;
  rwaTakerFee?: number;
  readOnly?: boolean;
  isSavingFees?: boolean;
  onFeesChange?: (
    makerFee: number,
    takerFee: number,
    rwaMakerFee?: number,
    rwaTakerFee?: number
  ) => void;
  feeError?: string | null;
  defaultOpenCalculator?: boolean;
  showSaveButton?: boolean;
  alwaysShowConfig?: boolean;
  useOrderlyApi?: boolean;
  brokerId?: string;
}

const formatNumber = (value: number, maxDecimals: number = 1) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
};

export const FeeConfigWithCalculator: React.FC<
  FeeConfigWithCalculatorProps
> = ({
  makerFee: initialMakerFee,
  takerFee: initialTakerFee,
  rwaMakerFee: initialRwaMakerFee = 0,
  rwaTakerFee: initialRwaTakerFee = 50,
  readOnly = false,
  isSavingFees = false,
  onFeesChange,
  defaultOpenCalculator = false,
  showSaveButton = true,
  alwaysShowConfig = false,
  useOrderlyApi = false,
  brokerId,
}) => {
  const { orderlyKey, accountId, hasValidKey, setOrderlyKey } = useOrderlyKey();
  const { openModal } = useModal();
  const { token } = useAuth();
  const [isUpdatingFees, setIsUpdatingFees] = useState(false);
  const [showFeeConfig, setShowFeeConfig] = useState(alwaysShowConfig);
  const [makerFee, setMakerFee] = useState<number>(initialMakerFee);
  const [takerFee, setTakerFee] = useState<number>(initialTakerFee);
  const [rwaMakerFee, setRwaMakerFee] = useState<number>(initialRwaMakerFee);
  const [rwaTakerFee, setRwaTakerFee] = useState<number>(initialRwaTakerFee);
  const [makerFeeError, setMakerFeeError] = useState<string | null>(null);
  const [takerFeeError, setTakerFeeError] = useState<string | null>(null);
  const [rwaMakerFeeError, setRwaMakerFeeError] = useState<string | null>(null);
  const [rwaTakerFeeError, setRwaTakerFeeError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  const [showCalculator, setShowCalculator] = useState(defaultOpenCalculator);
  const [tradingVolume, setTradingVolume] = useState(10000000);
  const [selectedTier, setSelectedTier] = useState<
    "public" | "silver" | "gold" | "platinum" | "diamond"
  >("public");

  useEffect(() => {
    setMakerFee(initialMakerFee);
    setTakerFee(initialTakerFee);
    setRwaMakerFee(initialRwaMakerFee);
    setRwaTakerFee(initialRwaTakerFee);
  }, [
    initialMakerFee,
    initialTakerFee,
    initialRwaMakerFee,
    initialRwaTakerFee,
  ]);

  const validateFees = (
    type: "maker" | "taker" | "rwaMaker" | "rwaTaker",
    value: number
  ) => {
    if (type === "maker") {
      if (value < MIN_MAKER_FEE) {
        setMakerFeeError(
          `Maker fee must be at least ${MIN_MAKER_FEE / 10} bps`
        );
        return false;
      } else if (value > MAX_FEE) {
        setMakerFeeError(`Maker fee cannot exceed ${MAX_FEE / 10} bps`);
        return false;
      } else {
        setMakerFeeError(null);
        return true;
      }
    } else if (type === "taker") {
      if (value < MIN_TAKER_FEE) {
        setTakerFeeError(
          `Taker fee must be at least ${MIN_TAKER_FEE / 10} bps`
        );
        return false;
      } else if (value > MAX_FEE) {
        setTakerFeeError(`Taker fee cannot exceed ${MAX_FEE / 10} bps`);
        return false;
      } else {
        setTakerFeeError(null);
        return true;
      }
    } else if (type === "rwaMaker") {
      if (value < MIN_RWA_MAKER_FEE) {
        setRwaMakerFeeError(
          `RWA Maker fee must be at least ${MIN_RWA_MAKER_FEE / 10} bps`
        );
        return false;
      } else if (value > MAX_RWA_FEE) {
        setRwaMakerFeeError(
          `RWA Maker fee cannot exceed ${MAX_RWA_FEE / 10} bps`
        );
        return false;
      } else {
        setRwaMakerFeeError(null);
        return true;
      }
    } else {
      if (value < MIN_RWA_TAKER_FEE) {
        setRwaTakerFeeError(
          `RWA Taker fee must be at least ${MIN_RWA_TAKER_FEE / 10} bps`
        );
        return false;
      } else if (value > MAX_RWA_FEE) {
        setRwaTakerFeeError(
          `RWA Taker fee cannot exceed ${MAX_RWA_FEE / 10} bps`
        );
        return false;
      } else {
        setRwaTakerFeeError(null);
        return true;
      }
    }
  };

  const handleMakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setMakerFee(0);
      setMakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (value.includes(".") && value.split(".")[1].length > 1) {
      setMakerFeeError("Please enter only one decimal place (e.g., 3.5)");
      return;
    }

    const internalValue = bpsValue * 10;
    setMakerFee(internalValue);
    validateFees("maker", internalValue);

    if (onFeesChange) {
      onFeesChange(internalValue, takerFee, rwaMakerFee, rwaTakerFee);
    }
  };

  const handleTakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setTakerFee(0);
      setTakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (value.includes(".") && value.split(".")[1].length > 1) {
      setTakerFeeError("Please enter only one decimal place (e.g., 6.5)");
      return;
    }

    const internalValue = bpsValue * 10;
    setTakerFee(internalValue);
    validateFees("taker", internalValue);

    if (onFeesChange) {
      onFeesChange(makerFee, internalValue, rwaMakerFee, rwaTakerFee);
    }
  };

  const handleMakerFeeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setMakerFee(0);
      setMakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (!(value.includes(".") && value.split(".")[1].length > 1)) {
      const internalValue = bpsValue * 10;
      setMakerFee(internalValue);
      validateFees("maker", internalValue);
    }
  };

  const handleTakerFeeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setTakerFee(0);
      setTakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (!(value.includes(".") && value.split(".")[1].length > 1)) {
      const internalValue = bpsValue * 10;
      setTakerFee(internalValue);
      validateFees("taker", internalValue);
    }
  };

  const handleRwaMakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setRwaMakerFee(0);
      setRwaMakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (value.includes(".") && value.split(".")[1].length > 1) {
      setRwaMakerFeeError("Please enter only one decimal place (e.g., 3.5)");
      return;
    }

    const internalValue = bpsValue * 10;
    setRwaMakerFee(internalValue);
    validateFees("rwaMaker", internalValue);

    if (onFeesChange) {
      onFeesChange(makerFee, takerFee, internalValue, rwaTakerFee);
    }
  };

  const handleRwaTakerFeeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setRwaTakerFee(0);
      setRwaTakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (value.includes(".") && value.split(".")[1].length > 1) {
      setRwaTakerFeeError("Please enter only one decimal place (e.g., 5.0)");
      return;
    }

    const internalValue = bpsValue * 10;
    setRwaTakerFee(internalValue);
    validateFees("rwaTaker", internalValue);

    if (onFeesChange) {
      onFeesChange(makerFee, takerFee, rwaMakerFee, internalValue);
    }
  };

  const handleRwaMakerFeeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setRwaMakerFee(0);
      setRwaMakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (!(value.includes(".") && value.split(".")[1].length > 1)) {
      const internalValue = bpsValue * 10;
      setRwaMakerFee(internalValue);
      validateFees("rwaMaker", internalValue);
    }
  };

  const handleRwaTakerFeeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setRwaTakerFee(0);
      setRwaTakerFeeError(null);
      return;
    }

    const bpsValue = parseFloat(value);
    if (isNaN(bpsValue)) {
      return;
    }

    if (!(value.includes(".") && value.split(".")[1].length > 1)) {
      const internalValue = bpsValue * 10;
      setRwaTakerFee(internalValue);
      validateFees("rwaTaker", internalValue);
    }
  };

  const handleSaveFees = async (e: FormEvent) => {
    e.preventDefault();
    setFeeError(null);

    if (
      makerFeeError ||
      takerFeeError ||
      rwaMakerFeeError ||
      rwaTakerFeeError
    ) {
      setFeeError("Please correct the errors before saving");
      return;
    }

    const isMakerValid = validateFees("maker", makerFee);
    const isTakerValid = validateFees("taker", takerFee);
    const isRwaMakerValid = validateFees("rwaMaker", rwaMakerFee);
    const isRwaTakerValid = validateFees("rwaTaker", rwaTakerFee);

    if (
      !isMakerValid ||
      !isTakerValid ||
      !isRwaMakerValid ||
      !isRwaTakerValid
    ) {
      setFeeError("Fee values are outside of allowed range");
      return;
    }

    if (useOrderlyApi) {
      if (!hasValidKey || !orderlyKey || !accountId) {
        toast.error("Orderly key required to update fees");
        return;
      }

      setIsUpdatingFees(true);

      try {
        const makerFeeRate = makerFee / 100_000;
        const takerFeeRate = takerFee / 100_000;
        const rwaMakerFeeRate = rwaMakerFee / 100_000;
        const rwaTakerFeeRate = rwaTakerFee / 100_000;

        await updateBrokerFees(
          accountId,
          orderlyKey,
          makerFeeRate,
          takerFeeRate,
          rwaMakerFeeRate,
          rwaTakerFeeRate
        );
        toast.success("Fees updated successfully!");

        try {
          await post("api/graduation/fees/invalidate-cache", {}, token);
        } catch (error) {
          console.error("Error invalidating fee cache:", error);
        }

        if (onFeesChange) {
          onFeesChange(makerFee, takerFee, rwaMakerFee, rwaTakerFee);
        }
      } catch (error) {
        console.error("Error updating fees:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update fees"
        );
      } finally {
        setIsUpdatingFees(false);
      }
    }
  };

  const tierBaseFees = {
    public: { maker: 0, taker: 3.0 },
    silver: { maker: 0, taker: 2.75 },
    gold: { maker: 0, taker: 2.5 },
    platinum: { maker: 0, taker: 2.0 },
    diamond: { maker: 0, taker: 1.0 },
  };

  const tierInfo = {
    public: { name: "Public", requirement: "No requirement", fee: "3.00 bps" },
    silver: {
      name: "Silver",
      requirement: "100K $ORDER or ≥$30M volume",
      fee: "2.75 bps",
    },
    gold: {
      name: "Gold",
      requirement: "250K $ORDER or ≥$90M volume",
      fee: "2.50 bps",
    },
    platinum: {
      name: "Platinum",
      requirement: "2M $ORDER or ≥$1B volume",
      fee: "2.00 bps",
    },
    diamond: {
      name: "Diamond",
      requirement: "7M $ORDER or ≥$10B volume",
      fee: "1.00 bps",
    },
  };

  const calculateRevenue = (
    volume: number,
    makerFee: number,
    takerFee: number,
    tier: keyof typeof tierBaseFees = selectedTier
  ) => {
    const BASE_MAKER_FEE = tierBaseFees[tier].maker;
    const BASE_TAKER_FEE = tierBaseFees[tier].taker;

    const actualMakerFee = Math.max(0, makerFee - BASE_MAKER_FEE);
    const actualTakerFee = Math.max(0, takerFee - BASE_TAKER_FEE);

    const makerVolume = volume * 0.5;
    const takerVolume = volume * 0.5;

    const makerFeePercent = actualMakerFee / 10000;
    const takerFeePercent = actualTakerFee / 10000;

    const makerRevenue = makerVolume * makerFeePercent;
    const takerRevenue = takerVolume * takerFeePercent;

    return {
      makerRevenue,
      takerRevenue,
      totalRevenue: makerRevenue + takerRevenue,
    };
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTradingVolume(isNaN(value) ? 0 : value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      compactDisplay: "short",
      notation: "compact",
    }).format(amount);
  };

  const { makerRevenue, takerRevenue, totalRevenue } = calculateRevenue(
    tradingVolume,
    makerFee / 10,
    takerFee / 10,
    selectedTier
  );

  const handleTierChange = (value: keyof typeof tierBaseFees) => {
    setSelectedTier(value);
  };

  return (
    <div className="space-y-6">
      {/* Fee Configuration Section */}
      <div className="bg-light/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fee Configuration</h3>
          {!readOnly && !alwaysShowConfig && (
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
          )}
        </div>

        {!readOnly && (showFeeConfig || alwaysShowConfig) ? (
          <form onSubmit={handleSaveFees} className="slide-fade-in">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-4">
                Configure the trading fees for your DEX. Maker fees apply to
                limit orders that provide liquidity, while taker fees apply to
                market orders that take liquidity.
              </p>

              <div className="bg-warning/10 rounded-lg p-3 mb-4">
                <div className="text-sm flex items-start gap-2">
                  <span className="i-mdi:alert-circle text-warning w-5 h-5 flex-shrink-0 mt-0.5"></span>
                  <span>
                    <span className="font-medium text-warning">
                      Important Fee Note:
                    </span>{" "}
                    The fees you configure here are the{" "}
                    <span className="underline">total fees</span> that traders
                    will pay. This includes the Orderly base fee (varies by tier
                    - see calculator below).
                    <br />
                    Your revenue will be:{" "}
                    <span className="font-medium">
                      Your Custom Fee - Orderly Base Fee
                    </span>
                    .
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="makerFee"
                    className="block text-sm font-bold mb-1"
                  >
                    Maker Fee (bps)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="makerFee"
                      value={(makerFee / 10).toString()}
                      onChange={handleMakerFeeChange}
                      onBlur={handleMakerFeeBlur}
                      step="0.1"
                      min="0"
                      max="50"
                      className={`w-full px-3 py-2 bg-background-dark border ${makerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      placeholder="0.0"
                    />
                    <span className="ml-2 text-gray-400 text-sm">
                      bps (0.01%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum: {MIN_MAKER_FEE / 10} bps (0.00%), Maximum:{" "}
                    {MAX_FEE / 10} bps ({((MAX_FEE / 10) * 0.01).toFixed(2)}%)
                  </p>
                  {makerFeeError && (
                    <p className="text-xs text-error mt-1">{makerFeeError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="takerFee"
                    className="block text-sm font-bold mb-1"
                  >
                    Taker Fee (bps)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="takerFee"
                      value={(takerFee / 10).toString()}
                      onChange={handleTakerFeeChange}
                      onBlur={handleTakerFeeBlur}
                      step="0.1"
                      min="0"
                      max="50"
                      className={`w-full px-3 py-2 bg-background-dark border ${takerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                      placeholder="0.0"
                    />
                    <span className="ml-2 text-gray-400 text-sm">
                      bps (0.01%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum: {MIN_TAKER_FEE / 10} bps (0.03%), Maximum:{" "}
                    {MAX_FEE / 10} bps ({((MAX_FEE / 10) * 0.01).toFixed(2)}%)
                  </p>
                  {takerFeeError && (
                    <p className="text-xs text-error mt-1">{takerFeeError}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-200">
                  RWA Asset Fees
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Configure separate fees for Real World Asset (RWA) trading.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="rwaMakerFee"
                      className="block text-sm font-bold mb-1"
                    >
                      RWA Maker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="rwaMakerFee"
                        value={(rwaMakerFee / 10).toString()}
                        onChange={handleRwaMakerFeeChange}
                        onBlur={handleRwaMakerFeeBlur}
                        step="0.1"
                        min="0"
                        max="50"
                        className={`w-full px-3 py-2 bg-background-dark border ${rwaMakerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                        placeholder="0.0"
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_RWA_MAKER_FEE / 10} bps (0.00%), Maximum:{" "}
                      {MAX_RWA_FEE / 10} bps (
                      {((MAX_RWA_FEE / 10) * 0.01).toFixed(2)}%)
                    </p>
                    {rwaMakerFeeError && (
                      <p className="text-xs text-error mt-1">
                        {rwaMakerFeeError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="rwaTakerFee"
                      className="block text-sm font-bold mb-1"
                    >
                      RWA Taker Fee (bps)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        id="rwaTakerFee"
                        value={(rwaTakerFee / 10).toString()}
                        onChange={handleRwaTakerFeeChange}
                        onBlur={handleRwaTakerFeeBlur}
                        step="0.1"
                        min="0"
                        max="50"
                        className={`w-full px-3 py-2 bg-background-dark border ${rwaTakerFeeError ? "border-error" : "border-light/10"} rounded-lg`}
                        placeholder="0.0"
                      />
                      <span className="ml-2 text-gray-400 text-sm">
                        bps (0.01%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum: {MIN_RWA_TAKER_FEE / 10} bps (0.00%), Maximum:{" "}
                      {MAX_RWA_FEE / 10} bps (
                      {((MAX_RWA_FEE / 10) * 0.01).toFixed(2)}%)
                    </p>
                    {rwaTakerFeeError && (
                      <p className="text-xs text-error mt-1">
                        {rwaTakerFeeError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {feeError && (
                <div className="mb-4 text-error text-sm">{feeError}</div>
              )}

              <div className="flex items-center gap-2 text-sm bg-info/10 rounded p-3 mb-4">
                <span className="i-mdi:information-outline text-info w-5 h-5 flex-shrink-0"></span>
                <span>
                  Setting competitive fees can attract more traders to your DEX.
                  The fee split you receive will be based on the fees your
                  traders pay.
                </span>
              </div>

              {!readOnly && showSaveButton && (
                <>
                  {useOrderlyApi && !hasValidKey && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <div className="i-mdi:key text-warning w-5 h-5 mt-0.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="text-warning font-medium text-sm mb-1">
                            Orderly Key Required
                          </h4>
                          <p className="text-xs text-gray-400 mb-2">
                            To update fees directly via Orderly API, you need to
                            create an Orderly key first.
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openModal("orderlyKeyLogin", {
                                onSuccess: (newKey: Uint8Array) => {
                                  setOrderlyKey(newKey);
                                },
                                onCancel: () => {},
                                brokerId: brokerId,
                                accountId: accountId,
                              })
                            }
                            className="flex items-center gap-2"
                          >
                            <div className="i-mdi:key-plus w-4 h-4"></div>
                            Create Orderly Key
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingFees || isUpdatingFees}
                    loadingText="Saving..."
                    className="w-full"
                    disabled={
                      !!makerFeeError ||
                      !!takerFeeError ||
                      !!rwaMakerFeeError ||
                      !!rwaTakerFeeError ||
                      (useOrderlyApi && !hasValidKey)
                    }
                  >
                    Save Fee Configuration
                  </Button>
                </>
              )}
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">
                {readOnly ? "Current Fee Structure" : "Current Fee Structure:"}
              </span>
            </div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-400 mb-2">
                Standard Fees
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Maker Fee</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(makerFee / 10)}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({formatNumber((makerFee / 10) * 0.01, 3)}%)
                  </div>
                </div>
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Fee</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(takerFee / 10)}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({formatNumber((takerFee / 10) * 0.01, 3)}%)
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-400 mb-2">
                RWA Asset Fees
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">RWA Maker Fee</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(rwaMakerFee / 10)}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({formatNumber((rwaMakerFee / 10) * 0.01, 3)}%)
                  </div>
                </div>
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">RWA Taker Fee</div>
                  <div className="text-xl font-semibold">
                    {formatNumber(rwaTakerFee / 10)}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      bps
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({formatNumber((rwaTakerFee / 10) * 0.01, 3)}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-info/10 rounded-lg p-3 flex items-start gap-2 text-xs">
              <span className="i-mdi:information-outline text-info w-4 h-4 flex-shrink-0 mt-0.5"></span>
              <span className="text-gray-300">
                <span className="font-medium">Note:</span> These are the total
                fees that traders will pay on your DEX. The Orderly base fee
                varies by tier (Public: 3.00 bps taker, Diamond: 1.00 bps
                taker). Your revenue = Your Custom Fee - Base Fee. Improve your
                tier through the{" "}
                <a
                  href="https://app.orderly.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:underline"
                >
                  Builder Staking Programme
                </a>{" "}
                to reduce the base fee and increase your revenue.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Calculator */}
      <div className="border-t border-light/10 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="i-mdi:calculator mr-2 h-5 w-5 text-success"></span>
            Revenue Calculator
          </h3>
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-primary-light hover:text-primary flex items-center gap-1 text-sm"
          >
            {showCalculator ? "Hide Calculator" : "Show Calculator"}
            <span
              className={`i-mdi:chevron-right w-4 h-4 transition-transform ${showCalculator ? "rotate-90" : ""}`}
            ></span>
          </button>
        </div>

        {showCalculator && (
          <div className="bg-light/5 rounded-lg p-4 mb-4 slide-fade-in">
            <p className="text-sm text-gray-300 mb-4">
              Estimate your potential monthly revenue based on trading volume
              and your current fee configuration.
            </p>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label
                  htmlFor="tradingVolume"
                  className="block text-sm font-bold mb-1"
                >
                  Monthly Trading Volume (USD)
                </label>
                <div className="flex items-center">
                  <span className="bg-background-dark border-r border-light/10 px-3 py-2 rounded-l-lg text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    id="tradingVolume"
                    min="0"
                    step="1000"
                    value={tradingVolume}
                    onChange={handleVolumeChange}
                    className="w-full px-3 py-2 bg-background-dark border border-light/10 rounded-r-lg"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your expected monthly trading volume
                </p>
              </div>

              <div>
                <label
                  htmlFor="tierSelect"
                  className="block text-sm font-bold mb-1"
                >
                  Builder Staking Tier
                </label>
                {/* <select
                  id="tierSelect"
                  value={selectedTier}
                  onChange={e =>
                    handleTierChange(
                      e.target.value as keyof typeof tierBaseFees
                    )
                  }
                  className="w-full h-[42px] px-3 py-2 bg-background-dark border border-light/10 rounded-lg"
                >
                  {Object.entries(tierInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.name} ({info.fee})
                    </option>
                  ))}
                </select> */}
                <Select value={selectedTier} onValueChange={handleTierChange}>
                  <SelectTrigger className="w-full h-[42px] px-3 py-5 bg-background-dark border border-light/10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tierInfo).map(([key, info]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        // className={selectedTier === key ? "bg-primary/10" : ""}
                      >
                        {info.name} ({info.fee})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  {tierInfo[selectedTier].requirement}
                </p>
              </div>
            </div>

            <div className="bg-success/5 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-200">
                Estimated Monthly Revenue (After Base Fee Deduction)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Maker Revenue</div>
                  <div className="text-xl font-semibold text-success">
                    {formatCurrency(makerRevenue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    (
                    {formatNumber(
                      Math.max(
                        0,
                        makerFee / 10 - tierBaseFees[selectedTier].maker
                      )
                    )}{" "}
                    bps after base fee)
                  </div>
                </div>

                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Revenue</div>
                  <div className="text-xl font-semibold text-success">
                    {formatCurrency(takerRevenue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    (
                    {formatNumber(
                      Math.max(
                        0,
                        takerFee / 10 - tierBaseFees[selectedTier].taker
                      )
                    )}{" "}
                    bps after base fee)
                  </div>
                </div>

                <div className="bg-success/10 p-3 rounded">
                  <div className="text-sm text-gray-300">Total Revenue</div>
                  <div className="text-xl font-semibold text-success">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-300">per month</div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs">
                <span className="i-mdi:information-outline text-info w-4 h-4 flex-shrink-0 mt-0.5"></span>
                <span className="text-gray-300">
                  This calculation assumes an equal split between maker and
                  taker volume. Actual revenue may vary based on market
                  conditions, trading patterns, and fee changes. Revenue shown
                  represents your earnings after the Orderly base fee (
                  {tierBaseFees[selectedTier].maker} bps maker,{" "}
                  {tierBaseFees[selectedTier].taker} bps taker for{" "}
                  {tierInfo[selectedTier].name} tier) is deducted from your
                  custom fees.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
