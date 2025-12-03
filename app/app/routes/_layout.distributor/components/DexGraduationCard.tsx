import { useNavigate } from "@remix-run/react";
import { Button } from "../../../components/Button";
import { ArrowRightIcon } from "./CreateDexButton";
import { StepCard } from "./StepCard";
import { useDex } from "../../../context/DexContext";
import { SuccessStepCard } from "./SuccessStepCard";

export const DexGraduationCard = () => {
  const { dexData } = useDex();
  const navigate = useNavigate();

  const handleGraduate = () => {
    navigate("/dex/graduation");
  };

  if (!dexData) {
    return;
  }

  if (dexData?.isGraduated) {
    return <SuccessStepCard title="DEX graduation" />;
  }

  return (
    <StepCard
      title="DEX graduation"
      description="Your distributor profile will be available after graduating your DEX. Graduate first to qualify automatically."
      action={
        <Button variant="primary" size="md" onClick={handleGraduate}>
          <span>Graduate now</span>
          <ArrowRightIcon />
        </Button>
      }
    />
  );
};
