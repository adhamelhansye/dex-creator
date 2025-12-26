import { signedRequest } from "./signedRequest";

type CreateBrokerData = {
  broker_id: string;
  broker_name: string;
  address: string;
  chain_id?: number;
  chain_type?: "EVM" | "SOL";
  default_maker_fee_rate: number;
  default_taker_fee_rate: number;
  default_rwa_maker_fee_rate: number;
  default_rwa_taker_fee_rate: number;
};

export async function createBroker(data: CreateBrokerData) {
  return signedRequest({
    url: "/v1/orderly_one/broker",
    method: "POST",
    data,
  });
}
