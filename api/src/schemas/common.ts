import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "DEX not found",
    }),
  })
  .openapi({
    description: "Error response",
  });

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Response message",
      example: "Operation completed successfully",
    }),
  })
  .openapi({
    description: "Message response",
  });

export const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the operation was successful",
      example: true,
    }),
    message: z.string().optional().openapi({
      description: "Optional response message",
      example: "Operation completed successfully",
    }),
  })
  .openapi({
    description: "Success response",
  });

export const PaginationSchema = z
  .object({
    total: z.number().int().openapi({
      description: "Total number of items",
      example: 100,
    }),
    limit: z.number().int().openapi({
      description: "Number of items per page",
      example: 20,
    }),
    offset: z.number().int().openapi({
      description: "Number of items to skip",
      example: 0,
    }),
  })
  .openapi({
    description: "Pagination metadata",
  });

export const UserSchema = z
  .object({
    id: z.string().openapi({
      description: "User ID",
      example: "abc123def456",
    }),
    address: z.string().openapi({
      description: "Ethereum wallet address",
      example: "0x1234567890123456789012345678901234567890",
    }),
  })
  .openapi({
    description: "User object",
  });

export const DexSchema = z
  .object({
    id: z.string().openapi({
      description: "DEX ID",
      example: "dex123abc",
    }),
    brokerId: z.string().openapi({
      description: "Broker ID",
      example: "demo",
    }),
    brokerName: z.string().openapi({
      description: "Display name for the DEX",
      example: "My DEX",
    }),
    repoUrl: z.string().nullable().openapi({
      description: "GitHub repository URL",
      example: "https://github.com/user/my-dex",
    }),
    customDomain: z.string().nullable().openapi({
      description: "Custom domain for the DEX",
      example: "mydex.com",
    }),
    customDomainOverride: z.string().nullable().openapi({
      description: "Custom domain override URL",
      example: "https://mydex.com",
    }),
    chainIds: z.array(z.number()).openapi({
      description: "Supported chain IDs",
      example: [1, 56, 137],
    }),
    defaultChain: z.number().nullable().openapi({
      description: "Default chain ID",
      example: 1,
    }),
    themeCSS: z.string().nullable().openapi({
      description: "Custom CSS for theming",
    }),
    telegramLink: z.string().nullable().openapi({
      description: "Telegram link",
      example: "https://t.me/mydex",
    }),
    discordLink: z.string().nullable().openapi({
      description: "Discord link",
      example: "https://discord.gg/mydex",
    }),
    xLink: z.string().nullable().openapi({
      description: "X (Twitter) link",
      example: "https://x.com/mydex",
    }),
    walletConnectProjectId: z.string().nullable().openapi({
      description: "WalletConnect project ID",
    }),
    privyAppId: z.string().nullable().openapi({
      description: "Privy app ID",
    }),
    enabledMenus: z.string().nullable().openapi({
      description: "Enabled menu items",
    }),
    customMenus: z.string().nullable().openapi({
      description: "Custom menu configuration",
    }),
    enableAbstractWallet: z.boolean().nullable().openapi({
      description: "Whether Abstract wallet is enabled",
    }),
    disableMainnet: z.boolean().nullable().openapi({
      description: "Whether mainnet is disabled",
    }),
    disableTestnet: z.boolean().nullable().openapi({
      description: "Whether testnet is disabled",
    }),
    disableEvmWallets: z.boolean().nullable().openapi({
      description: "Whether EVM wallets are disabled",
    }),
    disableSolanaWallets: z.boolean().nullable().openapi({
      description: "Whether Solana wallets are disabled",
    }),
    enableServiceDisclaimerDialog: z.boolean().nullable().openapi({
      description: "Whether service disclaimer dialog is enabled",
    }),
    enableCampaigns: z.boolean().nullable().openapi({
      description: "Whether campaigns are enabled",
    }),
    tradingViewColorConfig: z.string().nullable().openapi({
      description: "TradingView color configuration JSON",
    }),
    availableLanguages: z.array(z.string()).openapi({
      description: "Available language codes",
      example: ["en", "zh"],
    }),
    seoSiteName: z.string().nullable().openapi({
      description: "SEO site name",
      example: "My DEX",
    }),
    seoSiteDescription: z.string().nullable().openapi({
      description: "SEO site description",
      example: "A decentralized exchange",
    }),
    seoSiteLanguage: z.string().nullable().openapi({
      description: "SEO site language",
      example: "en",
    }),
    seoSiteLocale: z.string().nullable().openapi({
      description: "SEO site locale",
      example: "en_US",
    }),
    seoTwitterHandle: z.string().nullable().openapi({
      description: "SEO Twitter handle",
      example: "@mydex",
    }),
    seoThemeColor: z.string().nullable().openapi({
      description: "SEO theme color",
      example: "#1a1b23",
    }),
    seoKeywords: z.string().nullable().openapi({
      description: "SEO keywords",
      example: "DEX, trading, crypto",
    }),
    swapFeeBps: z.number().nullable().openapi({
      description: "Swap fee in basis points",
      example: 30,
    }),
    symbolList: z.string().nullable().openapi({
      description: "Symbol list",
    }),
    restrictedRegions: z.string().nullable().openapi({
      description: "Restricted regions",
    }),
    whitelistedIps: z.string().nullable().openapi({
      description: "Whitelisted IPs",
    }),
    description: z.string().nullable().openapi({
      description: "DEX description",
    }),
    banner: z.string().nullable().openapi({
      description: "Banner image URL",
    }),
    logo: z.string().nullable().openapi({
      description: "Logo image URL",
    }),
    tokenAddress: z.string().nullable().openapi({
      description: "Token address",
    }),
    tokenChain: z.string().nullable().openapi({
      description: "Token chain",
    }),
    websiteUrl: z.string().nullable().openapi({
      description: "Website URL",
    }),
    isGraduated: z.boolean().openapi({
      description: "Whether the DEX has graduated",
    }),
    graduationTxHash: z.string().nullable().openapi({
      description: "Graduation transaction hash",
    }),
    multisigChainId: z.number().nullable().openapi({
      description: "Multisig chain ID",
    }),
    showOnBoard: z.boolean().openapi({
      description: "Whether to show on public board",
    }),
    createdAt: z.string().datetime().openapi({
      description: "Creation timestamp",
      example: "2024-01-01T00:00:00Z",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "Last update timestamp",
      example: "2024-01-01T00:00:00Z",
    }),
  })
  .openapi({
    description: "DEX object",
  });

export const RateLimitStatusSchema = z
  .object({
    isRateLimited: z.boolean().openapi({
      description: "Whether the user is currently rate limited",
      example: false,
    }),
    remainingCooldownSeconds: z.number().int().openapi({
      description: "Remaining cooldown time in seconds",
      example: 0,
    }),
    cooldownMinutes: z.number().int().openapi({
      description: "Cooldown period in minutes",
      example: 5,
    }),
    message: z.string().openapi({
      description: "Status message",
      example: "Ready to update your DEX.",
    }),
  })
  .openapi({
    description: "Rate limiting status",
  });
