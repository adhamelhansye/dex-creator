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

export interface DexPreviewProps {
  brokerId: string;
  brokerName: string;
  networkId: NetworkId;

  mainNavProps?: MainNavWidgetProps;
  footerProps?: FooterProps;

  initialSymbol?: string;
  tradingViewConfig?: TradingPageProps["tradingViewConfig"];
  sharePnLConfig?: TradingPageProps["sharePnLConfig"];

  appIcons?: AppLogos;

  customStyles?: string;
  fontFamily?: string;
  fontSize?: string;

  className?: string;

  onLoad?: () => void;
}

const DexPreview: FC<DexPreviewProps> = ({
  brokerId,
  brokerName,
  networkId = "testnet",
  mainNavProps = {
    initialMenu: "/",
    mainMenus: [{ name: "Trading", href: "/" }],
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
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);

  const onChainChanged = (
    _chainId: number,
    { isTestnet }: { isTestnet: boolean }
  ) => {
    console.log("Chain changed in preview mode:", _chainId, isTestnet);
  };

  const onRouteChange = (option: RouteOption) => {
    console.log("Route change in preview mode:", option);
  };

  const handleSymbolChange = (data: API.Symbol) => {
    console.log("Symbol changed in preview mode:", data.symbol);
    setCurrentSymbol(data.symbol);
  };

  useEffect(() => {
    setCurrentSymbol(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onLoad) {
        onLoad();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoad]);

  return (
    <div
      className={`relative h-full w-full orderly-app-container orderly-scrollbar bg-[rgb(var(--oui-color-base-7))] text-[rgb(var(--oui-color-base-foreground))] ${className}`}
    >
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
