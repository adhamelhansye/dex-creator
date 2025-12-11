import { createContext, useContext, ReactNode, useEffect } from "react";
import { useAccount } from "wagmi";
import { useDex } from "./DexContext";
import { AmbassadorInfo, useAmbassadorInfo } from "../hooks/useAmbassadorInfo";
import { useAccountInfo } from "../hooks/useAccountInfo";
import {
  DistributorInfo,
  useDistributorInfoByAddress,
} from "../hooks/useDistrubutorInfo";

interface DistributorContextType {
  isInitialLoading: boolean;
  isAmbassador: boolean;
  isBuilder: boolean;
  ambassadorCompleted: boolean;
  builderCompleted: boolean;
  mutateAmbassadorInfo: () => void;
  mutateAccountInfo: () => void;
  mutateDistributorInfo: () => void;
  distributorInfo?: DistributorInfo;
  ambassadorInfo?: AmbassadorInfo;
}

export const AMBASSADOR_BROKER_ID = "ambassador";

export const DistributorContext = createContext<
  DistributorContextType | undefined
>(undefined);

export function DistributorProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { dexData, setBrokerId } = useDex();

  const {
    data: ambassadorInfo,
    isLoading: isLoadingAmbassadorInfo,
    mutate: mutateAmbassadorInfo,
  } = useAmbassadorInfo();

  const {
    data: accountInfo,
    isLoading: isLoadingAccountInfo,
    mutate: mutateAccountInfo,
  } = useAccountInfo(address!, AMBASSADOR_BROKER_ID);

  const {
    data: distributorInfo,
    isLoading: isLoadingDistributorInfo,
    mutate: mutateDistributorInfo,
  } = useDistributorInfoByAddress(address);

  const isAmbassador = !!accountInfo?.account_id;

  const ambassadorCompleted =
    isAmbassador && !!ambassadorInfo?.distributor_name;

  const isBuilder = !!dexData || !!distributorInfo?.exist;

  const builderCompleted = isBuilder && !!dexData?.isGraduated;

  const isInitialLoading =
    isLoadingAccountInfo || isLoadingDistributorInfo || isLoadingAmbassadorInfo;

  useEffect(() => {
    // if account info is not empty, we can set the broker id
    if (accountInfo?.account_id) {
      setBrokerId(AMBASSADOR_BROKER_ID);
    }
  }, [accountInfo]);

  return (
    <DistributorContext.Provider
      value={{
        isInitialLoading,
        isAmbassador,
        ambassadorCompleted,
        isBuilder,
        builderCompleted,
        mutateAmbassadorInfo,
        mutateAccountInfo,
        mutateDistributorInfo,
        distributorInfo,
        ambassadorInfo,
      }}
    >
      {children}
    </DistributorContext.Provider>
  );
}

export function useDistributor() {
  const context = useContext(DistributorContext);
  if (context === undefined) {
    throw new Error("useDistributor must be used within a DistributorProvider");
  }
  return context;
}
