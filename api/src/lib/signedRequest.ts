import { getOrderlyApiBaseUrl } from "../utils/orderly";
import { getSignature } from "./sign";
import { getSecret } from "./secretManager";

type SignedRequestOptions = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: any;
};

/**
 * send signed request to Orderly API (with broker creation permission)
 */
export async function signedRequest<T = any>(
  options: SignedRequestOptions
): Promise<T> {
  const { url, method = "POST", data } = options;

  const accountId = await getSecret("creatorBrokerApiAccountId");
  const secretKey = await getSecret("creatorBrokerApiSecretKey");

  const fullUrl = `${getOrderlyApiBaseUrl()}${url}`;

  const payload = {
    url: url,
    method,
    data,
  };

  const signature = await getSignature(
    accountId,
    // remove ed25519: prefix from secret key
    secretKey?.replace("ed25519:", ""),
    payload
  );

  const response = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...signature,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}
