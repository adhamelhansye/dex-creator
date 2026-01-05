import { useDex } from "~/context/DexContext";
import { useMutation, usePrivateQuery, useQuery } from "~/net";
import { PointCampaign, PointCampaignDetail } from "~/types/points";

export function usePointsStages() {
  const { brokerId } = useDex();

  return useQuery<PointCampaign[]>(
    brokerId ? `/v1/public/points/stages?broker_id=${brokerId}` : null
  );
}

export function usePointsDetail(stage_id?: number) {
  return usePrivateQuery<PointCampaignDetail>(
    stage_id ? `/v1/admin/points/stage?stage_id=${stage_id}` : null,
    {
      formatter: data => data?.rows?.[0],
    }
  );
}

// create and update points stage
export function useUpdatePointsStage() {
  return useMutation("/v1/admin/points/stage");
}

export function useDeletePointsStage(stage_id?: number) {
  return useMutation(
    stage_id ? `/v1/admin/points/stage?stage_id=${stage_id}` : "",
    "DELETE"
  );
}
