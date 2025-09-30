import { useState, useEffect, FormEvent, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import { useModal } from "../context/ModalContext";
import { get, post, putFormData, createDexFormData } from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
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
import { useNavigate, Link } from "@remix-run/react";
import DexSectionRenderer, {
  DEX_SECTIONS,
} from "../components/DexSectionRenderer";
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

export default function DexConfigRoute() {
  const { isAuthenticated, token, isLoading } = useAuth();
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
  const [dexData, setDexData] = useState<DexData | null>(null);
  const [isLoadingDexData, setIsLoadingDexData] = useState(false);
  const [viewCssCode, setViewCssCode] = useState(false);

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
    if (!isAuthenticated || !token) return;

    async function fetchDexData() {
      setIsLoadingDexData(true);
      try {
        const response = await get<DexData | { exists: false }>(
          "api/dex",
          token
        );

        if (response && "exists" in response && response.exists === false) {
          navigate("/dex");
          return;
        } else if (response && "id" in response) {
          setDexData(response);
          setBrokerName(response.brokerName);
          setTelegramLink(response.telegramLink || "");
          setDiscordLink(response.discordLink || "");
          setXLink(response.xLink || "");
          setWalletConnectProjectId(response.walletConnectProjectId || "");
          setPrivyAppId(response.privyAppId || "");
          setPrivyTermsOfUse(response.privyTermsOfUse || "");
          setPrivyLoginMethods(
            response.privyLoginMethods
              ? response.privyLoginMethods.split(",").filter(Boolean)
              : ["email"]
          );
          setEnabledMenus(response.enabledMenus || "");
          setCustomMenus(response.customMenus || "");
          setEnableAbstractWallet(response.enableAbstractWallet || false);
          setEnableCampaigns(response.enableCampaigns || false);
          setDisableMainnet(response.disableMainnet || false);
          setDisableTestnet(response.disableTestnet || false);
          setDisableEvmWallets(response.disableEvmWallets || false);
          setDisableSolanaWallets(response.disableSolanaWallets || false);
          setTradingViewColorConfig(response.tradingViewColorConfig ?? null);
          setAvailableLanguages(response.availableLanguages || []);
          setSeoSiteName(response.seoSiteName || "");
          setSeoSiteDescription(response.seoSiteDescription || "");
          setSeoSiteLanguage(response.seoSiteLanguage || "");
          setSeoSiteLocale(response.seoSiteLocale || "");
          setSeoTwitterHandle(response.seoTwitterHandle || "");
          setSeoThemeColor(response.seoThemeColor || "");
          setSeoKeywords(response.seoKeywords || "");
          setViewCssCode(false);

          if (response.themeCSS) {
            setCurrentTheme(response.themeCSS);
            setThemeApplied(true);
          } else {
            setCurrentTheme(defaultTheme);
            setThemeApplied(true);
          }

          setOriginalValues({
            ...response,
            chainIds: response.chainIds || [],
            defaultChain: response.defaultChain,
            enableAbstractWallet: response.enableAbstractWallet || false,
            enableCampaigns: response.enableCampaigns || false,
            disableMainnet: response.disableMainnet || false,
            disableTestnet: response.disableTestnet || false,
            disableEvmWallets: response.disableEvmWallets || false,
            disableSolanaWallets: response.disableSolanaWallets || false,
            availableLanguages: response.availableLanguages || [],
            privyLoginMethods: response.privyLoginMethods,
            seoSiteName: response.seoSiteName,
            seoSiteDescription: response.seoSiteDescription,
            seoSiteLanguage: response.seoSiteLanguage,
            seoSiteLocale: response.seoSiteLocale,
            seoTwitterHandle: response.seoTwitterHandle,
            seoThemeColor: response.seoThemeColor,
            seoKeywords: response.seoKeywords,
          });

          setActiveThemeTab("colors");
          setChainIds(response.chainIds || []);
          setDefaultChain(response.defaultChain || undefined);
        } else {
          navigate("/dex");
        }
      } catch (error) {
        console.error("Failed to fetch DEX data", error);
        navigate("/dex");
      } finally {
        setIsLoadingDexData(false);
      }
    }

    fetchDexData();
  }, [isAuthenticated, token, navigate]);

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
      toast.error("Error generating theme. Please try again.");
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

  const handleResetSelectedColors = (selectedColors: string[]) => {
    if (!currentTheme) return;

    let updatedTheme = currentTheme;

    selectedColors.forEach(colorName => {
      const originalValue = originalValues.themeCSS;
      if (originalValue) {
        const regex = new RegExp(`--oui-color-${colorName}:\\s*([^;]+);`, "g");
        const match = originalValue.match(regex);
        if (match) {
          updatedTheme = updatedTheme.replace(
            new RegExp(`--oui-color-${colorName}:\\s*[^;]+;`, "g"),
            match[0]
          );
        }
      }
    });

    setCurrentTheme(updatedTheme);
    setThemeApplied(true);
    toast.success(
      `${selectedColors.length} color${selectedColors.length > 1 ? "s" : ""} reset to original`
    );
  };

  const handleResetSelectedColorsToDefault = (selectedColors: string[]) => {
    if (!currentTheme) return;

    let updatedTheme = currentTheme;

    selectedColors.forEach(colorName => {
      const regex = new RegExp(`--oui-color-${colorName}:\\s*([^;]+);`, "g");
      const match = defaultTheme.match(regex);
      if (match) {
        updatedTheme = updatedTheme.replace(
          new RegExp(`--oui-color-${colorName}:\\s*[^;]+;`, "g"),
          match[0]
        );
      }
    });

    setCurrentTheme(updatedTheme);
    setThemeApplied(true);
    toast.success(
      `${selectedColors.length} color${selectedColors.length > 1 ? "s" : ""} reset to default`
    );
  };

  const toggleThemeEditor = () => {
    setShowThemeEditor(!showThemeEditor);
  };

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
      handleResetSelectedColors,
      handleResetSelectedColorsToDefault,
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
        const savedData = await putFormData<DexData>(
          `api/dex/${dexData.id}`,
          formData,
          token,
          { showToastOnError: false }
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

        setDexData(savedData);
        toast.success("DEX configuration updated successfully!");
        navigate("/dex#dex-creation-status");
      }
    } catch (error) {
      console.error("Error updating DEX:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update DEX configuration";

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
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

  const urlValidator = validateUrl();
  const brokerNameValidator = composeValidators(
    required("Broker name"),
    minLength(3, "Broker name"),
    maxLength(30, "Broker name"),
    alphanumericWithSpecialChars("Broker name")
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

  if (isLoading || isLoadingDexData) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4 mt-26 pb-52">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <div className="text-base md:text-lg mb-2">
            Loading DEX Configuration
          </div>
          <div className="text-xs md:text-sm text-gray-400">
            Please wait while we fetch your settings
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
            DEX Configuration
          </h1>
          <Card>
            <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
              Authentication Required
            </h2>
            <p className="mb-4 md:mb-6 text-sm md:text-base text-gray-300">
              Please connect your wallet and login to access DEX configuration.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!dexData) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 mt-26 pb-52">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6">
            DEX Configuration
          </h1>
          <Card>
            <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
              No DEX Found
            </h2>
            <p className="mb-4 md:mb-6 text-sm md:text-base text-gray-300">
              You need to create a DEX first before you can configure it.
            </p>
            <div className="flex justify-center">
              <Link to="/dex" className="btn-connect">
                Create Your DEX
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl mt-26 pb-52">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <Link
            to="/dex"
            className="text-sm text-gray-400 hover:text-primary-light mb-2 inline-flex items-center"
          >
            <div className="i-mdi:arrow-left h-4 w-4 mr-1"></div>
            Back to DEX Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">
            DEX Configuration
          </h1>
        </div>
      </div>

      <Form
        onSubmit={handleSubmit}
        className="space-y-6"
        submitText="Update DEX Configuration"
        isLoading={isSaving}
        loadingText="Saving"
        disabled={false}
        enableRateLimit={true}
      >
        <DexSectionRenderer
          mode="direct"
          sections={DEX_SECTIONS}
          showProgressTracker={true}
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
            handleResetSelectedColors,
            handleResetSelectedColorsToDefault,
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
          idPrefix="config-"
        />
      </Form>
    </div>
  );
}
