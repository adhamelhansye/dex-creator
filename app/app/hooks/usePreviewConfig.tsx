import { useState, useEffect } from "react";
import { NetworkId } from "@orderly.network/types";
import { previewConfig } from "../utils/config";
import { FooterProps, MainNavWidgetProps } from "@orderly.network/ui-scaffold";
import { TradingPageProps } from "@orderly.network/trading";
import { AppLogos } from "@orderly.network/react-app";
import { extractFontValues } from "../utils/cssParser";

export const DEX_PREVIEW_CONFIG_KEY = "dex-preview-config";

const DEMO_BROKER_ID = "demo";

export interface DexPreviewConfig {
  brokerId: string;
  brokerName: string;
  networkId: NetworkId;
  initialSymbol: string;
  mainNavProps: MainNavWidgetProps;
  footerProps: FooterProps;
  tradingViewConfig: TradingPageProps["tradingViewConfig"];
  sharePnLConfig: TradingPageProps["sharePnLConfig"];
  appIcons: AppLogos;
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  favicon?: string | null;
  customStyles?: string;
  fontFamily?: string;
  fontSize?: string;
}

/**
 * Custom hook for managing the DEX preview configuration
 *
 * This hook handles:
 * - Reading configuration from localStorage
 * - Updating configuration when props change
 * - Safely persisting configuration to localStorage
 * - Converting Blob objects to object URLs for preview usage
 */
export function usePreviewConfig(
  brokerName: string,
  networkId: NetworkId = "testnet",
  initialSymbol: string = "PERP_BTC_USDC",
  primaryLogo?: Blob | null,
  secondaryLogo?: Blob | null,
  themeCSS?: string | null,
  pnlPosters?: (Blob | null)[]
) {
  const [configUpdated, setConfigUpdated] = useState(false);

  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string | null>(null);
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string | null>(null);
  const [pnlPosterUrls, setPnlPosterUrls] = useState<string[]>([]);

  useEffect(() => {
    if (primaryLogoUrl) {
      URL.revokeObjectURL(primaryLogoUrl);
    }

    if (primaryLogo) {
      const url = URL.createObjectURL(primaryLogo);
      setPrimaryLogoUrl(url);
    } else {
      setPrimaryLogoUrl(null);
    }

    return () => {
      if (primaryLogoUrl) {
        URL.revokeObjectURL(primaryLogoUrl);
      }
    };
  }, [primaryLogo]);

  useEffect(() => {
    if (secondaryLogoUrl) {
      URL.revokeObjectURL(secondaryLogoUrl);
    }

    if (secondaryLogo) {
      const url = URL.createObjectURL(secondaryLogo);
      setSecondaryLogoUrl(url);
    } else {
      setSecondaryLogoUrl(null);
    }

    return () => {
      if (secondaryLogoUrl) {
        URL.revokeObjectURL(secondaryLogoUrl);
      }
    };
  }, [secondaryLogo]);

  useEffect(() => {
    pnlPosterUrls.forEach(url => URL.revokeObjectURL(url));

    if (pnlPosters && pnlPosters.length > 0) {
      const urls = pnlPosters
        .filter(Boolean)
        .map(poster => URL.createObjectURL(poster as Blob));
      setPnlPosterUrls(urls);
    } else {
      setPnlPosterUrls([]);
    }

    return () => {
      pnlPosterUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [pnlPosters]);

  const appIcons = { ...previewConfig.orderlyAppProvider.appIcons };

  if (primaryLogoUrl) {
    appIcons.main = {
      img: primaryLogoUrl,
    };
  }

  if (secondaryLogoUrl) {
    appIcons.secondary = {
      img: secondaryLogoUrl,
    };
  }

  const sharePnLConfig = { ...previewConfig.tradingPage.sharePnLConfig };
  if (pnlPosterUrls.length > 0) {
    sharePnLConfig.backgroundImages = pnlPosterUrls;
  }

  const { fontFamily, fontSize } = extractFontValues(themeCSS || null);

  const currentConfig: DexPreviewConfig = {
    brokerId: DEMO_BROKER_ID,
    brokerName,
    networkId,
    initialSymbol,
    mainNavProps: previewConfig.scaffold.mainNavProps,
    footerProps: previewConfig.scaffold.footerProps,
    tradingViewConfig: previewConfig.tradingPage.tradingViewConfig,
    sharePnLConfig,
    appIcons,
    primaryLogo: primaryLogoUrl,
    secondaryLogo: secondaryLogoUrl,
    customStyles: themeCSS || undefined,
    fontFamily,
    fontSize,
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        DEX_PREVIEW_CONFIG_KEY,
        JSON.stringify(currentConfig)
      );
      setConfigUpdated(true);
    } catch (error) {
      console.error("Failed to store preview config in localStorage:", error);
      setConfigUpdated(false);
    }
  }, [
    brokerName,
    networkId,
    initialSymbol,
    primaryLogoUrl,
    secondaryLogoUrl,
    themeCSS,
    pnlPosterUrls,
    fontFamily,
    fontSize,
  ]);

  const getStoredConfig = (): DexPreviewConfig | null => {
    try {
      const storedConfig = localStorage.getItem(DEX_PREVIEW_CONFIG_KEY);
      return storedConfig ? JSON.parse(storedConfig) : null;
    } catch (error) {
      console.error("Failed to read preview config from localStorage:", error);
      return null;
    }
  };

  const updateConfig = (updates: Partial<DexPreviewConfig>) => {
    try {
      const currentStored = getStoredConfig() || currentConfig;
      const updatedConfig = { ...currentStored, ...updates };
      localStorage.setItem(
        DEX_PREVIEW_CONFIG_KEY,
        JSON.stringify(updatedConfig)
      );
      setConfigUpdated(true);
      return true;
    } catch (error) {
      console.error("Failed to update preview config:", error);
      setConfigUpdated(false);
      return false;
    }
  };

  return {
    currentConfig,
    configUpdated,
    getStoredConfig,
    updateConfig,
  };
}

export default usePreviewConfig;
