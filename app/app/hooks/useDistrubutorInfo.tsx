import { useSearchParams } from "@remix-run/react";
import { useQuery } from "../net";

export type DistributorInfo = {
  exist?: boolean;
  distributor_code?: string;
  distributor_id?: string;
  distributor_name?: string;
};

export const useDistributorCode = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get("distributor_code");
};

export const useDistributorInfoByUrl = () => {
  const distributor_code = useDistributorCode();

  const { data } = useQuery<DistributorInfo>(
    distributor_code
      ? `/v1/orderly_one/vanguard/verify_code?distributor_code=${distributor_code}`
      : null
  );

  return {
    distributor_code,
    ...data,
  } as DistributorInfo;
};

export const useDistributorInfoByAddress = (address?: string) => {
  const { data } = useQuery<DistributorInfo>(
    address ? `/v1/orderly_one/vanguard/check?address=${address}` : null
  );

  return data;
};
