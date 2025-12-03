import { getPublicKeyAsync, signAsync } from "@noble/ed25519";
import { encodeBase58 } from "ethers";
import { type MessageFactor } from "@orderly.network/core";

type Inputs = {
  accountId: string;
  orderlyKey: Uint8Array;
  payload: MessageFactor;
};

export async function getSignHeader(inputs: Inputs) {
  const timestamp = Date.now();
  const { accountId, orderlyKey, payload } = inputs;
  const { method, url, data } = payload;

  let message = `${String(timestamp)}${method ?? "POST"}${url}`;
  if (data) {
    message += JSON.stringify(data);
  }

  const encoder = new TextEncoder();
  const orderlySignature = await signAsync(encoder.encode(message), orderlyKey);

  return {
    "orderly-timestamp": `${timestamp}`,
    "orderly-key": `ed25519:${encodeBase58(
      await getPublicKeyAsync(orderlyKey)
    )}`,
    "orderly-signature": base64EncodeURL(orderlySignature),
    "orderly-account-id": accountId,
  };
}

function base64EncodeURL(byteArray: Uint8Array) {
  return btoa(
    Array.from(new Uint8Array(byteArray))
      .map(val => {
        return String.fromCharCode(val);
      })
      .join("")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
