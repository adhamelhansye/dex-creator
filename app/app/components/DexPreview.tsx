import { FC, useEffect, useState } from "react";
import { WalletConnectorProvider } from "@orderly.network/wallet-connector";
import { OrderlyAppProvider, AppLogos } from "@orderly.network/react-app";
import { Scaffold } from "@orderly.network/ui-scaffold";
import { TradingPage } from "@orderly.network/trading";
import { NetworkId } from "@orderly.network/types";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { API } from "@orderly.network/types";
import type { RouteOption } from "@orderly.network/ui-scaffold";
import type {
  MainNavWidgetProps,
  FooterProps,
} from "@orderly.network/ui-scaffold";
import type { TradingPageProps } from "@orderly.network/trading";

// Types for configuration props
export interface DexPreviewProps {
  // Broker configuration
  brokerId: string;
  brokerName: string;
  networkId: NetworkId;

  // Main nav and footer configuration
  mainNavProps?: MainNavWidgetProps;
  footerProps?: FooterProps;

  // Trading configuration
  initialSymbol?: string;
  tradingViewConfig?: TradingPageProps["tradingViewConfig"];
  sharePnLConfig?: TradingPageProps["sharePnLConfig"];

  // App icons - using the correct AppLogos type from the SDK
  appIcons?: AppLogos;

  // Optional: Custom CSS
  customStyles?: string;

  // Container class name
  className?: string;

  // Callback when the component is loaded
  onLoad?: () => void;
}

/**
 * DexPreview - A component that provides an isolated preview of the DEX using the Orderly SDK
 *
 * This component mounts a fully functional preview of the DEX based on the provided configuration.
 * It mocks navigation and chain change functionality to prevent unwanted side effects.
 */
const DexPreview: FC<DexPreviewProps> = ({
  brokerId,
  brokerName,
  networkId = "testnet",
  mainNavProps = {
    initialMenu: "/",
    mainMenus: [
      { name: "Trading", href: "/" },
      { name: "Portfolio", href: "/portfolio" },
      { name: "Markets", href: "/markets" },
    ],
  },
  footerProps = {
    telegramUrl: "https://orderly.network",
    discordUrl: "https://discord.com/invite/orderlynetwork",
    twitterUrl: "https://twitter.com/OrderlyNetwork",
  },
  initialSymbol = "PERP_BTC_USDC",
  tradingViewConfig = {
    scriptSRC: "/tradingview/charting_library/charting_library.js",
    library_path: "/tradingview/charting_library/",
    customCssUrl: "/tradingview/chart.css",
  },
  sharePnLConfig = {
    backgroundImages: [
      "/pnl/poster_bg_1.png",
      "/pnl/poster_bg_2.png",
      "/pnl/poster_bg_3.png",
      "/pnl/poster_bg_4.png",
    ],
    color: "rgba(255, 255, 255, 0.98)",
    profitColor: "rgba(41, 223, 169, 1)",
    lossColor: "rgba(245, 97, 139, 1)",
    brandColor: "rgba(255, 255, 255, 0.98)",
    refLink: "https://orderly.network",
    refSlogan: "Orderly referral",
  },
  appIcons,
  customStyles,
  className = "",
  onLoad,
}) => {
  // State to track the current symbol
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);

  // For preview purposes, we mock this function
  const onChainChanged = (
    _chainId: number,
    { isTestnet }: { isTestnet: boolean }
  ) => {
    console.log("Chain changed in preview mode:", _chainId, isTestnet);
    // No actual redirect in preview mode
  };

  // For preview, we mock navigation functionality
  const onRouteChange = (option: RouteOption) => {
    console.log("Route change in preview mode:", option);
    // No actual routing in preview mode
  };

  // Symbol change handler
  const handleSymbolChange = (data: API.Symbol) => {
    console.log("Symbol changed in preview mode:", data.symbol);
    setCurrentSymbol(data.symbol);
  };

  // Update currentSymbol if initialSymbol changes
  useEffect(() => {
    setCurrentSymbol(initialSymbol);
  }, [initialSymbol]);

  // Call onLoad callback when component is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onLoad) {
        onLoad();
      }
    }, 1000); // Give the component some time to initialize

    return () => clearTimeout(timer);
  }, [onLoad]);

  return (
    <div
      className={`relative h-full w-full orderly-app-container orderly-scrollbar bg-[rgb(var(--oui-color-base-7))] text-[rgb(var(--oui-color-base-foreground))] ${className}`}
    >
      {/* Add custom styles if provided */}
      {customStyles && (
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      )}

      <WalletConnectorProvider
        solanaInitial={{
          network:
            networkId === "mainnet"
              ? WalletAdapterNetwork.Mainnet
              : WalletAdapterNetwork.Devnet,
        }}
      >
        <OrderlyAppProvider
          brokerId={brokerId}
          brokerName={brokerName}
          networkId={networkId}
          onChainChanged={onChainChanged}
          appIcons={appIcons}
        >
          <Scaffold
            mainNavProps={mainNavProps}
            footerProps={footerProps}
            routerAdapter={{
              onRouteChange,
              currentPath: "/",
            }}
          >
            <TradingPage
              symbol={currentSymbol}
              onSymbolChange={handleSymbolChange}
              tradingViewConfig={tradingViewConfig}
              sharePnLConfig={sharePnLConfig}
            />
          </Scaffold>
        </OrderlyAppProvider>
      </WalletConnectorProvider>
    </div>
  );
};

export default DexPreview;
