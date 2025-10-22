import * as amplitude from "@amplitude/analytics-browser";
import { useCallback } from "react";

export enum TrackerEventName {}

export const useTrack = () => {
  const setUserId = useCallback((userId: string) => {
    amplitude.setUserId(userId);
  }, []);

  const identify = useCallback((properties: any) => {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value as string);
    });
    amplitude.identify(identify);
  }, []);

  const track = useCallback((eventName: string, properties?: any) => {
    amplitude.track(eventName, properties);
  }, []);

  return {
    setUserId,
    identify,
    track,
  };
};
