import { useQuery } from "../net";

type AccountInfo = {
  user_id: number;
  account_id: string;
};

export function useAccountInfo(address: string, brokerId: string) {
  return useQuery<AccountInfo>(
    address && brokerId
      ? `/v1/get_account?address=${address}&broker_id=${brokerId}`
      : null,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      /**
       * {"success":false,"code":-1607,"message":"Account not found."}
       * when the account may not exist yet, it will throw error, so we don't want to retry
       */
      shouldRetryOnError: false,
    }
  );
}
