export type PointCampaign = {
  stage_id: number;
  epoch_period: number;
  start_time: number;
  end_time: number;
  status: string;
  stage_name: string;
  stage_description: string;
  volume_boost: number;
  pnl_boost: number;
  l1_referral_boost: number;
  l2_referral_boost: number;
};

export type PointCampaignDetail = {
  stage_id: number;
  epoch_period: number;
  stage_name: string;
  stage_description: string;
  start_date: string;
  end_date: string;
  volume_boost: number;
  pnl_boost: number;
  l1_referral_boost: number;
  l2_referral_boost: number;
};
