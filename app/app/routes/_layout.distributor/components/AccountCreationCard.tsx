import { useState } from "react";
import { Button } from "../../../components/Button";
import { useDex } from "../../../context/DexContext";
import { StepCard } from "./StepCard";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { toast } from "react-toastify";
import { parseWalletError } from "../../../utils/wallet";
import { registerAccount } from "../../../utils/orderly";
import { useDistributor } from "../../../context/DistributorContext";
import { SuccessStepCard } from "./SuccessStepCard";

type AccountCreationCardProps = {
  brokerId: string;
  onSuccess: (accountId: string) => void;
};

export const AccountCreationCard = (props: AccountCreationCardProps) => {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { setBrokerId } = useDex();

  const { isAmbassador } = useDistributor();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const provider = new BrowserProvider(walletClient!);
      const signer = await provider.getSigner();

      const res = await registerAccount(
        signer,
        address!,
        chainId || 1,
        props.brokerId
      );
      props.onSuccess(res);
      toast.success("Create account");
      setBrokerId(props.brokerId);
    } catch (error: any) {
      console.error("Error creating account:", error);
      const message = parseWalletError(error) || "Failed to create account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isAmbassador) {
    return <SuccessStepCard title="Account creation" />;
  }

  return (
    <StepCard
      title="Account creation"
      action={
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={loading}
          isLoading={loading}
          className="shrink-0"
        >
          Create account
        </Button>
      }
    />
  );
};
