import { useState, useEffect } from "react";
import { Button } from "./Button";

interface SwapFeeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feeBps: number) => void;
  currentFeeBps: number | null;
}

export default function SwapFeeConfigModal({
  isOpen,
  onClose,
  onSave,
  currentFeeBps,
}: SwapFeeConfigModalProps) {
  const [feeBps, setFeeBps] = useState<string>(
    currentFeeBps !== null ? String(currentFeeBps) : ""
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFeeBps(currentFeeBps !== null ? String(currentFeeBps) : "");
      setError(null);
    }
  }, [isOpen, currentFeeBps]);

  const parsedFee = feeBps.trim() !== "" ? parseInt(feeBps, 10) : null;
  const feePercentage = parsedFee !== null ? parsedFee / 100 : null;
  const userEarnings =
    feePercentage !== null ? (feePercentage * 0.7).toFixed(3) : null;
  const woofiShare =
    feePercentage !== null ? (feePercentage * 0.3).toFixed(3) : null;

  const handleSave = () => {
    if (feeBps.trim() === "") {
      setError("Swap fee is required when Swap page is enabled");
      return;
    }

    const parsed = parseInt(feeBps, 10);
    if (isNaN(parsed)) {
      setError("Please enter a valid number");
      return;
    }

    if (parsed < 0 || parsed > 100) {
      setError("Fee must be between 0 and 100 bps (maximum 1%)");
      return;
    }

    onSave(parsed);
    onClose();
  };

  const handleInputChange = (value: string) => {
    setFeeBps(value);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen md:p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={onClose}
      ></div>

      <div className="relative z-[1002] w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto p-6 md:rounded-xl bg-background-light border-0 md:border md:border-primary-light/20 shadow-2xl slide-fade-in">
        <div className="text-center mb-6">
          <div className="bg-blue-500/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="i-mdi:swap-horizontal text-blue-400 w-8 h-8"></div>
          </div>
          <h2 className="text-xl font-bold mb-2 gradient-text">
            Configure Swap Fee
          </h2>
          <p className="text-gray-300 text-sm">
            Set up your fee for the WOOFi-powered swap integration
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label htmlFor="swapFeeBps" className="block text-sm font-medium">
              Swap Fee (in basis points)
              <span className="text-danger ml-1">*</span>
            </label>
            <input
              type="number"
              id="swapFeeBps"
              value={feeBps}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="e.g., 20 (0.2%)"
              min="0"
              max="100"
              step="1"
              className={`w-full px-3 py-2 bg-background-card border rounded-lg text-sm focus:ring-1 ${
                error
                  ? "border-danger focus:border-danger focus:ring-danger/50"
                  : "border-light/10 focus:border-primary/50 focus:ring-primary/50"
              }`}
            />
            <p className="text-xs text-gray-400">
              Enter fee in basis points (bps). Maximum: 100 bps (1%). Example:
              20 bps = 0.2%
            </p>
            {error && (
              <p className="text-xs text-danger flex items-center gap-1">
                <div className="i-mdi:alert-circle w-3 h-3"></div>
                {error}
              </p>
            )}
          </div>

          {parsedFee !== null && !error && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 slide-fade-in">
              <div className="text-sm font-medium text-primary-light mb-2">
                Fee Breakdown:
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total swap fee:</span>
                  <span className="font-mono text-white">{feePercentage}%</span>
                </div>
                <div className="border-t border-light/10 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Your earnings (70%):</span>
                  <span className="font-mono text-success">
                    {userEarnings}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">WooFi share (30%):</span>
                  <span className="font-mono text-gray-400">{woofiShare}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="i-mdi:information-outline h-5 w-5 text-blue-300 mt-0.5"></div>
            <div>
              <h4 className="text-sm font-bold text-blue-300 mb-2">
                About Swap Integration
              </h4>
              <div className="text-xs text-gray-300 space-y-2">
                <p>
                  The Swap page is powered by{" "}
                  <span className="text-blue-300 font-medium">WOOFi</span>,
                  providing efficient token swapping with competitive rates and
                  deep liquidity.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>EVM only:</strong> Swap supports EVM chains only (no
                    Solana)
                  </li>
                  <li>
                    <strong>Fixed blockchain support:</strong> Blockchain
                    configuration doesn't affect the Swap page
                  </li>
                  <li>
                    <strong>Fee split:</strong> Fees are shared 70% (you) / 30%
                    (WOOFi)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Graduation and Fee Claiming Information */}
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="i-mdi:alert-outline h-5 w-5 text-warning mt-0.5 flex-shrink-0"></div>
            <div>
              <h4 className="text-sm font-medium text-warning mb-2">
                Important: Graduation & Fee Claiming
              </h4>
              <div className="text-xs text-gray-300 space-y-2">
                <p>
                  <strong className="text-warning">Graduation Required:</strong>{" "}
                  Your DEX must be graduated before you can earn swap fees.
                  After graduation, it may take <strong>up to 24 hours</strong>{" "}
                  for the fee system to be fully activated.
                </p>
                <p>
                  <strong className="text-warning">
                    Manual Fee Claiming Required:
                  </strong>{" "}
                  Swap fees are <strong>NOT automatically transferred</strong>{" "}
                  to your wallet. You must manually claim accumulated fees using
                  a claiming process.
                </p>
                <p>
                  <strong className="text-warning">EOA Wallet Only:</strong>{" "}
                  Fees can only be claimed with the <strong>EOA wallet</strong>{" "}
                  you used to initially set up your DEX. Fees will NOT accrue in
                  your admin wallet (which may be a multisig).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
