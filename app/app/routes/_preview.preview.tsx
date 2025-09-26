import { useEffect, useState, createElement } from "react";
import DexPreview from "../components/DexPreview";
import type { DexPreviewProps } from "../components/DexPreview";
import { MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { NetworkId } from "@orderly.network/types";

import "@orderly.network/ui/dist/styles.css";

const DEX_PREVIEW_CONFIG_KEY = "dex-preview-config";

const AppIconSchema = z
  .object({
    img: z.string().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    component: z.any().optional(),
  })
  .refine(data => data.img || data.component, {
    message: "Either img or component must be provided for an app icon",
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
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
});

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
      const storedConfig = localStorage.getItem(DEX_PREVIEW_CONFIG_KEY);

      if (!storedConfig) {
        setError(
          "No configuration found. Please open the preview from the main application."
        );
        return;
      }

      const parsedConfig = JSON.parse(storedConfig);

      try {
        const validatedConfig = PreviewConfigSchema.parse(parsedConfig);

        if (validatedConfig.primaryLogo || validatedConfig.secondaryLogo) {
          const customAppIcons = { ...(validatedConfig.appIcons || {}) };

          if (validatedConfig.primaryLogo) {
            customAppIcons.main = {
              component: createElement("img", {
                src: validatedConfig.primaryLogo,
                alt: "logo",
                style: { height: "42px" },
              }),
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
  }, []);

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

  const previewCustomStyles = `
    ${config.customStyles || ""}
    
    * {
      font-family: ${config.fontFamily || "'Manrope', sans-serif"} !important;
    }
  `;

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
      customStyles={previewCustomStyles}
      fontFamily={config.fontFamily}
      fontSize={config.fontSize}
      className="h-screen w-full"
    />
  );
}
