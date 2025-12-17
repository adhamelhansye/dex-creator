import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  useVanguardSummary,
  useUpdateDistributorCode,
} from "../../hooks/useVanguard";
import { useConfigureDistributorCodeModalScript } from "../configureDistributorCodeModal/ConfigureDistributorCodeModal.script";
import { useDex } from "../../../../../context/DexContext";

export const useOverviewScript = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: summaryData, isLoading, mutate } = useVanguardSummary();
  const { trigger: updateCode } = useUpdateDistributorCode();
  const { brokerId } = useDex();

  const data = useMemo(
    () => ({
      distributorCode: summaryData?.distributor_code || "--",
      historicalRevenueShare: summaryData?.revenue_share_all_time || 0,
      brokerTier: summaryData?.tier || "--",
      distributorUrl: summaryData?.distributor_url || "--",
    }),
    [summaryData]
  );

  const onEditCode = () => {
    setIsModalOpen(true);
  };

  const onModalClose = () => {
    setIsModalOpen(false);
  };

  const onModalSave = async (code: string) => {
    if (!brokerId) {
      toast.error("Broker id not found");
      return;
    }

    try {
      await updateCode({
        broker_id: brokerId,
        distributor_code: code,
      });
      toast.success("Distributor code updated");
      mutate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update distributor code");
      throw e;
    }
  };

  const configureDistributorCodeModalUiProps =
    useConfigureDistributorCodeModalScript({
      open: isModalOpen,
      onClose: onModalClose,
      currentCode: data.distributorCode,
      onSave: onModalSave,
    });

  return {
    data,
    isLoading,
    onEditCode,
    configureDistributorCodeModalUiProps,
  };
};
