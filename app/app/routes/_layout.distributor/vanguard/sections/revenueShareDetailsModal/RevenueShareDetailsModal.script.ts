import { useMemo, useState } from "react";
import { useVanguardRevenueShareDetails } from "../../hooks/useVanguard";
import type { RevenueShareDetailsModalUIProps } from "./RevenueShareDetailsModal.ui";

export interface RevenueShareDetailsModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export const useRevenueShareDetailsModalScript = (
  props: RevenueShareDetailsModalProps
): RevenueShareDetailsModalUIProps => {
  const { open, onClose, data } = props;

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: detailsData,
    meta,
    isLoading,
  } = useVanguardRevenueShareDetails(
    open ? data?.revenueShareId : null,
    page,
    pageSize
  );

  const dataSource = useMemo(
    () =>
      detailsData.map((item: any) => ({
        inviteeAddress: item.address,
        brokerId: item.broker_id,
        brokerName: item.broker_name,
        myRevenueShare: item.revenue_share,
        inviteeVolume:
          (item.invitee_taker_volume || 0) + (item.invitee_maker_volume || 0),
        inviteeTakerVolume: item.invitee_taker_volume || 0,
        inviteeMakerVolume: item.invitee_maker_volume || 0,
        inviteeBrokerTier: item.tier,
      })),
    [detailsData]
  );

  const pagination = {
    current: page,
    pageSize,
    total: meta?.total || 0,
    onPageChange: setPage,
  };

  return {
    open,
    onClose,
    data,
    dataSource,
    isLoading,
    pagination,
  };
};
