import { useAccount } from "wagmi";
import { Button } from "./Button";
import { useModal } from "../context/ModalContext";

interface SwapFeeWithdrawalProps {
  isGraduated: boolean;
}

export function SwapFeeWithdrawal({ isGraduated }: SwapFeeWithdrawalProps) {
  const { address } = useAccount();
  const { openModal } = useModal();

  if (!isGraduated) {
    return null;
  }

  return (
    <div className="bg-blue-500/10 rounded-lg p-5 mb-6 border border-blue-500/20 text-left">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <div className="i-mdi:swap-horizontal text-blue-400 mr-2 h-5 w-5"></div>
        Swap Fee Revenue (WOOFi)
      </h3>
      <p className="text-sm text-gray-300 mb-4">
        Claim your accumulated swap fees from the WOOFi integration. Fees are
        earned from users swapping tokens on your DEX's swap page.
      </p>

      <Button
        onClick={() => openModal("swapFeeWithdrawal", { address })}
        variant="primary"
        className="w-full"
        disabled={!address}
      >
        <span className="flex items-center justify-center w-full gap-2">
          <div className="i-mdi:cash-multiple h-4 w-4"></div>
          View & Claim Swap Fees
        </span>
      </Button>

      {!address && (
        <p className="text-xs text-warning text-center mt-2">
          Please connect your wallet to view and claim fees
        </p>
      )}
    </div>
  );
}
