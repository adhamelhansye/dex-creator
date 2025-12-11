import { usePrivateQuery } from "../net";

export type AmbassadorInfo = {
  distributor_id: string;
  distributor_name: string;
  tier: string;
  distributor_code: string;
  distributor_url: string;
  revenue_share_last_30_days: number;
  revenue_share_all_time: number;
  tier_assignment_privilege: boolean;
  updated_time: number;
};

export function useAmbassadorInfo() {
  return usePrivateQuery<AmbassadorInfo>("/v1/vanguard/summary", {
    revalidateOnFocus: false,
    /**
     * {"success":false,"code":-1004,"message":"account id not exist"}
     *  when the account may not exist yet, it will throw error, so we don't want to retry
     */
    shouldRetryOnError: false,
  });
}
