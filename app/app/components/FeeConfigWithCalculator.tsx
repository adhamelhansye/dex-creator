import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { Button } from "./Button";

const MIN_MAKER_FEE = 0;
const MIN_TAKER_FEE = 3;
const MAX_FEE = 15;

interface FeeConfigWithCalculatorProps {
  makerFee: number;
  takerFee: number;
  readOnly?: boolean;
  isSavingFees?: boolean;
  onSaveFees?: (
    e: FormEvent,
    makerFee: number,
    takerFee: number
  ) => Promise<void>;
  feeError?: string | null;
  defaultOpenCalculator?: boolean;
}

export const FeeConfigWithCalculator: React.FC<
  FeeConfigWithCalculatorProps
> = ({
  makerFee: initialMakerFee,
  takerFee: initialTakerFee,
  readOnly = false,
  isSavingFees = false,
  onSaveFees,
  defaultOpenCalculator = false,
}) => {
  // State for fee configuration
  const [showFeeConfig, setShowFeeConfig] = useState(false);
  const [makerFee, setMakerFee] = useState<number>(initialMakerFee);
  const [takerFee, setTakerFee] = useState<number>(initialTakerFee);
  const [makerFeeError, setMakerFeeError] = useState<string | null>(null);
  const [takerFeeError, setTakerFeeError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  const [showCalculator, setShowCalculator] = useState(defaultOpenCalculator);
  const [tradingVolume, setTradingVolume] = useState(10000000);

  useEffect(() => {
    setMakerFee(initialMakerFee);
    setTakerFee(initialTakerFee);
  }, [initialMakerFee, initialTakerFee]);

  // Fee validation functions
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

  const handleSaveFees = (e: FormEvent) => {
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

    if (onSaveFees) {
      onSaveFees(e, makerFee, takerFee);
    }
  };

  // Revenue calculator functions
  const calculateRevenue = (
    volume: number,
    makerFee: number,
    takerFee: number
  ) => {
    // Orderly base fees (retained by Orderly)
    const BASE_MAKER_FEE = 0; // 0 bps maker fee
    const BASE_TAKER_FEE = 3; // 3 bps taker fee for Public tier

    // Calculate actual revenue fees (custom fee - base fee)
    const actualMakerFee = Math.max(0, makerFee - BASE_MAKER_FEE);
    const actualTakerFee = Math.max(0, takerFee - BASE_TAKER_FEE);

    // Assuming 50/50 split between maker and taker volume
    const makerVolume = volume * 0.5;
    const takerVolume = volume * 0.5;

    // Convert bps to percentage (100 bps = 1%)
    const makerFeePercent = actualMakerFee / 10000;
    const takerFeePercent = actualTakerFee / 10000;

    // Calculate revenue (after base fee deduction)
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

  // Calculate revenue based on current fees
  const { makerRevenue, takerRevenue, totalRevenue } = calculateRevenue(
    tradingVolume,
    makerFee,
    takerFee
  );

  return (
    <div className="space-y-6">
      {/* Fee Configuration Section */}
      <div className="bg-light/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fee Configuration</h3>
          {!readOnly && (
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

        {!readOnly && showFeeConfig ? (
          <form onSubmit={handleSaveFees} className="slide-fade-in">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-4">
                Configure the trading fees for your DEX. Maker fees apply to
                limit orders that provide liquidity, while taker fees apply to
                market orders that take liquidity.
              </p>

              <div className="bg-warning/10 rounded-lg p-3 mb-4">
                <p className="text-sm flex items-start gap-2">
                  <div className="i-mdi:alert-circle text-warning w-5 h-5 flex-shrink-0 mt-0.5"></div>
                  <span>
                    <span className="font-medium text-warning">
                      Important Fee Note:
                    </span>{" "}
                    The fees you configure here are the{" "}
                    <span className="underline">total fees</span> that traders
                    will pay. This includes the Orderly base fee (currently 3.00
                    bps taker, 0 bps maker for Public tier).
                    <br />
                    Your revenue will be:{" "}
                    <span className="font-medium">
                      Your Custom Fee - Orderly Base Fee
                    </span>
                    .
                  </span>
                </p>
              </div>

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
                    Minimum: {MIN_MAKER_FEE} bps (0.00%), Maximum: {MAX_FEE} bps
                    ({(MAX_FEE * 0.01).toFixed(2)}%)
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
                    Minimum: {MIN_TAKER_FEE} bps (0.03%), Maximum: {MAX_FEE} bps
                    ({(MAX_FEE * 0.01).toFixed(2)}%)
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
                  Setting competitive fees can attract more traders to your DEX.
                  The fee split you receive will be based on the fees your
                  traders pay.
                </p>
              </div>

              {!readOnly && (
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-dark/50 p-3 rounded">
                <div className="text-sm text-gray-400">Maker Fee</div>
                <div className="text-xl font-semibold">
                  {makerFee}{" "}
                  <span className="text-sm font-normal text-gray-400">bps</span>
                </div>
                <div className="text-xs text-gray-400">
                  ({(makerFee * 0.01).toFixed(2)}%)
                </div>
              </div>
              <div className="bg-background-dark/50 p-3 rounded">
                <div className="text-sm text-gray-400">Taker Fee</div>
                <div className="text-xl font-semibold">
                  {takerFee}{" "}
                  <span className="text-sm font-normal text-gray-400">bps</span>
                </div>
                <div className="text-xs text-gray-400">
                  ({(takerFee * 0.01).toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="mt-4 bg-info/10 rounded-lg p-3 flex items-start gap-2 text-xs">
              <div className="i-mdi:information-outline text-info w-4 h-4 flex-shrink-0 mt-0.5"></div>
              <p className="text-gray-300">
                <span className="font-medium">Note:</span> These are the total
                fees that traders will pay on your DEX. The Orderly base fee
                (3.00 bps taker for Public tier) is included in these amounts.
                Your revenue = Your Custom Fee - Base Fee. Upgrade your tier
                through the{" "}
                <a
                  href="https://app.orderly.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:underline"
                >
                  Builder Staking Programme
                </a>{" "}
                to reduce the base fee and increase your revenue.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Calculator */}
      <div className="border-t border-light/10 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <div className="i-mdi:calculator mr-2 h-5 w-5 text-success"></div>
            Revenue Calculator
          </h3>
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-primary-light hover:text-primary flex items-center gap-1 text-sm"
          >
            {showCalculator ? "Hide Calculator" : "Show Calculator"}
            <div
              className={`i-mdi:chevron-right w-4 h-4 transition-transform ${showCalculator ? "rotate-90" : ""}`}
            ></div>
          </button>
        </div>

        {showCalculator && (
          <div className="bg-light/5 rounded-lg p-4 mb-4 slide-fade-in">
            <p className="text-sm text-gray-300 mb-4">
              Estimate your potential monthly revenue based on trading volume
              and your current fee configuration.
            </p>

            <div className="mb-4">
              <label
                htmlFor="tradingVolume"
                className="block text-sm font-medium mb-1"
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
                Enter your expected monthly trading volume to see potential
                revenue.
              </p>
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
                    ({Math.max(0, makerFee - 0)} bps after base fee)
                  </div>
                </div>

                <div className="bg-background-dark/50 p-3 rounded">
                  <div className="text-sm text-gray-400">Taker Revenue</div>
                  <div className="text-xl font-semibold text-success">
                    {formatCurrency(takerRevenue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    ({Math.max(0, takerFee - 3)} bps after base fee)
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
                <div className="i-mdi:information-outline text-info w-4 h-4 flex-shrink-0 mt-0.5"></div>
                <p className="text-gray-300">
                  This calculation assumes an equal split between maker and
                  taker volume. Actual revenue may vary based on market
                  conditions, trading patterns, and fee changes. Revenue shown
                  represents your earnings after the Orderly base fee (0 bps
                  maker, 3 bps taker) is deducted from your custom fees.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
