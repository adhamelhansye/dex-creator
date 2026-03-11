import { useInviteesScript } from "./InviteesList.script";
import InviteesListUI from "./InviteesList.ui";

export default function InviteesList() {
  const {
    dataSource,
    pagination,
    isLoading,
    onEditTier,
    minTierModalUiProps,
    canEditTier,
  } = useInviteesScript();

  return (
    <InviteesListUI
      dataSource={dataSource}
      pagination={pagination}
      isLoading={isLoading}
      onEditTier={onEditTier}
      minTierModalUiProps={minTierModalUiProps}
      canEditTier={canEditTier}
    />
  );
}
