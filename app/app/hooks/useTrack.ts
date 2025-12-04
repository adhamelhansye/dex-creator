import { useCallback } from "react";

export enum TrackerEventName {}

export const useTrack = () => {
  const setUserId = useCallback((userId: string) => {
    // @ts-ignore
    if (window.gtag) {
      // @ts-ignore
      window.gtag("set", { user_id: userId });
      // @ts-ignore
      window.gtag("event", "connect_wallet_success", {
        address: `addr_${userId}`,
      });
    }
  }, []);

  const identify = useCallback((properties: Record<string, unknown>) => {
    // @ts-ignore
    if (window.gtag) {
      // @ts-ignore
      window.gtag("set", { user_properties: properties });
    }
  }, []);

  const track = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      // @ts-ignore
      if (window.gtag) {
        // @ts-ignore
        window.gtag("event", eventName, properties);
      }
    },
    []
  );

  return {
    setUserId,
    identify,
    track,
  };
};
