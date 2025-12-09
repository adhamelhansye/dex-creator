import { useCallback } from "react";

export enum TrackerEventName {}

export const useTrack = () => {
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
    identify,
    track,
  };
};
