import { useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";

function getAPIKey() {
  // prod
  if (window.location.hostname === "dex.orderly.network") {
    return "8e088e6174788d221d1a0bab0801368b";
  }
  return "1b2249563abccd42534b72d6692de944";
}

export const useInitAmplitude = () => {
  useEffect(() => {
    // Initialize Amplitude Analytics
    // only capture page views and element clicks
    amplitude.init(getAPIKey(), {
      autocapture: {
        pageViews: true,
        elementInteractions: true,
        attribution: false,
        fileDownloads: false,
        formInteractions: false,
        sessions: false,
        networkTracking: false,
        webVitals: false,
        frustrationInteractions: false,
      },
    });
  }, []);
};
