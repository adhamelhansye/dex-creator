import useSWR from "swr";
import type { SWRHook, SWRResponse } from "swr";
import { fetcher, useQueryOptions } from "./fetch";
import { signatureMiddleware } from "./signatureMiddleware";
import { useOrderlyKey } from "../context/OrderlyKeyContext";

/**
 * usePrivateQuery
 * @description for private api
 * @param query
 * @param options
 */
export const usePrivateQuery = <T>(
  query: Parameters<SWRHook>[0],
  options?: useQueryOptions<T>
): SWRResponse<T> => {
  const { formatter, ...swrOptions } = options || {};
  const middleware = Array.isArray(options?.use) ? (options?.use ?? []) : [];
  const { accountId, orderlyKey } = useOrderlyKey();

  return useSWR<T>(
    () =>
      query && accountId && orderlyKey ? [query, accountId, orderlyKey] : null,
    (url: string, init: RequestInit) => {
      return fetcher(url, init, { formatter });
    },
    {
      ...swrOptions,
      use: [signatureMiddleware, ...middleware],
    }
  );
};
