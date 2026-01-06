import { PointCampaign, PointCampaignStatus } from "~/types/points";

// Ready to go
// Status = Published
// Current Time < Start Time

// Ongoing:
// Status = Published
// Current Time ≥ Start Time
// Current Time < End Time OR End Time is TBD

// Ended:
// Current Time ≥ End Time
export function getPointCampaignStatus(record: PointCampaign) {
  const { start_time, end_time } = record;

  const startTime = start_time * 1000;
  const endTime = end_time ? end_time * 1000 : undefined;

  return getStatusByTime(startTime, endTime);
}

export function getStatusByTime(startTime: number, endTime?: number) {
  const currentTime = Date.now();

  if (currentTime < startTime) {
    return PointCampaignStatus.ReadyToGo;
  }

  if (currentTime >= startTime) {
    if (!endTime) {
      return PointCampaignStatus.Ongoing;
    }

    if (currentTime < endTime) {
      return PointCampaignStatus.Ongoing;
    }

    if (currentTime >= endTime) {
      return PointCampaignStatus.Ended;
    }
  }

  return PointCampaignStatus.Ended;
}
