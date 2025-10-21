import { useState, useEffect, FormEvent, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import { useDex } from "../context/DexContext";
import { useModal } from "../context/ModalContext";
import {
  get,
  post,
  postFormData,
  putFormData,
  del,
  createDexFormData,
} from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import Form from "../components/Form";
import {
  validateUrl,
  required,
  minLength,
  maxLength,
  composeValidators,
  alphanumericWithSpecialChars,
} from "../utils/validation";
import { useNavigate } from "@remix-run/react";
import DexSectionRenderer, {
  DEX_SECTIONS,
} from "../components/DexSectionRenderer";
import DexCreationStatus from "../components/DexCreationStatus";
import CustomDomainSection from "../components/CustomDomainSection";
import { useThemeCSS } from "../hooks/useThemeCSS";

interface DexData {
  id: string;
  brokerName: string;
  brokerId: string;
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
  privyLoginMethods?: string | null;
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

interface ThemeResponse {
  theme: string;
}

type ThemeTabType = "colors" | "fonts" | "rounded" | "spacing" | "tradingview";

const TOTAL_STEPS = DEX_SECTIONS.length;

const defaultTheme = `:root {
  --oui-font-family: 'Manrope', sans-serif;
  --oui-font-size-base: 16px;

  /* colors */
  --oui-color-primary: 176 132 233;
  --oui-color-primary-light: 213 190 244;
  --oui-color-primary-darken: 137 76 209;
  --oui-color-primary-contrast: 255 255 255;

  --oui-color-link: 189 107 237;
  --oui-color-link-light: 217 152 250;

  --oui-color-secondary: 255 255 255;
  --oui-color-tertiary: 218 218 218;
  --oui-color-quaternary: 218 218 218;

  --oui-color-danger: 245 97 139;
  --oui-color-danger-light: 250 167 188;
  --oui-color-danger-darken: 237 72 122;
  --oui-color-danger-contrast: 255 255 255;

  --oui-color-success: 41 233 169;
  --oui-color-success-light: 101 240 194;
  --oui-color-success-darken: 0 161 120;
  --oui-color-success-contrast: 255 255 255;

  --oui-color-warning: 255 209 70;
  --oui-color-warning-light: 255 229 133;
  --oui-color-warning-darken: 255 152 0;
  --oui-color-warning-contrast: 255 255 255;

  --oui-color-fill: 36 32 47;
  --oui-color-fill-active: 40 46 58;

  --oui-color-base-1: 93 83 123;
  --oui-color-base-2: 81 72 107;
  --oui-color-base-3: 68 61 69;
  --oui-color-base-4: 57 52 74;
  --oui-color-base-5: 51 46 66;
  --oui-color-base-6: 43 38 56;
  --oui-color-base-7: 36 32 47;
  --oui-color-base-8: 29 26 38;
  --oui-color-base-9: 22 20 28;
  --oui-color-base-10: 14 13 18;

  --oui-color-base-foreground: 255 255 255;
  --oui-color-line: 255 255 255;

  --oui-color-trading-loss: 245 97 139;
  --oui-color-trading-loss-contrast: 255 255 255;
  --oui-color-trading-profit: 41 233 169;
  --oui-color-trading-profit-contrast: 255 255 255;

  /* gradients */
  --oui-gradient-primary-start: 40 0 97;
  --oui-gradient-primary-end: 189 107 237;

  --oui-gradient-secondary-start: 81 42 121;
  --oui-gradient-secondary-end: 176 132 233;

  --oui-gradient-success-start: 1 83 68;
  --oui-gradient-success-end: 41 223 169;

  --oui-gradient-danger-start: 153 24 76;
  --oui-gradient-danger-end: 245 97 139;

  --oui-gradient-brand-start: 231 219 249;
  --oui-gradient-brand-end: 159 107 225;
  --oui-gradient-brand-stop-start: 6.62%;
  --oui-gradient-brand-stop-end: 86.5%;
  --oui-gradient-brand-angle: 17.44deg;

  --oui-gradient-warning-start: 152 58 8;
  --oui-gradient-warning-end: 255 209 70;

  --oui-gradient-neutral-start: 27 29 24;
  --oui-gradient-neutral-end: 38 41 46;

  /* rounded */
  --oui-rounded-sm: 2px;
  --oui-rounded: 4px;
  --oui-rounded-md: 6px;
  --oui-rounded-lg: 8px;
  --oui-rounded-xl: 12px;
  --oui-rounded-2xl: 16px;
  --oui-rounded-full: 9999px;

  /* spacing */
  --oui-spacing-xs: 20rem;
  --oui-spacing-sm: 22.5rem;
  --oui-spacing-md: 26.25rem;
  --oui-spacing-lg: 30rem;
  --oui-spacing-xl: 33.75rem;
}

html, body {
  font-family: 'Manrope', sans-serif !important;
  font-size: 16px !important;
}`;

export default function DexRoute() {
  const { isAuthenticated, token, isLoading } = useAuth();
  const {
    dexData,
    isLoading: isDexLoading,
    updateDexData,
    refreshDexData,
    clearDexData,
    isGraduationEligible,
    isGraduated,
    deploymentUrl: contextDeploymentUrl,
  } = useDex();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [brokerName, setBrokerName] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [xLink, setXLink] = useState("");
  const [walletConnectProjectId, setWalletConnectProjectId] = useState("");
  const [privyAppId, setPrivyAppId] = useState("");
  const [privyTermsOfUse, setPrivyTermsOfUse] = useState("");
  const [privyLoginMethods, setPrivyLoginMethods] = useState<string[]>([
    "email",
  ]);
  const [enabledMenus, setEnabledMenus] = useState("");
  const [customMenus, setCustomMenus] = useState("");
  const [enableAbstractWallet, setEnableAbstractWallet] = useState(false);
  const [enableCampaigns, setEnableCampaigns] = useState(false);

  const [primaryLogo, setPrimaryLogo] = useState<Blob | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<Blob | null>(null);
  const [favicon, setFavicon] = useState<Blob | null>(null);
  const [pnlPosters, setPnlPosters] = useState<(Blob | null)[]>([]);

  const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64);
    return response.blob();
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forkingStatus, setForkingStatus] = useState("");
  const [localDeploymentUrl, setLocalDeploymentUrl] = useState<string | null>(
    null
  );
  const deploymentUrl = localDeploymentUrl || contextDeploymentUrl;
  const [viewCssCode, setViewCssCode] = useState(false);
  const [deploymentConfirmed, setDeploymentConfirmed] = useState(false);

  const [upgradeStatus, setUpgradeStatus] = useState<{
    hasUpdates: boolean;
    behindBy: number;
    commits?: Array<{
      sha: string;
      message: string;
      author: string;
      date: string;
    }>;
  } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const filteredUpgradeCommits = useMemo(() => {
    if (!upgradeStatus?.commits || upgradeStatus.commits.length === 0) {
      return [];
    }

    const featCommits = upgradeStatus.commits.filter(c =>
      c.message.toLowerCase().startsWith("feat:")
    );
    const fixCommits = upgradeStatus.commits.filter(c =>
      c.message.toLowerCase().startsWith("fix:")
    );

    let displayCommits = [...featCommits];

    if (displayCommits.length < 5) {
      displayCommits = [...displayCommits, ...fixCommits].slice(0, 5);
    }

    if (displayCommits.length < 5) {
      displayCommits = upgradeStatus.commits.slice(0, 5);
    }

    return displayCommits;
  }, [upgradeStatus]);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  );

  const [originalValues, setOriginalValues] = useState<DexData>({
    id: "",
    brokerName: "",
    brokerId: "",
    themeCSS: null,
    primaryLogo: null,
    secondaryLogo: null,
    favicon: null,
    pnlPosters: null,
    telegramLink: "",
    discordLink: "",
    xLink: "",
    walletConnectProjectId: "",
    privyAppId: "",
    privyTermsOfUse: "",
    privyLoginMethods: null,
    enabledMenus: "",
    customMenus: "",
    enableAbstractWallet: false,
    enableCampaigns: false,
    chainIds: [],
    defaultChain: null,
    repoUrl: null,
    customDomain: null,
    disableMainnet: false,
    disableTestnet: false,
    disableEvmWallets: false,
    disableSolanaWallets: false,
    tradingViewColorConfig: null,
    availableLanguages: null,
    seoSiteName: null,
    seoSiteDescription: null,

    seoSiteLanguage: null,
    seoSiteLocale: null,
    seoTwitterHandle: null,
    seoThemeColor: null,
    seoKeywords: null,
    createdAt: "",
    updatedAt: "",
  });

  const [themePrompt, setThemePrompt] = useState("");
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [themeApplied, setThemeApplied] = useState(false);
  const [activeThemeTab, setActiveThemeTab] = useState<ThemeTabType>("colors");

  const [chainIds, setChainIds] = useState<number[]>([]);
  const [defaultChain, setDefaultChain] = useState<number | undefined>(
    undefined
  );
  const [disableMainnet, setDisableMainnet] = useState(false);
  const [disableTestnet, setDisableTestnet] = useState(false);
  const [disableEvmWallets, setDisableEvmWallets] = useState(false);
  const [disableSolanaWallets, setDisableSolanaWallets] = useState(false);
  const [tradingViewColorConfig, setTradingViewColorConfig] = useState<
    string | null
  >(null);

  const [seoSiteName, setSeoSiteName] = useState("");
  const [seoSiteDescription, setSeoSiteDescription] = useState("");

  const [seoSiteLanguage, setSeoSiteLanguage] = useState("");
  const [seoSiteLocale, setSeoSiteLocale] = useState("");
  const [seoTwitterHandle, setSeoTwitterHandle] = useState("");
  const [seoThemeColor, setSeoThemeColor] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  useEffect(() => {
    if (dexData) {
      setBrokerName(dexData.brokerName);
      setTelegramLink(dexData.telegramLink || "");
      setDiscordLink(dexData.discordLink || "");
      setXLink(dexData.xLink || "");
      setWalletConnectProjectId(dexData.walletConnectProjectId || "");
      setPrivyAppId(dexData.privyAppId || "");
      setPrivyTermsOfUse(dexData.privyTermsOfUse || "");
      setPrivyLoginMethods(
        dexData.privyLoginMethods
          ? dexData.privyLoginMethods.split(",").filter(Boolean)
          : ["email"]
      );
      setEnabledMenus(dexData.enabledMenus || "");
      setCustomMenus(dexData.customMenus || "");
      setEnableAbstractWallet(dexData.enableAbstractWallet || false);
      setEnableCampaigns(dexData.enableCampaigns || false);
      setDisableMainnet(dexData.disableMainnet || false);
      setDisableTestnet(dexData.disableTestnet || false);
      setDisableEvmWallets(dexData.disableEvmWallets || false);
      setDisableSolanaWallets(dexData.disableSolanaWallets || false);
      setTradingViewColorConfig(dexData.tradingViewColorConfig ?? null);
      setAvailableLanguages(dexData.availableLanguages || []);
      setSeoSiteName(dexData.seoSiteName || "");
      setSeoSiteDescription(dexData.seoSiteDescription || "");
      setSeoSiteLanguage(dexData.seoSiteLanguage || "");
      setSeoSiteLocale(dexData.seoSiteLocale || "");
      setSeoTwitterHandle(dexData.seoTwitterHandle || "");
      setSeoThemeColor(dexData.seoThemeColor || "");
      setSeoKeywords(dexData.seoKeywords || "");
      setViewCssCode(false);

      if (dexData.themeCSS) {
        setCurrentTheme(dexData.themeCSS);
        setThemeApplied(true);
      } else {
        setCurrentTheme(defaultTheme);
        setThemeApplied(true);
      }

      setOriginalValues({
        ...dexData,
        chainIds: dexData.chainIds || [],
        defaultChain: dexData.defaultChain,
        enableAbstractWallet: dexData.enableAbstractWallet || false,
        enableCampaigns: dexData.enableCampaigns || false,
        disableMainnet: dexData.disableMainnet || false,
        disableTestnet: dexData.disableTestnet || false,
        disableEvmWallets: dexData.disableEvmWallets || false,
        disableSolanaWallets: dexData.disableSolanaWallets || false,
        availableLanguages: dexData.availableLanguages || [],
        privyLoginMethods: dexData.privyLoginMethods,
        seoSiteName: dexData.seoSiteName,
        seoSiteDescription: dexData.seoSiteDescription,
        seoSiteLanguage: dexData.seoSiteLanguage,
        seoSiteLocale: dexData.seoSiteLocale,
        seoTwitterHandle: dexData.seoTwitterHandle,
        seoThemeColor: dexData.seoThemeColor,
        seoKeywords: dexData.seoKeywords,
      });

      setActiveThemeTab("colors");
      setLocalDeploymentUrl(
        dexData.repoUrl
          ? `https://dex.orderly.network/${dexData.repoUrl.split("/").pop()}/`
          : null
      );
      setChainIds(dexData.chainIds || []);
      setDefaultChain(dexData.defaultChain || undefined);
    }
  }, [dexData]);

  useEffect(() => {
    if (!currentTheme && !originalValues.themeCSS) {
      setCurrentTheme(defaultTheme);
      setThemeApplied(true);
    }
  }, [currentTheme, originalValues.themeCSS]);

  useEffect(() => {
    if (dexData) {
      const loadImages = async () => {
        if (dexData.primaryLogo) {
          setPrimaryLogo(await base64ToBlob(dexData.primaryLogo));
        }
        if (dexData.secondaryLogo) {
          setSecondaryLogo(await base64ToBlob(dexData.secondaryLogo));
        }
        if (dexData.favicon) {
          setFavicon(await base64ToBlob(dexData.favicon));
        }
        if (dexData.pnlPosters) {
          const posterBlobs = await Promise.all(
            dexData.pnlPosters.map(poster =>
              poster ? base64ToBlob(poster) : Promise.resolve(null)
            )
          );
          setPnlPosters(posterBlobs);
        }
      };
      loadImages();
    }
  }, [dexData]);

  // Handle smooth scrolling to DEX Creation Status when navigating from config
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#dex-creation-status") {
      // Wait for the component to render, then scroll
      const timer = setTimeout(() => {
        const element = document.getElementById("dex-creation-status");
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
          // Clear the hash after scrolling
          window.history.replaceState(null, "", window.location.pathname);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dexData, isLoading, isDexLoading]);

  useEffect(() => {
    if (
      dexData &&
      dexData.customDomain &&
      !isGraduated &&
      isAuthenticated &&
      !isLoading &&
      !isDexLoading
    ) {
      const popupShownKey = `graduation-popup-shown-${dexData.id}`;
      const hasShownPopup = localStorage.getItem(popupShownKey);

      if (!hasShownPopup) {
        const timer = setTimeout(() => {
          openModal("graduationExplanation");
          localStorage.setItem(popupShownKey, "true");
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [
    dexData,
    isGraduated,
    isAuthenticated,
    isLoading,
    isDexLoading,
    openModal,
  ]);

  useEffect(() => {
    if (dexData && dexData.id && dexData.repoUrl && token) {
      const checkUpgradeStatus = async () => {
        try {
          const response = await get<{
            hasUpdates: boolean;
            behindBy: number;
            commits?: Array<{
              sha: string;
              message: string;
              author: string;
              date: string;
            }>;
          }>(`api/dex/${dexData.id}/upgrade-status`, token, {
            showToastOnError: false,
          });
          setUpgradeStatus(response);
        } catch (error) {
          console.error("Error checking upgrade status:", error);
        }
      };

      checkUpgradeStatus();
    }
  }, [dexData, token]);

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) {
      toast.error("Please enter a theme description");
      return;
    }

    setIsGeneratingTheme(true);

    try {
      const response = await post<ThemeResponse>(
        "api/theme/modify",
        {
          prompt: themePrompt.trim(),
          currentTheme: currentTheme || originalValues.themeCSS,
        },
        token
      );

      if (response && response.theme) {
        openModal("themePreview", {
          theme: response.theme,
          onApply: handleApplyGeneratedTheme,
          onCancel: handleCancelGeneratedTheme,
        });
        toast.success("Theme generated successfully!");
      } else {
        toast.error("Failed to generate theme");
      }
    } catch (error) {
      console.error("Error generating theme:", error);
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 429
      ) {
        toast.error(
          "Rate limit exceeded. Please wait 30 seconds before generating another theme."
        );
      } else {
        toast.error("Error generating theme. Please try again.");
      }
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleApplyGeneratedTheme = (modifiedCss: string) => {
    setCurrentTheme(modifiedCss);
    setThemeApplied(true);
  };

  const handleCancelGeneratedTheme = () => {};

  const handleThemeEditorChange = (value: string) => {
    setCurrentTheme(value);
    setThemeApplied(true);
  };

  const handleResetTheme = () => {
    setCurrentTheme(originalValues.themeCSS ?? null);
    setThemeApplied(!!originalValues.themeCSS);
    setTradingViewColorConfig(originalValues.tradingViewColorConfig ?? null);
    setThemePrompt("");
    setShowThemeEditor(false);
    setViewCssCode(false);
    toast.success("Theme reset");
  };

  const handleResetToDefault = () => {
    setCurrentTheme(defaultTheme);
    setThemeApplied(true);
    setTradingViewColorConfig(null);
    setThemePrompt("");
    setShowThemeEditor(false);
    setViewCssCode(false);
    toast.success("Theme reset to default");
  };

  const toggleThemeEditor = () => {
    setShowThemeEditor(!showThemeEditor);
  };

  const handleRetryForking = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsForking(true);
    setForkingStatus("Creating repository from template...");

    try {
      const result = await post<{ dex: DexData }>(
        `api/dex/${dexData.id}/fork`,
        {},
        token
      );

      if (result && result.dex) {
        updateDexData(result.dex);

        if (result.dex.repoUrl) {
          toast.success("Repository forked successfully!");

          setLocalDeploymentUrl(
            `https://dex.orderly.network/${result.dex.repoUrl.split("/").pop()}/`
          );
        } else {
          toast.error("Repository creation failed. Please try again later.");
        }
      } else {
        toast.error(
          "Failed to get response from server. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error forking repository:", error);
      toast.error("Failed to fork repository. Please try again later.");
    } finally {
      setIsForking(false);
      setForkingStatus("");
    }
  };

  const brokerNameValidator = composeValidators(
    required("Broker name"),
    minLength(3, "Broker name"),
    maxLength(30, "Broker name"),
    alphanumericWithSpecialChars("Broker name")
  );

  const urlValidator = validateUrl();

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      switch (field) {
        case "brokerName":
          setBrokerName(value);
          break;
        case "telegramLink":
          setTelegramLink(value);
          break;
        case "discordLink":
          setDiscordLink(value);
          break;
        case "xLink":
          setXLink(value);
          break;
        case "walletConnectProjectId":
          setWalletConnectProjectId(value);
          break;
        case "privyAppId":
          setPrivyAppId(value);
          break;
        case "privyTermsOfUse":
          setPrivyTermsOfUse(value);
          break;
        case "themePrompt":
          setThemePrompt(value);
          break;
        case "seoSiteName":
          setSeoSiteName(value);
          break;
        case "seoSiteDescription":
          setSeoSiteDescription(value);
          break;
        case "seoSiteLanguage":
          setSeoSiteLanguage(value);
          break;
        case "seoSiteLocale":
          setSeoSiteLocale(value);
          break;
        case "seoTwitterHandle":
          setSeoTwitterHandle(value);
          break;
        case "seoThemeColor":
          setSeoThemeColor(value);
          break;
        case "seoKeywords":
          setSeoKeywords(value);
          break;
      }
    };

  const handleImageChange = (field: string) => (blob: Blob | null) => {
    switch (field) {
      case "primaryLogo":
        setPrimaryLogo(blob);
        break;
      case "secondaryLogo":
        setSecondaryLogo(blob);
        break;
      case "favicon":
        setFavicon(blob);
        break;
    }
  };

  const handlePnLPosterChange = (newPosters: (Blob | null)[]) => {
    setPnlPosters(newPosters);
  };

  const validateAllSections = () => {
    const allProps = {
      brokerName,
      handleInputChange,
      brokerNameValidator,
      primaryLogo,
      secondaryLogo,
      favicon,
      handleImageChange,
      currentTheme,
      defaultTheme,
      showThemeEditor,
      viewCssCode,
      activeThemeTab,
      themePrompt,
      isGeneratingTheme,
      themeApplied,
      tradingViewColorConfig,
      toggleThemeEditor,
      handleResetTheme,
      handleResetToDefault,
      handleThemeEditorChange,
      setViewCssCode,
      ThemeTabButton,
      updateCssColor: handleUpdateCssColor,
      updateCssValue: handleUpdateCssValue,
      handleGenerateTheme,
      setTradingViewColorConfig,
      pnlPosters,
      handlePnLPosterChange,
      telegramLink,
      discordLink,
      xLink,
      urlValidator,
      seoSiteName,
      seoSiteDescription,
      seoSiteLanguage,
      seoSiteLocale,
      seoTwitterHandle,
      seoThemeColor,
      seoKeywords,
      walletConnectProjectId,
      privyAppId,
      privyTermsOfUse,
      enableAbstractWallet,
      onEnableAbstractWalletChange: setEnableAbstractWallet,
      disableEvmWallets,
      disableSolanaWallets,
      onDisableEvmWalletsChange: setDisableEvmWallets,
      onDisableSolanaWalletsChange: setDisableSolanaWallets,
      privyLoginMethods,
      onPrivyLoginMethodsChange: setPrivyLoginMethods,
      chainIds,
      onChainIdsChange: setChainIds,
      defaultChain,
      onDefaultChainChange: setDefaultChain,
      disableMainnet,
      disableTestnet,
      onDisableMainnetChange: setDisableMainnet,
      onDisableTestnetChange: setDisableTestnet,
      availableLanguages,
      onAvailableLanguagesChange: setAvailableLanguages,
      enabledMenus,
      setEnabledMenus,
      customMenus,
      setCustomMenus,
      enableCampaigns,
      setEnableCampaigns,
    };

    const validationErrors: string[] = [];

    for (const section of DEX_SECTIONS) {
      if (section.getValidationTest) {
        const isValid = section.getValidationTest(allProps);
        if (!isValid) {
          if (section.key === "brokerDetails") {
            const error = brokerNameValidator(brokerName.trim());
            validationErrors.push(
              error || `${section.title}: validation failed`
            );
          } else if (section.key === "privyConfiguration") {
            validationErrors.push(
              `${section.title}: Please enter a valid Terms of Use URL`
            );
          } else {
            validationErrors.push(`${section.title}: validation failed`);
          }
        }
      }
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validateAllSections();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    const trimmedBrokerName = brokerName.trim();
    const trimmedTelegramLink = telegramLink.trim();
    const trimmedDiscordLink = discordLink.trim();
    const trimmedXLink = xLink.trim();
    const trimmedWalletConnectProjectId = walletConnectProjectId.trim();
    const trimmedPrivyAppId = privyAppId.trim();
    const trimmedPrivyTermsOfUse = privyTermsOfUse.trim();
    const trimmedSeoSiteName = seoSiteName.trim();
    const trimmedSeoSiteDescription = seoSiteDescription.trim();
    const trimmedSeoSiteLanguage = seoSiteLanguage.trim();
    const trimmedSeoSiteLocale = seoSiteLocale.trim();
    const trimmedSeoTwitterHandle = seoTwitterHandle.trim();
    const trimmedSeoThemeColor = seoThemeColor.trim();
    const trimmedSeoKeywords = seoKeywords.trim();

    const [
      primaryLogoBase64,
      secondaryLogoBase64,
      faviconBase64,
      pnlPostersBase64,
    ] = await Promise.all([
      primaryLogo ? blobToBase64(primaryLogo) : Promise.resolve(null),
      secondaryLogo ? blobToBase64(secondaryLogo) : Promise.resolve(null),
      favicon ? blobToBase64(favicon) : Promise.resolve(null),
      Promise.all(
        pnlPosters.map(poster =>
          poster ? blobToBase64(poster) : Promise.resolve(null)
        )
      ),
    ]);

    setIsSaving(true);

    if (!dexData || !dexData.id) {
      setForkingStatus("Creating DEX and forking repository...");
    }

    try {
      let savedData: DexData;

      const imageBlobs: {
        primaryLogo?: Blob | null;
        secondaryLogo?: Blob | null;
        favicon?: Blob | null;
        pnlPosters?: (Blob | null)[];
      } = {
        primaryLogo,
        secondaryLogo,
        favicon,
        pnlPosters,
      };

      const dexData_ToSend = {
        brokerName: trimmedBrokerName,
        telegramLink: trimmedTelegramLink,
        discordLink: trimmedDiscordLink,
        xLink: trimmedXLink,
        walletConnectProjectId: trimmedWalletConnectProjectId,
        privyAppId: trimmedPrivyAppId,
        privyTermsOfUse: trimmedPrivyTermsOfUse,
        privyLoginMethods: privyLoginMethods.join(","),
        themeCSS: themeApplied ? currentTheme : originalValues.themeCSS,
        enabledMenus: enabledMenus,
        customMenus,
        enableAbstractWallet,
        enableCampaigns,
        chainIds,
        defaultChain,
        disableMainnet,
        disableTestnet,
        disableEvmWallets,
        disableSolanaWallets,
        tradingViewColorConfig,
        availableLanguages,
        seoSiteName: trimmedSeoSiteName,
        seoSiteDescription: trimmedSeoSiteDescription,
        seoSiteLanguage: trimmedSeoSiteLanguage,
        seoSiteLocale: trimmedSeoSiteLocale,
        seoTwitterHandle: trimmedSeoTwitterHandle,
        seoThemeColor: trimmedSeoThemeColor,
        seoKeywords: trimmedSeoKeywords,
      };

      const formData = createDexFormData(dexData_ToSend, imageBlobs);

      if (dexData && dexData.id) {
        savedData = await putFormData<DexData>(
          `api/dex/${dexData.id}`,
          formData,
          token
        );

        setOriginalValues({
          ...savedData,
          brokerName: trimmedBrokerName,
          telegramLink: trimmedTelegramLink,
          discordLink: trimmedDiscordLink,
          xLink: trimmedXLink,
          walletConnectProjectId: trimmedWalletConnectProjectId,
          privyAppId: trimmedPrivyAppId,
          privyTermsOfUse: trimmedPrivyTermsOfUse,
          privyLoginMethods: privyLoginMethods.join(","),
          enabledMenus: enabledMenus,
          customMenus,
          primaryLogo: primaryLogoBase64,
          secondaryLogo: secondaryLogoBase64,
          favicon: faviconBase64,
          pnlPosters: pnlPostersBase64 as string[],
          themeCSS: themeApplied ? currentTheme : null,
          enableAbstractWallet,
          enableCampaigns,
          chainIds,
          defaultChain,
          disableMainnet,
          disableTestnet,
          disableEvmWallets,
          disableSolanaWallets,
          tradingViewColorConfig,
          seoSiteName: trimmedSeoSiteName,
          seoSiteDescription: trimmedSeoSiteDescription,
          seoSiteLanguage: trimmedSeoSiteLanguage,
          seoSiteLocale: trimmedSeoSiteLocale,
          seoTwitterHandle: trimmedSeoTwitterHandle,
          seoThemeColor: trimmedSeoThemeColor,
          seoKeywords: trimmedSeoKeywords,
        });

        toast.success("DEX information updated successfully!");

        updateDexData(savedData);
      } else {
        savedData = await postFormData<DexData>("api/dex", formData, token, {
          showToastOnError: false,
        });

        setOriginalValues({
          ...originalValues,
          brokerName: trimmedBrokerName,
          telegramLink: trimmedTelegramLink,
          discordLink: trimmedDiscordLink,
          xLink: trimmedXLink,
          walletConnectProjectId: trimmedWalletConnectProjectId,
          privyAppId: trimmedPrivyAppId,
          privyTermsOfUse: trimmedPrivyTermsOfUse,
          enabledMenus: enabledMenus,
          customMenus,
          primaryLogo: primaryLogoBase64,
          secondaryLogo: secondaryLogoBase64,
          favicon: faviconBase64,
          pnlPosters: pnlPostersBase64 as string[],
          themeCSS: themeApplied ? currentTheme : null,
          enableAbstractWallet,
          enableCampaigns,
          chainIds,
          defaultChain,
          disableMainnet,
          disableTestnet,
          disableEvmWallets,
          disableSolanaWallets,
          tradingViewColorConfig,
          availableLanguages,
          seoSiteName: trimmedSeoSiteName,
          seoSiteDescription: trimmedSeoSiteDescription,
          seoSiteLanguage: trimmedSeoSiteLanguage,
          seoSiteLocale: trimmedSeoSiteLocale,
          seoTwitterHandle: trimmedSeoTwitterHandle,
          seoThemeColor: trimmedSeoThemeColor,
          seoKeywords: trimmedSeoKeywords,
        });

        if (savedData.repoUrl) {
          toast.success("DEX created and repository forked successfully!");
        } else {
          toast.success("DEX information saved successfully!");
          toast.warning("Repository could not be forked. You can retry later.");
        }

        await refreshDexData();
      }
    } catch (error) {
      console.error("Error in component:", error);
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  const handleSuccessfulDeployment = (
    url: string,
    isNewDeployment: boolean
  ) => {
    setLocalDeploymentUrl(url);
    setDeploymentConfirmed(true);

    if (isNewDeployment) {
      toast.success("Your DEX has been successfully deployed!");
    }
  };

  const handleDelete = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsDeleting(true);

    try {
      await del<{ message: string }>(`api/dex/${dexData.id}`, null, token);
      toast.success("DEX deleted successfully!");

      setBrokerName("");
      setTelegramLink("");
      setDiscordLink("");
      setXLink("");
      setPrimaryLogo(null);
      setSecondaryLogo(null);
      setFavicon(null);
      setLocalDeploymentUrl(null);

      clearDexData();

      navigate("/");
    } catch (error) {
      console.error("Error deleting DEX:", error);
      toast.error("Failed to delete the DEX. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowDeleteConfirm = () => {
    openModal("deleteConfirm", {
      onConfirm: handleDelete,
      entityName: "DEX",
    });
  };

  const handleShowDomainRemoveConfirm = () => {
    if (!dexData || !dexData.id || !dexData.customDomain) return;

    openModal("deleteConfirm", {
      onConfirm: () => {
        setIsSaving(true);

        del(`api/dex/${dexData.id}/custom-domain`, null, token)
          .then(() => {
            updateDexData({
              customDomain: null,
            });
            toast.success("Custom domain removed successfully");
          })
          .catch(error => {
            console.error("Error removing custom domain:", error);
            toast.error("Failed to remove custom domain");
          })
          .finally(() => {
            setIsSaving(false);
          });
      },
      entityName: "custom domain",
      title: "Remove Custom Domain",
      message: `Are you sure you want to remove the custom domain "${dexData.customDomain}"? This action cannot be undone.`,
    });
  };

  const { updateCssValue, updateCssColor } = useThemeCSS(defaultTheme);

  const handleUpdateCssValue = useCallback(
    (variableName: string, newValue: string) => {
      updateCssValue(variableName, newValue, setCurrentTheme);
      setThemeApplied(true);
    },
    [updateCssValue]
  );

  const handleUpdateCssColor = useCallback(
    (variableName: string, newColorHex: string) => {
      updateCssColor(variableName, newColorHex, setCurrentTheme);
      setThemeApplied(true);
    },
    [updateCssColor]
  );

  const ThemeTabButton = ({
    tab,
    label,
  }: {
    tab: ThemeTabType;
    label: string;
  }) => (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        activeThemeTab === tab
          ? "bg-background-dark/50 text-white border-t border-l border-r border-light/10"
          : "bg-transparent text-gray-400 hover:text-white"
      }`}
      onClick={() => setActiveThemeTab(tab)}
      type="button"
    >
      {label}
    </button>
  );

  const allRequiredPreviousStepsCompleted = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    for (let i = 1; i < stepNumber; i++) {
      const stepConfig = DEX_SECTIONS.find(s => s.id === i);
      if (stepConfig && !stepConfig.isOptional && !completedSteps[i]) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = (step: number) => {
    const currentStepConfig = DEX_SECTIONS.find(s => s.id === step);
    if (currentStepConfig && !currentStepConfig.isOptional) {
      if (step === 1) {
        const validationError = brokerNameValidator(brokerName.trim());
        if (validationError !== null) {
          toast.error(
            typeof validationError === "string"
              ? validationError
              : "Broker name is invalid. It must be between 3 and 50 characters."
          );
          return;
        }
      }
    }

    if (
      step === DEX_SECTIONS.find(s => s.title === "Privy Configuration")?.id
    ) {
      const privyTermsOfUseFilled =
        privyTermsOfUse && privyTermsOfUse.trim() !== "";

      if (
        privyTermsOfUseFilled &&
        urlValidator(privyTermsOfUse.trim()) !== null
      ) {
        toast.error("Privy Terms of Use URL is not a valid URL.");
        return;
      }
    }

    setCompletedSteps(prev => ({ ...prev, [step]: true }));
    if (step < TOTAL_STEPS) {
      setCurrentStep(step + 1);

      setTimeout(() => {
        const nextStepElement = document.getElementById(`step-${step + 1}`);
        if (nextStepElement) {
          nextStepElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);
    } else {
      setCurrentStep(TOTAL_STEPS + 1);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const handleUpgrade = async () => {
    if (!dexData || !dexData.id) {
      toast.error("No DEX data available");
      return;
    }

    setIsUpgrading(true);

    try {
      const imageBlobs: {
        primaryLogo?: Blob | null;
        secondaryLogo?: Blob | null;
        favicon?: Blob | null;
        pnlPosters?: (Blob | null)[];
      } = {
        primaryLogo,
        secondaryLogo,
        favicon,
        pnlPosters,
      };

      const dexDataToSend = {
        brokerName: brokerName.trim(),
        telegramLink: telegramLink.trim(),
        discordLink: discordLink.trim(),
        xLink: xLink.trim(),
        walletConnectProjectId: walletConnectProjectId.trim(),
        privyAppId: privyAppId.trim(),
        privyTermsOfUse: privyTermsOfUse.trim(),
        privyLoginMethods: privyLoginMethods.join(","),
        themeCSS: themeApplied ? currentTheme : originalValues.themeCSS,
        enabledMenus: enabledMenus,
        customMenus,
        enableAbstractWallet,
        enableCampaigns,
        chainIds,
        defaultChain,
        disableMainnet,
        disableTestnet,
        disableEvmWallets,
        disableSolanaWallets,
        tradingViewColorConfig,
        availableLanguages,
        seoSiteName: seoSiteName.trim(),
        seoSiteDescription: seoSiteDescription.trim(),
        seoSiteLanguage: seoSiteLanguage.trim(),
        seoSiteLocale: seoSiteLocale.trim(),
        seoTwitterHandle: seoTwitterHandle.trim(),
        seoThemeColor: seoThemeColor.trim(),
        seoKeywords: seoKeywords.trim(),
      };

      const formData = createDexFormData(dexDataToSend, imageBlobs);

      await putFormData<DexData>(`api/dex/${dexData.id}`, formData, token);

      toast.success(
        "DEX upgraded successfully! New features are being deployed."
      );

      setUpgradeStatus(null);
    } catch (error) {
      console.error("Error upgrading DEX:", error);
      toast.error("Failed to upgrade DEX. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleQuickSetup = async () => {
    const validationErrors = validateAllSections();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsSaving(true);
    setForkingStatus("Creating DEX with current settings...");

    try {
      // Convert blobs to base64 for storage
      const [
        primaryLogoBase64,
        secondaryLogoBase64,
        faviconBase64,
        pnlPostersBase64,
      ] = await Promise.all([
        primaryLogo ? blobToBase64(primaryLogo) : Promise.resolve(null),
        secondaryLogo ? blobToBase64(secondaryLogo) : Promise.resolve(null),
        favicon ? blobToBase64(favicon) : Promise.resolve(null),
        Promise.all(
          pnlPosters.map(poster =>
            poster ? blobToBase64(poster) : Promise.resolve(null)
          )
        ),
      ]);

      const imageBlobs: {
        primaryLogo?: Blob | null;
        secondaryLogo?: Blob | null;
        favicon?: Blob | null;
        pnlPosters?: (Blob | null)[];
      } = {
        primaryLogo,
        secondaryLogo,
        favicon,
        pnlPosters,
      };

      const dexData_ToSend = {
        brokerName: brokerName.trim(),
        telegramLink: telegramLink.trim(),
        discordLink: discordLink.trim(),
        xLink: xLink.trim(),
        walletConnectProjectId: walletConnectProjectId.trim(),
        privyAppId: privyAppId.trim(),
        privyTermsOfUse: privyTermsOfUse.trim(),
        privyLoginMethods: privyLoginMethods.join(","),
        themeCSS: themeApplied ? currentTheme : defaultTheme,
        enabledMenus: enabledMenus,
        customMenus: customMenus,
        enableAbstractWallet: enableAbstractWallet,
        enableCampaigns: enableCampaigns,
        chainIds: chainIds,
        defaultChain: defaultChain,
        disableMainnet: disableMainnet,
        disableTestnet: disableTestnet,
        disableEvmWallets: disableEvmWallets,
        disableSolanaWallets: disableSolanaWallets,
        tradingViewColorConfig: tradingViewColorConfig,
        availableLanguages: availableLanguages,
        seoSiteName: seoSiteName.trim(),
        seoSiteDescription: seoSiteDescription.trim(),
        seoSiteLanguage: seoSiteLanguage.trim(),
        seoSiteLocale: seoSiteLocale.trim(),
        seoTwitterHandle: seoTwitterHandle.trim(),
        seoThemeColor: seoThemeColor.trim(),
        seoKeywords: seoKeywords.trim(),
      };

      const formData = createDexFormData(dexData_ToSend, imageBlobs);
      const savedData = await postFormData<DexData>(
        "api/dex",
        formData,
        token,
        { showToastOnError: false }
      );

      setOriginalValues({
        ...savedData,
        brokerName: brokerName.trim(),
        telegramLink: telegramLink.trim(),
        discordLink: discordLink.trim(),
        xLink: xLink.trim(),
        walletConnectProjectId: walletConnectProjectId.trim(),
        privyAppId: privyAppId.trim(),
        privyTermsOfUse: privyTermsOfUse.trim(),
        privyLoginMethods: privyLoginMethods.join(","),
        enabledMenus: enabledMenus,
        customMenus: customMenus,
        primaryLogo: primaryLogoBase64,
        secondaryLogo: secondaryLogoBase64,
        favicon: faviconBase64,
        pnlPosters: pnlPostersBase64 as string[],
        themeCSS: themeApplied ? currentTheme : defaultTheme,
        enableAbstractWallet: enableAbstractWallet,
        enableCampaigns: enableCampaigns,
        chainIds: chainIds,
        defaultChain: defaultChain,
        disableMainnet: disableMainnet,
        disableTestnet: disableTestnet,
        disableEvmWallets: disableEvmWallets,
        disableSolanaWallets: disableSolanaWallets,
        tradingViewColorConfig: tradingViewColorConfig,
        availableLanguages: availableLanguages,
        seoSiteName: seoSiteName.trim(),
        seoSiteDescription: seoSiteDescription.trim(),
        seoSiteLanguage: seoSiteLanguage.trim(),
        seoSiteLocale: seoSiteLocale.trim(),
        seoTwitterHandle: seoTwitterHandle.trim(),
        seoThemeColor: seoThemeColor.trim(),
        seoKeywords: seoKeywords.trim(),
      });

      if (savedData.repoUrl) {
        toast.success(
          "DEX created with current settings! Repository is being set up."
        );
      } else {
        toast.success("DEX created with current settings!");
        toast.warning("Repository could not be forked. You can retry later.");
      }
      updateDexData(savedData);
      await refreshDexData();
    } catch (error) {
      console.error("Error in quick setup:", error);
      toast.error(
        "Failed to create DEX with default settings. Please try again."
      );
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  if (isLoading || isDexLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4 mt-26 pb-52">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <div className="text-base md:text-lg mb-2">Loading your DEX</div>
          <div className="text-xs md:text-sm text-gray-400">
            Please wait while we fetch your configuration
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 mt-26 pb-52">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6">
            Create Your DEX
          </h1>
          <Card>
            <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
              Authentication Required
            </h2>
            <p className="mb-4 md:mb-6 text-sm md:text-base text-gray-300">
              Please connect your wallet and login to create and manage your
              DEX.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if ((isSaving || isForking) && forkingStatus && !dexData) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4 mt-26 pb-52">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <div className="text-lg md:text-xl mb-4 font-medium">
            {forkingStatus}
          </div>
          <div className="text-xs md:text-sm text-gray-400 max-w-sm mx-auto">
            This may take a moment. We're setting up your DEX repository and
            configuring it with your information.
          </div>
        </div>
      </div>
    );
  }

  if (!dexData && isAuthenticated) {
    return (
      <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">
            Create Your DEX - Step-by-Step
          </h1>
        </div>

        <Form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          submitText={
            currentStep > TOTAL_STEPS && completedSteps[TOTAL_STEPS]
              ? "Create Your DEX"
              : ""
          }
          isLoading={isSaving}
          loadingText="Creating DEX..."
          disabled={
            isForking ||
            isDeleting ||
            isSaving ||
            !(currentStep > TOTAL_STEPS && completedSteps[TOTAL_STEPS])
          }
          enableRateLimit={false}
        >
          <DexSectionRenderer
            mode="accordion"
            sections={DEX_SECTIONS}
            allProps={{
              brokerName,
              handleInputChange,
              brokerNameValidator,
              primaryLogo,
              secondaryLogo,
              favicon,
              handleImageChange,
              currentTheme,
              defaultTheme,
              showThemeEditor,
              viewCssCode,
              activeThemeTab,
              themePrompt,
              isGeneratingTheme,
              themeApplied,
              tradingViewColorConfig,
              toggleThemeEditor,
              handleResetTheme,
              handleResetToDefault,
              handleThemeEditorChange,
              setViewCssCode,
              ThemeTabButton,
              updateCssColor: handleUpdateCssColor,
              updateCssValue: handleUpdateCssValue,
              handleGenerateTheme,
              setTradingViewColorConfig,
              pnlPosters,
              handlePnLPosterChange,
              telegramLink,
              discordLink,
              xLink,
              urlValidator,
              seoSiteName,
              seoSiteDescription,
              seoSiteLanguage,
              seoSiteLocale,
              seoTwitterHandle,
              seoThemeColor,
              seoKeywords,
              walletConnectProjectId,
              privyAppId,
              privyTermsOfUse,
              privyLoginMethods,
              onPrivyLoginMethodsChange: setPrivyLoginMethods,
              enableAbstractWallet,
              onEnableAbstractWalletChange: setEnableAbstractWallet,
              disableEvmWallets,
              disableSolanaWallets,
              onDisableEvmWalletsChange: setDisableEvmWallets,
              onDisableSolanaWalletsChange: setDisableSolanaWallets,
              chainIds,
              onChainIdsChange: setChainIds,
              defaultChain,
              onDefaultChainChange: setDefaultChain,
              disableMainnet,
              disableTestnet,
              onDisableMainnetChange: setDisableMainnet,
              onDisableTestnetChange: setDisableTestnet,
              availableLanguages,
              onAvailableLanguagesChange: setAvailableLanguages,
              enabledMenus,
              setEnabledMenus,
              customMenus,
              setCustomMenus,
              enableCampaigns,
              setEnableCampaigns,
            }}
            currentStep={currentStep}
            completedSteps={completedSteps}
            setCurrentStep={setCurrentStep}
            handleNextStep={handleNextStep}
            allRequiredPreviousStepsCompleted={
              allRequiredPreviousStepsCompleted
            }
          />
        </Form>

        {currentStep > TOTAL_STEPS &&
          completedSteps[TOTAL_STEPS] &&
          !isSaving && (
            <div className="mt-8 p-6 bg-success/10 border border-success/20 rounded-lg text-center slide-fade-in">
              <h3 className="text-lg font-semibold text-success mb-2">
                All steps completed!
              </h3>
              <p className="text-gray-300 mb-4">
                You're ready to create your DEX. Click the "Create Your DEX"
                button above to proceed.
              </p>
            </div>
          )}

        {/* Quick Setup at Bottom */}
        {!dexData && brokerName.trim() && (
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg text-center slide-fade-in">
            <h3 className="text-lg font-semibold text-primary-light mb-2 flex items-center justify-center">
              <div className="i-mdi:lightning-bolt h-5 w-5 mr-2"></div>
              Quick Setup
            </h3>
            <p className="text-gray-300 mb-4">
              Create your DEX with current settings. You can customize it later.
            </p>
            <Button
              variant="primary"
              onClick={handleQuickSetup}
              disabled={isSaving || isForking}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving || isForking ? (
                <>
                  <div className="i-svg-spinners:pulse-rings-multiple h-4 w-4 mr-2"></div>
                  Creating DEX...
                </>
              ) : (
                <>
                  <div className="i-mdi:rocket-launch h-4 w-4 mr-2"></div>
                  Create DEX Now
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          {dexData ? "Manage Your DEX" : "Create Your DEX"}
        </h1>
      </div>

      {!isAuthenticated && !isLoading ? (
        <div className="text-center mt-16">
          <Card className="p-8">
            <p className="text-lg mb-6">
              Please connect your wallet to create or manage your DEX.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {upgradeStatus && upgradeStatus.hasUpdates && dexData && (
            <Card className="my-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-blue-500/20 p-2 rounded-full">
                    <div className="i-mdi:arrow-up-circle text-blue-400 w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      DEX Upgrade Available
                      <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      New features and improvements are ready for your DEX.
                      Click upgrade to get the latest updates.
                    </p>
                    {filteredUpgradeCommits.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-400 font-medium mb-1">
                          What's new:
                        </p>
                        {filteredUpgradeCommits.map((commit, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-400 flex items-start gap-1"
                          >
                            <div className="i-mdi:check-circle h-4 w-4 flex-shrink-0 text-blue-400"></div>
                            <span className="line-clamp-1">
                              {commit.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="whitespace-nowrap flex-shrink-0"
                  variant="primary"
                >
                  {isUpgrading ? (
                    <>
                      <div className="i-svg-spinners:pulse-rings-multiple h-4 w-4 mr-2"></div>
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <div className="i-mdi:rocket-launch h-4 w-4 mr-2"></div>
                      Upgrade DEX
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.repoUrl && (
            <Card className="my-6 bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-secondary/20 p-2 rounded-full">
                    <div className="i-mdi:cog text-secondary w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Configure Your DEX
                    </h3>
                    <p className="text-gray-300">
                      Customize branding, themes, social links, wallets, and
                      advanced settings for your DEX.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/config"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Open Settings
                </Button>
              </div>
            </Card>
          )}

          {isGraduationEligible && !isGraduated && dexData && (
            <Card className="my-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/20 p-2 rounded-full">
                    <div className="i-mdi:rocket-launch text-primary w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Ready to Graduate?
                    </h3>
                    <p className="text-gray-300">
                      Graduate your DEX to earn fee splits.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/graduation"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Graduate Now
                </Button>
              </div>
            </Card>
          )}

          {dexData && (
            <Card className="my-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-purple-500/20 p-2 rounded-full">
                    <div className="i-mdi:share-variant text-purple-400 w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      DEX Card Setup
                    </h3>
                    <p className="text-gray-300">
                      Configure how your DEX appears on the board page. Set up
                      description, banner, logo, and token information for
                      better visibility. Note: Your DEX card will only appear on
                      the board after graduation.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/card"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Setup DEX Card
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.brokerId !== "demo" && (
            <Card
              className={`my-6 ${
                isGraduated
                  ? "bg-gradient-to-r from-success/20 to-primary/20 border border-success/30"
                  : "bg-gradient-to-r from-warning/20 to-primary/20 border border-warning/30"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${
                      isGraduated ? "bg-success/20" : "bg-warning/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${
                        isGraduated
                          ? "i-mdi:check-circle text-success"
                          : "i-mdi:account-key text-warning"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {isGraduated ? "Graduated DEX" : "Broker ID Created"}
                    </h3>
                    <p className="text-gray-300">
                      {isGraduated ? (
                        <>
                          Your DEX is earning fee share revenue!{" "}
                          <a
                            href={
                              dexData.customDomain
                                ? `https://${dexData.customDomain}`
                                : deploymentUrl || "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-light hover:underline inline-flex items-center"
                          >
                            Log in to your DEX
                            <div className="i-mdi:open-in-new h-3.5 w-3.5 ml-1"></div>
                          </a>{" "}
                          with your admin wallet to access and withdraw your
                          earnings.
                        </>
                      ) : (
                        <>
                          Your broker ID{" "}
                          <span className="font-mono text-primary-light">
                            {dexData.brokerId}
                          </span>{" "}
                          has been created. Complete the registration process to
                          start earning fees.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/graduation"
                  variant={isGraduated ? "success" : "primary"}
                  leftIcon={
                    <div
                      className={`h-4 w-4 ${
                        isGraduated
                          ? "i-mdi:cash-multiple"
                          : "i-mdi:account-plus"
                      }`}
                    ></div>
                  }
                >
                  {isGraduated ? "View Benefits" : "Complete Registration"}
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.repoUrl && (
            <Card
              className={`my-6 ${
                isGraduated
                  ? "bg-gradient-to-r from-warning/20 to-primary/20 border border-warning/30"
                  : "bg-gradient-to-r from-gray-500/20 to-gray-400/20 border border-gray-400/30"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${
                      isGraduated ? "bg-warning/20" : "bg-gray-400/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${
                        isGraduated
                          ? "i-mdi:account-group text-warning"
                          : "i-mdi:lock text-gray-400"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Referral Settings
                    </h3>
                    <p className="text-gray-300">
                      {isGraduated
                        ? "Set up and manage your auto referral program to incentivize traders and grow your DEX community."
                        : "Referral settings become available after graduating your DEX. Graduate first to start earning revenue and enable referrals."}
                    </p>
                  </div>
                </div>
                {isGraduated ? (
                  <Button
                    as="a"
                    href="/referral"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Manage Referrals
                  </Button>
                ) : (
                  <Button
                    as="a"
                    href="/dex/graduation"
                    variant="secondary"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Graduate DEX
                  </Button>
                )}
              </div>
            </Card>
          )}

          <DexCreationStatus
            dexData={dexData}
            deploymentUrl={deploymentUrl}
            deploymentConfirmed={deploymentConfirmed}
            isForking={isForking}
            handleRetryForking={handleRetryForking}
            handleSuccessfulDeployment={handleSuccessfulDeployment}
          />

          {dexData && dexData.repoUrl && (
            <Card>
              <CustomDomainSection
                dexData={dexData}
                token={token}
                isSaving={isSaving}
                onDexDataUpdate={updateDexData}
                onSavingChange={setIsSaving}
                onShowDomainRemoveConfirm={handleShowDomainRemoveConfirm}
              />
            </Card>
          )}

          {dexData && (
            <Card>
              <h3 className="text-lg font-bold mb-4 text-red-400">
                Danger Zone
              </h3>
              <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-medium text-red-400 mb-1">
                      Delete DEX
                    </h4>
                    <p className="text-sm text-gray-400">
                      Permanently delete your DEX configuration and repository.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleShowDeleteConfirm}
                    disabled={isDeleting}
                    className="whitespace-nowrap"
                  >
                    {isDeleting ? "Deleting..." : "Delete DEX"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
