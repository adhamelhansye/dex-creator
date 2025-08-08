import { TradingPageProps } from "@orderly.network/trading";
import { FooterProps, MainNavWidgetProps } from "@orderly.network/ui-scaffold";
import { AppLogos } from "@orderly.network/react-app";

import {
  type Environment,
  type ChainName,
  type ChainConfig,
  ALL_CHAINS,
} from "../../../config";

export type OrderlyConfig = {
  orderlyAppProvider: {
    appIcons: AppLogos;
  };
  scaffold: {
    mainNavProps: MainNavWidgetProps;
    footerProps: FooterProps;
  };
  tradingPage: {
    tradingViewConfig: TradingPageProps["tradingViewConfig"];
    sharePnLConfig: TradingPageProps["sharePnLConfig"];
  };
};

export const previewConfig: OrderlyConfig = {
  scaffold: {
    mainNavProps: {
      initialMenu: "/",
      mainMenus: [{ name: "Trading", href: "/" }],
    },
    footerProps: {
      telegramUrl: "https://orderly.network",
      discordUrl: "https://discord.com/invite/orderlynetwork",
      twitterUrl: "https://twitter.com/OrderlyNetwork",
    },
  },
  orderlyAppProvider: {
    appIcons: {
      main: {
        img: "/orderly-logo.svg",
      },
      secondary: {
        img: "/orderly-logo-secondary.svg",
      },
    },
  },
  tradingPage: {
    tradingViewConfig: {
      scriptSRC: "/tradingview/charting_library/charting_library.js",
      library_path: "/tradingview/charting_library/",
      customCssUrl: "/tradingview/chart.css",
    },
    sharePnLConfig: {
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
  },
};

export function getCurrentEnvironment(): Environment {
  switch (import.meta.env.VITE_DEPLOYMENT_ENV) {
    case "mainnet":
      return "mainnet";
    case "staging":
      return "staging";
    case "qa":
      return "qa";
    case "dev":
      return "dev";
    default:
      return "dev";
  }
}

export function getSupportedChains(): ChainConfig[] {
  const deploymentEnv = getCurrentEnvironment();
  const isTestnet =
    deploymentEnv === "staging" ||
    deploymentEnv === "qa" ||
    deploymentEnv === "dev";
  return Object.values(ALL_CHAINS).filter(
    chain => chain.isTestnet === isTestnet
  );
}

export function getOrderTokenSupportedChains(): ChainConfig[] {
  const deploymentEnv = getCurrentEnvironment();
  const isTestnet =
    deploymentEnv === "staging" ||
    deploymentEnv === "qa" ||
    deploymentEnv === "dev";

  const supportedChainIds = isTestnet
    ? ["sepolia", "arbitrum-sepolia"]
    : ["ethereum", "arbitrum"];

  return Object.values(ALL_CHAINS).filter(chain =>
    supportedChainIds.includes(chain.id)
  );
}

export function getPreferredChain(selectedChain: ChainName): ChainName {
  const deploymentEnv = getCurrentEnvironment();
  const isTestnet =
    deploymentEnv === "staging" ||
    deploymentEnv === "qa" ||
    deploymentEnv === "dev";

  if (isTestnet) {
    const testnetMap: Record<ChainName, ChainName> = {
      arbitrum: "arbitrum-sepolia",
      ethereum: "sepolia",
      "arbitrum-sepolia": "arbitrum-sepolia",
      sepolia: "sepolia",
      orderlyL2: "orderlyTestnet",
      orderlyTestnet: "orderlyTestnet",
      "solana-devnet": "solana-devnet",
      "solana-mainnet-beta": "solana-devnet",
    };
    return testnetMap[selectedChain] || selectedChain;
  } else {
    const mainnetMap: Record<ChainName, ChainName> = {
      "arbitrum-sepolia": "arbitrum",
      sepolia: "ethereum",
      arbitrum: "arbitrum",
      ethereum: "ethereum",
      orderlyTestnet: "orderlyL2",
      orderlyL2: "orderlyL2",
      "solana-devnet": "solana-mainnet-beta",
      "solana-mainnet-beta": "solana-mainnet-beta",
    };
    return mainnetMap[selectedChain] || selectedChain;
  }
}
