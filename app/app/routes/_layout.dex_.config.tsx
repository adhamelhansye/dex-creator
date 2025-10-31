import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import { useModal } from "../context/ModalContext";
import { putFormData, createDexFormData } from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
import { Card } from "../components/Card";
import Form from "../components/Form";
import { useNavigate, Link } from "@remix-run/react";
import DexSectionRenderer, {
  DEX_SECTIONS,
} from "../components/DexSectionRenderer";
import { useDexForm } from "../hooks/useDexForm";
import { DexData, ThemeTabType, defaultTheme } from "../types/dex";

export default function DexConfigRoute() {
  const { isAuthenticated, token, isLoading } = useAuth();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const form = useDexForm();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDexData, setIsLoadingDexData] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    async function loadData() {
      setIsLoadingDexData(true);
      try {
        const response = await form.updateDexData(token);

        if (!response) {
          navigate("/dex");
          return;
        }
      } catch (error) {
        console.error("Failed to load DEX data", error);
        navigate("/dex");
      } finally {
        setIsLoadingDexData(false);
      }
    }

    loadData();
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    if (!form.currentTheme && !form.dexData?.themeCSS) {
      form.setCurrentTheme(defaultTheme);
      form.setThemeApplied(true);
    }
  }, [form]);

  const handleApplyGeneratedTheme = (modifiedCss: string) => {
    form.setCurrentTheme(modifiedCss);
    form.setThemeApplied(true);
  };

  const handleCancelGeneratedTheme = () => {};

  const handleGenerateTheme = async () => {
    if (!token) return;

    form.setIsGeneratingTheme(true);
    await form.generateTheme(
      token,
      form.dexData?.themeCSS,
      handleApplyGeneratedTheme,
      handleCancelGeneratedTheme,
      openModal
    );
    form.setIsGeneratingTheme(false);
  };

  const handleResetTheme = () => {
    form.resetTheme(form.dexData?.themeCSS);
    form.setTradingViewColorConfig(
      form.dexData?.tradingViewColorConfig ?? null
    );
    form.setShowThemeEditor(false);
    form.setViewCssCode(false);
  };

  const handleResetToDefault = () => {
    form.resetThemeToDefault();
    form.setShowThemeEditor(false);
    form.setViewCssCode(false);
  };

  const validateAllSections = () => {
    const sectionProps = form.getSectionProps({
      handleGenerateTheme,
      handleResetTheme,
      handleResetToDefault,
      ThemeTabButton,
    });

    const validationErrors: string[] = [];

    for (const section of DEX_SECTIONS) {
      if (section.getValidationTest) {
        const isValid = section.getValidationTest(sectionProps);
        if (!isValid) {
          if (section.key === "brokerDetails") {
            const error = form.brokerNameValidator(form.brokerName.trim());
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

    const isSwapEnabled = form.enabledMenus.split(",").includes("Swap");
    if (isSwapEnabled && form.swapFeeBps === null) {
      validationErrors.push(
        "Navigation Menus: Swap fee configuration is required when Swap page is enabled"
      );
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

    setIsSaving(true);

    try {
      const { formData: formValues } = await form.getFormDataWithBase64Images();

      const imageBlobs = {
        primaryLogo: form.primaryLogo,
        secondaryLogo: form.secondaryLogo,
        favicon: form.favicon,
        pnlPosters: form.pnlPosters,
      };

      const dexDataToSend = {
        brokerName: formValues.brokerName.trim(),
        telegramLink: formValues.telegramLink.trim(),
        discordLink: formValues.discordLink.trim(),
        xLink: formValues.xLink.trim(),
        walletConnectProjectId: formValues.walletConnectProjectId.trim(),
        privyAppId: formValues.privyAppId.trim(),
        privyTermsOfUse: formValues.privyTermsOfUse.trim(),
        privyLoginMethods: formValues.privyLoginMethods.join(","),
        themeCSS: formValues.themeApplied
          ? formValues.currentTheme
          : form.dexData?.themeCSS,
        enabledMenus: formValues.enabledMenus,
        customMenus: formValues.customMenus,
        enableAbstractWallet: formValues.enableAbstractWallet,
        enableServiceDisclaimerDialog: formValues.enableServiceDisclaimerDialog,
        enableCampaigns: formValues.enableCampaigns,
        ...(formValues.swapFeeBps !== null && {
          swapFeeBps: formValues.swapFeeBps,
        }),
        chainIds: formValues.chainIds,
        defaultChain: formValues.defaultChain,
        disableMainnet: formValues.disableMainnet,
        disableTestnet: formValues.disableTestnet,
        disableEvmWallets: formValues.disableEvmWallets,
        disableSolanaWallets: formValues.disableSolanaWallets,
        tradingViewColorConfig: formValues.tradingViewColorConfig,
        availableLanguages: formValues.availableLanguages,
        seoSiteName: formValues.seoSiteName.trim(),
        seoSiteDescription: formValues.seoSiteDescription.trim(),
        seoSiteLanguage: formValues.seoSiteLanguage.trim(),
        seoSiteLocale: formValues.seoSiteLocale.trim(),
        seoTwitterHandle: formValues.seoTwitterHandle.trim(),
        seoThemeColor: formValues.seoThemeColor.trim(),
        seoKeywords: formValues.seoKeywords.trim(),
      };

      const formData = createDexFormData(dexDataToSend, imageBlobs);

      if (form.dexData && form.dexData.id) {
        const savedData = await putFormData<DexData>(
          `api/dex/${form.dexData.id}`,
          formData,
          token,
          { showToastOnError: false }
        );

        form.setDexData(savedData);
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

  const ThemeTabButton = ({
    tab,
    label,
  }: {
    tab: ThemeTabType;
    label: string;
  }) => (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        form.activeThemeTab === tab
          ? "bg-background-dark/50 text-white border-t border-l border-r border-light/10"
          : "bg-transparent text-gray-400 hover:text-white"
      }`}
      onClick={() => form.setActiveThemeTab(tab)}
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

  if (!form.dexData) {
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
          sectionProps={form.getSectionProps({
            handleGenerateTheme,
            handleResetTheme,
            handleResetToDefault,
            ThemeTabButton,
          })}
          idPrefix="config-"
        />
      </Form>
    </div>
  );
}
