import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { get } from "../utils/apiClient";

interface DexData {
  id: string;
  brokerName: string;
  brokerId: string;
  preferredBrokerId?: string | null;
  themeCSS?: string | null;
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  favicon?: string | null;
  pnlPosters?: string[] | null;
  telegramLink?: string | null;
  discordLink?: string | null;
  xLink?: string | null;
  walletConnectProjectId?: string | null;
  privyAppId?: string | null;
  privyTermsOfUse?: string | null;
  enabledMenus?: string | null;
  customMenus?: string | null;
  enableAbstractWallet?: boolean;
  enableCampaigns?: boolean;
  chainIds?: number[] | null;
  defaultChain?: number | null;
  repoUrl?: string | null;
  customDomain?: string | null;
  disableMainnet?: boolean;
  disableTestnet?: boolean;
  disableEvmWallets?: boolean;
  disableSolanaWallets?: boolean;
  tradingViewColorConfig?: string | null;
  availableLanguages?: string[] | null;
  seoSiteName?: string | null;
  seoSiteDescription?: string | null;
  seoSiteLanguage?: string | null;
  seoSiteLocale?: string | null;
  seoTwitterHandle?: string | null;
  seoThemeColor?: string | null;
  seoKeywords?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DexContextType {
  dexData: DexData | null;
  isLoading: boolean;
  error: string | null;
  brokerId: string | null;
  hasDex: boolean;
  isGraduationEligible: boolean;
  isGraduated: boolean;
  deploymentUrl: string | null;
  refreshDexData: () => Promise<void>;
  updateDexData: (newData: Partial<DexData>) => void;
  clearDexData: () => void;
}

const DexContext = createContext<DexContextType | undefined>(undefined);

export { DexContext };

export function DexProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [dexData, setDexData] = useState<DexData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDexData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDexData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await get<DexData | { exists: false }>("api/dex", token);

      if (response && "exists" in response && response.exists === false) {
        setDexData(null);
      } else if (response && "id" in response) {
        setDexData(response);
      } else {
        setDexData(null);
      }
    } catch (err) {
      console.error("Failed to fetch DEX data", err);
      setError(err instanceof Error ? err.message : "Failed to fetch DEX data");
      setDexData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const updateDexData = useCallback((newData: Partial<DexData>) => {
    setDexData(prev => (prev ? { ...prev, ...newData } : null));
  }, []);

  const clearDexData = useCallback(() => {
    setDexData(null);
    setError(null);
  }, []);

  // Load DEX data when user authenticates
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshDexData();
    } else {
      clearDexData();
    }
  }, [isAuthenticated, token, refreshDexData, clearDexData]);

  // Computed values
  const brokerId = dexData?.brokerId || null;
  const hasDex = Boolean(dexData);
  const isGraduationEligible = dexData?.brokerId === "demo";
  const isGraduated = Boolean(
    dexData &&
      dexData.brokerId !== "demo" &&
      dexData.preferredBrokerId &&
      dexData.brokerId === dexData.preferredBrokerId
  );
  const deploymentUrl = dexData?.repoUrl
    ? `https://dex.orderly.network/${dexData.repoUrl.split("/").pop()}/`
    : null;

  return (
    <DexContext.Provider
      value={{
        dexData,
        isLoading,
        error,
        brokerId,
        hasDex,
        isGraduationEligible,
        isGraduated,
        deploymentUrl,
        refreshDexData,
        updateDexData,
        clearDexData,
      }}
    >
      {children}
    </DexContext.Provider>
  );
}

export function useDex() {
  const context = useContext(DexContext);
  if (context === undefined) {
    throw new Error("useDex must be used within a DexProvider");
  }
  return context;
}
