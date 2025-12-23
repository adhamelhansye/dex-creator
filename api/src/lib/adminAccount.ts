import { signedRequest } from "./signedRequest";

type UpdateAdminAccountData = {
  broker_id: string;
  admin_account_id: string;
};

export async function updateAdminAccount(data: UpdateAdminAccountData) {
  return signedRequest({
    url: "/v1/broker/adminAccount",
    method: "POST",
    data,
  });
}
