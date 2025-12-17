import { useDex } from "../../../context/DexContext";
import { CreateDexButton } from "./CreateDexButton";
import { StepCard } from "./StepCard";
import { SuccessStepCard } from "./SuccessStepCard";

export const DexCreationCard = () => {
  const { dexData } = useDex();

  if (dexData) {
    return <SuccessStepCard title="DEX creation" value={dexData.brokerName} />;
  }

  return (
    <StepCard
      title="DEX creation"
      description="Create your own DEX as a builder. You will be directed to the configuration page to complete the setup."
      action={<CreateDexButton />}
    />
  );
};
