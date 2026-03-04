import { useNavigate } from "@remix-run/react";
import { Button } from "../../../components/Button";
import { ArrowRightIcon } from "./CreateDexButton";
import { StepCard } from "./StepCard";
import { useDex } from "../../../context/DexContext";
import { SuccessStepCard } from "./SuccessStepCard";
import { useTranslation } from "~/i18n";
import { useLocalizedPath } from "~/utils/localizedRoute";

export const DexGraduationCard = () => {
  const { t } = useTranslation();
  const { dexData } = useDex();
  const navigate = useNavigate();
  const localizedPath = useLocalizedPath();

  const handleGraduate = () => {
    navigate(localizedPath("/dex/graduation"));
  };

  if (!dexData) {
    return;
  }

  if (dexData?.isGraduated) {
    return <SuccessStepCard title={t("distributor.dexGraduation")} />;
  }

  return (
    <StepCard
      title={t("distributor.dexGraduation")}
      description={t("distributor.dexGraduationDesc")}
      action={
        <Button variant="primary" size="md" onClick={handleGraduate}>
          <span>{t("distributor.graduateNow")}</span>
          <ArrowRightIcon />
        </Button>
      }
    />
  );
};
