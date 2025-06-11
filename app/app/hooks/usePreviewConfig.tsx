import { useState, useEffect } from "react";
import { NetworkId } from "@orderly.network/types";
import config from "../utils/config";
import { FooterProps, MainNavWidgetProps } from "@orderly.network/ui-scaffold";
import { TradingPageProps } from "@orderly.network/trading";
import { AppLogos } from "@orderly.network/react-app";

// Constant key for localStorage
export const DEX_PREVIEW_CONFIG_KEY = "dex-preview-config";

// Hardcoded brokerId for demo
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
}

/**
 * Custom hook for managing the DEX preview configuration
 *
 * This hook handles:
 * - Reading configuration from localStorage
 * - Updating configuration when props change
 * - Safely persisting configuration to localStorage
 */
export function usePreviewConfig(
  brokerName: string,
  networkId: NetworkId = "testnet",
  initialSymbol: string = "PERP_BTC_USDC",
  primaryLogo?: string | null,
  secondaryLogo?: string | null,
  themeCSS?: string | null,
  pnlPosters?: (string | null)[]
) {
  // Local state to track if the config has been updated
  const [configUpdated, setConfigUpdated] = useState(false);

  // Create a custom appIcons config that includes our logos if available
  const appIcons = { ...config.orderlyAppProvider.appIcons };

  if (primaryLogo) {
    appIcons.main = {
      img: primaryLogo,
    };
  }

  if (secondaryLogo) {
    appIcons.secondary = {
      img: secondaryLogo,
    };
  }

  // Create custom sharePnLConfig with custom posters if available
  const sharePnLConfig = { ...config.tradingPage.sharePnLConfig };
  if (pnlPosters && pnlPosters.length > 0) {
    const customBackgrounds = pnlPosters.filter(Boolean) as string[];
    if (customBackgrounds.length > 0) {
      sharePnLConfig.backgroundImages = customBackgrounds;
    }
  }

  // Generate the current configuration
  const currentConfig: DexPreviewConfig = {
    brokerId: DEMO_BROKER_ID,
    brokerName,
    networkId,
    initialSymbol,
    mainNavProps: config.scaffold.mainNavProps,
    footerProps: config.scaffold.footerProps,
    tradingViewConfig: config.tradingPage.tradingViewConfig,
    sharePnLConfig,
    appIcons,
    primaryLogo,
    secondaryLogo,
    customStyles: themeCSS || undefined,
  };

  // Update localStorage whenever the props change
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
    primaryLogo,
    secondaryLogo,
    themeCSS,
    pnlPosters,
  ]);

  // Read the config from localStorage
  const getStoredConfig = (): DexPreviewConfig | null => {
    try {
      const storedConfig = localStorage.getItem(DEX_PREVIEW_CONFIG_KEY);
      return storedConfig ? JSON.parse(storedConfig) : null;
    } catch (error) {
      console.error("Failed to read preview config from localStorage:", error);
      return null;
    }
  };

  // Update a specific config property
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
