import { useEffect, useState } from "react";
import DexPreview from "../components/DexPreview";
import type { DexPreviewProps } from "../components/DexPreview";
import { MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { NetworkId } from "@orderly.network/types";

import "@orderly.network/ui/dist/styles.css";

// Constant key for localStorage - must match the one in PreviewButton
const DEX_PREVIEW_CONFIG_KEY = "dex-preview-config";

// Define Zod schema for the preview configuration
const AppIconSchema = z.object({
  img: z.string(),
  height: z.number().optional(),
  width: z.number().optional(),
});

const AppIconsSchema = z.object({
  main: AppIconSchema.optional(),
  secondary: AppIconSchema.optional(),
});

const PreviewConfigSchema = z.object({
  brokerId: z.string().default("demo"),
  brokerName: z.string().default("Preview DEX"),
  networkId: z.enum(["testnet", "mainnet"]).default("testnet"),
  initialSymbol: z.string().default("PERP_BTC_USDC"),
  mainNavProps: z.any().optional(),
  footerProps: z.any().optional(),
  tradingViewConfig: z.any().optional(),
  sharePnLConfig: z.any().optional(),
  appIcons: AppIconsSchema.optional(),
  primaryLogo: z.string().nullable().optional(),
  secondaryLogo: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  customStyles: z.string().optional(),
});

// Add metadata for the preview page
export const meta: MetaFunction = () => {
  return [
    { title: "DEX Preview - Orderly Network" },
    {
      name: "description",
      content: "Preview of a decentralized exchange based on Orderly Network",
    },
    { name: "robots", content: "noindex" },
  ];
};

export default function PreviewRoute() {
  const [config, setConfig] = useState<DexPreviewProps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get config from localStorage
      const storedConfig = localStorage.getItem(DEX_PREVIEW_CONFIG_KEY);

      if (!storedConfig) {
        setError(
          "No configuration found. Please open the preview from the main application."
        );
        return;
      }

      // Parse the config from localStorage
      const parsedConfig = JSON.parse(storedConfig);

      // Validate with Zod
      try {
        // Validate the configuration using our schema
        const validatedConfig = PreviewConfigSchema.parse(parsedConfig);

        // Apply custom logos if available in the config
        if (validatedConfig.primaryLogo || validatedConfig.secondaryLogo) {
          const customAppIcons = { ...(validatedConfig.appIcons || {}) };

          if (validatedConfig.primaryLogo) {
            customAppIcons.main = {
              img: validatedConfig.primaryLogo,
              ...(customAppIcons.main || {}),
            };
          }

          if (validatedConfig.secondaryLogo) {
            customAppIcons.secondary = {
              img: validatedConfig.secondaryLogo,
              ...(customAppIcons.secondary || {}),
            };
          }

          validatedConfig.appIcons = customAppIcons;
        }

        setConfig(validatedConfig as DexPreviewProps);
      } catch (validationError) {
        console.error("Validation error:", validationError);

        if (validationError instanceof z.ZodError) {
          // Format the validation errors
          const errorMessages = validationError.errors
            .map(err => `${err.path.join(".")}: ${err.message}`)
            .join(", ");

          setError(`Invalid configuration format: ${errorMessages}`);
        } else {
          setError("Invalid configuration format. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error parsing config:", err);
      setError(
        "Invalid configuration format. Please try refreshing the preview."
      );
    }
  }, []); // Run only once on component mount

  // Show loading state while parsing config
  if (!config && !error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-dark text-white">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  // Show error if parsing failed
  if (error || !config) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-dark text-white">
        <div className="text-center p-4">
          <div className="text-error text-3xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Preview Error</h3>
          <p className="text-gray-300">
            {error || "Configuration not available"}
          </p>
        </div>
      </div>
    );
  }

  // At this point, config is guaranteed to be non-null
  // Render just the DexPreview component without any wrapper elements
  return (
    <DexPreview
      brokerId={config.brokerId}
      brokerName={config.brokerName}
      networkId={config.networkId as NetworkId}
      mainNavProps={config.mainNavProps}
      footerProps={config.footerProps}
      initialSymbol={config.initialSymbol}
      tradingViewConfig={config.tradingViewConfig}
      sharePnLConfig={config.sharePnLConfig}
      appIcons={config.appIcons}
      customStyles={config.customStyles}
      className="h-screen w-full"
    />
  );
}
