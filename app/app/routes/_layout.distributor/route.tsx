import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { CompleteAmbassadorProfile } from "./CompleteAmbassadorProfile";
import { CreateDistributorProfile } from "./CreateDistributorProfile";
import { VanguardDistributorProgramme } from "./VanguardDistributorProgramme";
import { useAccount } from "wagmi";
import { useDex } from "../../context/DexContext";
import { useDistributorInfoByAddress } from "../../hooks/useDistrubutorInfo";
import { useAmbassadorInfo } from "../../hooks/useAmbassadorInfo";
import { useAccountInfo } from "../../hooks/useAccountInfo";
import CompleteBuilderProfile from "./CompleteBuilderProfile";
import { useOrderlyKey } from "../../context/OrderlyKeyContext";
import { OrderlyKeyCard } from "./components/OrderlyKeyCard";
import { DistributorHeader } from "./components/DistributorHeader";

export const AMBASSADOR_BROKER_ID = "ambassador";

export default function DistributorRoute() {
  const { isAuthenticated } = useAuth();
  const { address } = useAccount();
  const { dexData, setBrokerId } = useDex();

  const { hasValidKey } = useOrderlyKey();

  const [accountId, setAccountId] = useState<string | null>(null);

  const {
    data: ambassadorInfo,
    isLoading: isLoadingAmbassadorInfo,
    mutate: refetchAmbassadorInfo,
  } = useAmbassadorInfo();

  const { data: accountInfo, isLoading: isLoadingAccountInfo } = useAccountInfo(
    address!,
    AMBASSADOR_BROKER_ID
  );

  const { data: distributorInfo, isLoading: isLoadingDistributorInfo } =
    useDistributorInfoByAddress(address);

  const isAmbassador = !!accountInfo?.account_id;

  const ambassadorCompleted =
    isAmbassador && !!ambassadorInfo?.distributor_name;

  const isBuilder = !!dexData || !!distributorInfo?.exist;

  const builderCompleted = isBuilder && !!dexData?.isGraduated;

  useEffect(() => {
    if (accountInfo) {
      setAccountId(accountInfo.account_id);
      setBrokerId(AMBASSADOR_BROKER_ID);
    }
  }, [accountInfo]);

  const hasNoData = !ambassadorInfo && !accountInfo && !distributorInfo;

  const isInitialLoading =
    hasNoData &&
    (isLoadingAccountInfo ||
      isLoadingDistributorInfo ||
      isLoadingAmbassadorInfo);

  if (!isAuthenticated) {
    return <VanguardDistributorProgramme />;
  }

  if (isInitialLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="i-svg-spinners:pulse-rings-multiple h-20 w-20 text-primary-light"></div>
      </div>
    );
  }

  if (ambassadorCompleted || builderCompleted) {
    if (!hasValidKey) {
      return (
        <div className="mt-15 md:mt-30 pb-52 max-w-6xl mx-auto flex flex-col gap-10 px-4 md:px-8 ">
          <DistributorHeader title="Create key to manage your distributor profile" />
          <OrderlyKeyCard
            brokerId={AMBASSADOR_BROKER_ID}
            accountId={accountId!}
          />
        </div>
      );
    }

    // TODO: show my distributor profile if already configured
    return null;
  }

  if (isBuilder) {
    return (
      <CompleteBuilderProfile
        accountId={accountId!}
        brokerId={AMBASSADOR_BROKER_ID}
      />
    );
  }

  if (isAmbassador) {
    return (
      <CompleteAmbassadorProfile
        brokerId={AMBASSADOR_BROKER_ID}
        accountId={accountId!}
        onSuccess={() => {
          refetchAmbassadorInfo();
        }}
      />
    );
  }

  return (
    <CreateDistributorProfile
      brokerId={AMBASSADOR_BROKER_ID}
      onSuccess={setAccountId}
    />
  );
}
